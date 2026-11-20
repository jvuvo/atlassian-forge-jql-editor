export type JqlSuggestion = {
  label: string;
  value: string;
};

export type TrailingToken = {
  token: string;
  start: number;
};

export type JqlFieldMeta = {
  value: string;
  displayName: string;
  operators: string[];
  auto: boolean;
};

export type JqlFunctionMeta = {
  value: string;
  displayName: string;
};

export type JqlAutocompleteCatalog = {
  fields: JqlFieldMeta[];
  functions: JqlFunctionMeta[];
  reservedWords: string[];
};

export type SuggestionApiResult = {
  displayName?: string;
  value?: string;
};

export type ApplySuggestionResult = {
  jql: string;
  cursor: number;
};

/** What the suggestion popup should offer at the caret. */
export type SuggestContextKind = 'field' | 'operator' | 'value';

export type JqlParseFeedback = {
  valid: boolean;
  errors: string[];
  warnings: string[];
};

const FALLBACK_OPERATORS = [
  '=',
  '!=',
  '~',
  '!~',
  'IN',
  'NOT IN',
  'IS',
  'IS NOT',
  '>',
  '>=',
  '<',
  '<=',
];
const FALLBACK_JUNCTION_KEYWORDS = ['AND', 'OR', 'ORDER BY'];
const OPERATOR_PATTERN = '=|!=|~|!~|IN|NOT\\s+IN|IS|IS\\s+NOT|>|>=|<|<=';
export const MAX_JQL_SUGGESTIONS = 15;

export const EMPTY_JQL_CATALOG: JqlAutocompleteCatalog = {
  fields: [],
  functions: [],
  reservedWords: [],
};

/**
 * Resolve where to insert. Forge TextArea often omits or falsely reports
 * `selectionStart` as 0, so fall back to the end of the string (last index).
 *
 * - reliable caret → insert at that index (text appends before the after-cursor slice)
 * - missing / untrusted caret → `jql.length`
 */
export function resolveInsertIndex(
  jql: string,
  reportedCursor?: number | null,
  previousJql?: string
): number {
  const text = jql ?? '';
  const end = text.length;

  if (reportedCursor == null || Number.isNaN(reportedCursor)) {
    return end;
  }

  const clamped = Math.max(0, Math.min(reportedCursor, end));

  // Empty field: only valid caret is 0.
  if (end === 0) {
    return 0;
  }

  // Classic Forge false reading: selectionStart is 0 while the user is appending.
  if (
    clamped === 0 &&
    previousJql != null &&
    text.startsWith(previousJql) &&
    text.length > previousJql.length
  ) {
    return end;
  }

  // Bare 0 on non-empty text with no prior value is usually unreliable in UI Kit.
  if (clamped === 0 && previousJql == null) {
    return end;
  }

  // Popup/blur often reports caret 0 while the value did not change (suggestion click).
  if (clamped === 0 && end > 0 && previousJql != null && text === previousJql) {
    return end;
  }

  return clamped;
}

/** Text before the insert index (defaults to full string when caret is omitted/untrusted). */
export function textBeforeCursor(
  jql: string,
  cursor?: number | null,
  previousJql?: string
): string {
  const text = jql ?? '';
  return text.slice(0, resolveInsertIndex(text, cursor, previousJql));
}

/**
 * Incomplete token ending at the caret (or end of string).
 * Handles an open double-quoted value before the caret.
 */
export function getTrailingToken(
  jql: string,
  cursor?: number | null,
  previousJql?: string
): TrailingToken {
  const text = textBeforeCursor(jql, cursor, previousJql);
  if (!text) {
    return { token: '', start: 0 };
  }

  const openQuote = text.lastIndexOf('"');
  if (openQuote >= 0) {
    const beforeQuote = text.slice(0, openQuote);
    const quoteCount = (beforeQuote.match(/"/g) ?? []).length;
    const insideOpenQuote = quoteCount % 2 === 0;
    if (insideOpenQuote) {
      return {
        token: text.slice(openQuote + 1),
        start: openQuote + 1,
      };
    }
  }

  const match = text.match(/(?:^|[\s(])([^\s(]*)$/);
  if (!match || match.index == null) {
    return { token: '', start: text.length };
  }
  const token = match[1] ?? '';
  const start = text.length - token.length;
  return { token, start };
}

/** Normalize Jira autocomplete operators (`is not` → `IS NOT`). */
export function normalizeOperator(op: string): string {
  const trimmed = op.trim();
  if (!trimmed) {
    return '';
  }
  if (/^[=!<>~]+$/.test(trimmed)) {
    return trimmed;
  }
  return trimmed.replace(/\s+/g, ' ').toUpperCase();
}

export function findFieldMeta(
  name: string,
  catalog: JqlAutocompleteCatalog
): JqlFieldMeta | undefined {
  const lower = name.toLowerCase();
  return catalog.fields.find((field) => field.value.toLowerCase() === lower);
}

export function fieldSupportsAutocomplete(
  fieldName: string,
  catalog: JqlAutocompleteCatalog
): boolean {
  const field = findFieldMeta(fieldName, catalog);
  // Unknown fields: still try suggestions (API may know them).
  if (!field) {
    return true;
  }
  return field.auto;
}

function operatorsForField(
  fieldName: string | null,
  catalog: JqlAutocompleteCatalog
): string[] {
  if (!fieldName) {
    return FALLBACK_OPERATORS;
  }
  const field = findFieldMeta(fieldName, catalog);
  if (!field?.operators?.length) {
    return FALLBACK_OPERATORS;
  }
  const normalized = field.operators.map(normalizeOperator).filter(Boolean);
  return normalized.length > 0 ? normalized : FALLBACK_OPERATORS;
}

function fieldNameBeforeOperator(
  jql: string,
  cursor?: number | null,
  previousJql?: string
): string | null {
  const before = textBeforeCursor(jql, cursor, previousJql).trimEnd();
  const match = before.match(/(?:^|[\s(])([A-Za-z][\w.]*)\s*(?:[!<>~=A-Za-z].*)?$/);
  if (!match) {
    return null;
  }
  // Prefer explicit field + optional partial op
  const withOp = before.match(
    new RegExp(`(?:^|[\\s(])([A-Za-z][\\w.]*)\\s+(?:${OPERATOR_PATTERN}|[!<>~]|IN|NOT|IS)?$`, 'i')
  );
  if (withOp) {
    return withOp[1];
  }
  const bare = before.match(/(?:^|[\s(])([A-Za-z][\w.]*)$/);
  return bare?.[1] ?? match[1] ?? null;
}

const JQL_CLAUSE_OPS = new Set(
  FALLBACK_OPERATORS.map((op) => op.toUpperCase()).concat(['AND', 'OR', 'ORDER BY'])
);

function formatJqlValue(value: string, alreadyInQuotes: boolean): string {
  // Head already contains the opening quote when alreadyInQuotes is true.
  if (alreadyInQuotes) {
    return `${value.replace(/"/g, '\\"')}"`;
  }
  if (/^[A-Za-z0-9_]+$/.test(value)) {
    return value;
  }
  return `"${value.replace(/"/g, '\\"')}"`;
}

function isClauseOperatorOrKeyword(value: string): boolean {
  return JQL_CLAUSE_OPS.has(value.trim().toUpperCase());
}

/**
 * Last `field <op> ["?]` ending at `before`, so multi-clause JQL replaces the
 * current value — not the first `field =` in the string.
 */
function findValueClauseHead(before: string): { head: string; openQuote: boolean } | null {
  const re = new RegExp(
    `(?:^|[\\s(])([A-Za-z][\\w.]*)\\s*(${OPERATOR_PATTERN})\\s*("?)`,
    'gi'
  );
  let last: RegExpExecArray | null = null;
  let match: RegExpExecArray | null;
  while ((match = re.exec(before)) !== null) {
    last = match;
    if (match[0].length === 0) {
      re.lastIndex += 1;
    }
  }
  if (!last || last.index == null) {
    return null;
  }
  const headEnd = last.index + last[0].length;
  const remainder = before.slice(headEnd);
  // Remainder must be an in-progress value (no new clause keywords).
  if (/\b(?:AND|OR|ORDER)\b/i.test(remainder)) {
    return null;
  }
  return {
    head: before.slice(0, headEnd),
    openQuote: last[3] === '"',
  };
}

/**
 * Insert at a resolved index (caret when trusted, else end of TextArea value).
 * After `field <op>`, values are always placed after the operator.
 */
export function applySuggestion(
  jql: string,
  suggestion: string,
  cursor?: number | null,
  previousJql?: string
): ApplySuggestionResult {
  const text = jql ?? '';
  const value = suggestion.trimEnd();
  // Always resolve — raw selectionStart 0 from popup/blur must not win.
  const insertAt = resolveInsertIndex(text, cursor, previousJql);
  if (!value) {
    return { jql: text, cursor: insertAt };
  }

  const before = text.slice(0, insertAt);
  const after = text.slice(insertAt);

  // field <operator> [partial] → put the value after the *last* operator (replace partial).
  const valuePosition = findValueClauseHead(before);
  if (valuePosition && !isClauseOperatorOrKeyword(value)) {
    const { head, openQuote } = valuePosition;
    const rendered = formatJqlValue(value, openQuote);
    const spacer = !openQuote && !/\s$/.test(head) ? ' ' : '';
    const nextBefore = `${head}${spacer}${rendered} `;
    return {
      jql: `${nextBefore}${after}`,
      cursor: nextBefore.length,
    };
  }

  const { token, start } = getTrailingToken(before);

  let nextBefore: string;
  if (token && value.toLowerCase().startsWith(token.toLowerCase())) {
    nextBefore = `${before.slice(0, start)}${value} `;
  } else {
    const needsSpace = before.length > 0 && !/\s$/.test(before);
    nextBefore = `${before}${needsSpace ? ' ' : ''}${value} `;
  }

  return {
    jql: `${nextBefore}${after}`,
    cursor: nextBefore.length,
  };
}

function isListOperator(operator: string): boolean {
  return /^(IN|NOT\s+IN)$/i.test(operator.trim());
}

/** True when caret is inside an unclosed `IN (` / `NOT IN (` list. */
function isInsideOpenValueList(text: string, operator: string): boolean {
  if (!isListOperator(operator)) {
    return false;
  }
  const listStart = text.match(new RegExp(`(?:^|[\\s(])[A-Za-z][\\w.]*\\s*(?:${OPERATOR_PATTERN})\\s*\\(`, 'i'));
  if (!listStart || listStart.index == null) {
    return false;
  }
  const fromList = text.slice(listStart.index + listStart[0].length - 1); // from '('
  const close = fromList.indexOf(')');
  return close < 0;
}

/**
 * Detect `field operator partialValue` ending at the caret for value suggestions.
 * Supports list forms: `project in (`, `project in (TDS, FO`.
 */
export function parseValueSuggestionContext(
  jql: string,
  cursor?: number | null,
  previousJql?: string
): {
  fieldName: string;
  fieldValue: string;
} | null {
  const before = textBeforeCursor(jql, cursor, previousJql);
  const text = before.trimEnd();
  // Optional `(` after IN/NOT IN, and prior list items (`A, B, `) before the partial.
  const match = text.match(
    new RegExp(
      `(?:^|[\\s(])([A-Za-z][\\w.]*)\\s*(${OPERATOR_PATTERN})\\s*(?:\\(\\s*(?:[^\\)]*,\\s*)*)?"?([^,"\\n)]*)$`,
      'i'
    )
  );
  if (!match) {
    return null;
  }
  const fieldName = match[1];
  const operator = match[2] ?? '';
  let fieldValue = match[3] ?? '';
  const insideList = isInsideOpenValueList(text, operator);

  // Value then trailing space → next clause, unless still inside `IN (...)`.
  if (/\s$/.test(before) && fieldValue.length > 0) {
    if (insideList) {
      fieldValue = '';
    } else {
      return null;
    }
  }

  return {
    fieldName,
    fieldValue,
  };
}

function isKnownField(name: string, catalog: JqlAutocompleteCatalog): boolean {
  return findFieldMeta(name, catalog) != null;
}

/**
 * Classify caret position so the popup shows fields, operators, or values.
 */
export function parseSuggestContext(
  jql: string,
  catalog: JqlAutocompleteCatalog = EMPTY_JQL_CATALOG,
  cursor?: number | null,
  previousJql?: string
): SuggestContextKind {
  if (parseValueSuggestionContext(jql, cursor, previousJql)) {
    return 'value';
  }

  const before = textBeforeCursor(jql, cursor, previousJql);
  const trimmed = before.trimEnd();
  if (!trimmed) {
    return 'field';
  }

  // `status ` → operators (not after AND/OR which start the next clause)
  const fieldThenSpace = before.match(/(?:^|[\s(])([A-Za-z][\w.]*)\s+$/);
  if (fieldThenSpace) {
    const name = fieldThenSpace[1];
    const upper = name.toUpperCase();
    if (upper === 'AND' || upper === 'OR' || upper === 'ORDER') {
      return 'field';
    }
    if (isKnownField(name, catalog) || /^[A-Za-z][\w.]*$/.test(name)) {
      return 'operator';
    }
  }

  // `status !` / `status IN` → operators (partial)
  const fieldOpPartial = trimmed.match(
    new RegExp(`(?:^|[\\s(])([A-Za-z][\\w.]*)\\s+(${OPERATOR_PATTERN}|[!<>~]|IN|NOT|IS)$`, 'i')
  );
  if (fieldOpPartial) {
    return 'operator';
  }

  // Exact catalog field with no trailing space → operators (+ longer field names in build)
  const trailing = getTrailingToken(jql, cursor, previousJql).token;
  if (trailing && isKnownField(trailing, catalog) && !/\s$/.test(before)) {
    return 'operator';
  }

  return 'field';
}

function prefixMatches(candidate: string, prefix: string): boolean {
  if (!prefix) {
    return true;
  }
  return candidate.toLowerCase().startsWith(prefix.toLowerCase());
}

function pushUnique(
  target: JqlSuggestion[],
  seen: Set<string>,
  label: string,
  value: string
): void {
  const key = value.toLowerCase();
  if (!value || seen.has(key) || target.length >= MAX_JQL_SUGGESTIONS) {
    return;
  }
  seen.add(key);
  target.push({ label, value });
}

function stripHtml(text: string): string {
  return text.replace(/<[^>]*>/g, '');
}

function junctionKeywords(catalog: JqlAutocompleteCatalog): string[] {
  const reserved = catalog.reservedWords
    .map((word) => word.trim().toUpperCase())
    .filter((word) => word === 'AND' || word === 'OR');
  const keywords = [...FALLBACK_JUNCTION_KEYWORDS];
  for (const word of reserved) {
    if (!keywords.includes(word)) {
      keywords.push(word);
    }
  }
  return keywords;
}

function valueKeywordsForField(fieldName: string, catalog: JqlAutocompleteCatalog): string[] {
  const ops = operatorsForField(fieldName, catalog).map((op) => op.toUpperCase());
  const keywords: string[] = [];
  if (ops.some((op) => op === 'IS' || op === 'IS NOT')) {
    keywords.push('EMPTY', 'NULL');
  }
  keywords.push('currentUser()');
  return keywords;
}

export function buildLocalJqlSuggestions(
  jql: string,
  catalog: JqlAutocompleteCatalog,
  valueResults: SuggestionApiResult[] = [],
  cursor?: number | null,
  previousJql?: string
): JqlSuggestion[] {
  const trailing = getTrailingToken(jql, cursor, previousJql).token;
  const kind = parseSuggestContext(jql, catalog, cursor, previousJql);
  const suggestions: JqlSuggestion[] = [];
  const seen = new Set<string>();

  if (kind === 'value') {
    const valueCtx = parseValueSuggestionContext(jql, cursor, previousJql);
    for (const result of valueResults) {
      const value = result.value?.trim();
      if (!value) {
        continue;
      }
      const label = stripHtml(result.displayName?.trim() || value);
      pushUnique(suggestions, seen, label, value);
    }
    const valueKeywords = valueKeywordsForField(valueCtx?.fieldName ?? '', catalog);
    if (trailing) {
      for (const keyword of valueKeywords) {
        if (prefixMatches(keyword, trailing)) {
          pushUnique(suggestions, seen, keyword, keyword);
        }
      }
    } else if (suggestions.length === 0) {
      for (const keyword of valueKeywords) {
        pushUnique(suggestions, seen, keyword, keyword);
      }
    }
    return suggestions;
  }

  if (kind === 'operator') {
    const before = textBeforeCursor(jql, cursor, previousJql);
    const fieldName = fieldNameBeforeOperator(jql, cursor, previousJql);
    // Partial op after `field ` (e.g. `status !`); empty when caret is right after the field/space.
    const partialMatch = before.match(/(?:^|[\s(])[A-Za-z][\w.]*\s+([=!<>~A-Za-z][^\s]*)$/);
    const partial = partialMatch?.[1] ?? '';
    for (const op of operatorsForField(fieldName, catalog)) {
      if (prefixMatches(op, partial)) {
        pushUnique(suggestions, seen, op, op);
      }
    }
    // Exact field without space: also offer longer field names (status → statusCategory).
    if (trailing && !/\s$/.test(before)) {
      for (const field of catalog.fields) {
        if (
          prefixMatches(field.value, trailing) &&
          field.value.toLowerCase() !== trailing.toLowerCase()
        ) {
          pushUnique(suggestions, seen, field.displayName || field.value, field.value);
        }
      }
    }
    return suggestions;
  }

  // Field / next-clause context
  for (const field of catalog.fields) {
    if (prefixMatches(field.value, trailing) || prefixMatches(field.displayName, trailing)) {
      pushUnique(suggestions, seen, field.displayName || field.value, field.value);
    }
  }

  for (const keyword of junctionKeywords(catalog)) {
    if (prefixMatches(keyword, trailing)) {
      pushUnique(suggestions, seen, keyword, keyword);
    }
  }

  for (const fn of catalog.functions) {
    if (prefixMatches(fn.value, trailing) || prefixMatches(fn.displayName, trailing)) {
      pushUnique(suggestions, seen, fn.displayName || fn.value, fn.value);
    }
  }

  return suggestions;
}

/**
 * Map `POST /jql/parse` query result into UI feedback.
 */
export function mapJqlParseQuery(query: {
  errors?: string[];
  warnings?: string[];
} | null | undefined): JqlParseFeedback {
  const errors = (query?.errors ?? []).map((item) => String(item).trim()).filter(Boolean);
  const warnings = (query?.warnings ?? []).map((item) => String(item).trim()).filter(Boolean);
  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}

/**
 * Best-effort caret from a Forge UI Kit input event.
 * Returns null when the platform does not expose a usable selectionStart.
 */
export function readSelectionStart(
  target: { selectionStart?: number | null; value?: string } | null | undefined
): number | null {
  if (!target || typeof target.selectionStart !== 'number') {
    return null;
  }
  const valueLength = typeof target.value === 'string' ? target.value.length : undefined;
  if (valueLength != null && (target.selectionStart < 0 || target.selectionStart > valueLength)) {
    return null;
  }
  return target.selectionStart;
}

/**
 * Prefer a live caret when trusted; otherwise use the end of the current value.
 */
export function rememberInsertIndex(
  jql: string,
  reportedCursor: number | null,
  previousJql: string
): number {
  return resolveInsertIndex(jql, reportedCursor, previousJql);
}

/**
 * Move the caret in a real DOM textarea when the runtime exposes one.
 * Forge UI Kit may not support this; callers should still keep an internal insert index.
 */
export function setTextAreaCaret(
  position: number,
  options: { id?: string; name?: string } = {}
): boolean {
  if (typeof document === 'undefined') {
    return false;
  }
  try {
    const byId = options.id ? document.getElementById(options.id) : null;
    const byName = options.name
      ? document.querySelector(`textarea[name="${options.name}"]`)
      : null;
    const el = (byId ?? byName) as HTMLTextAreaElement | null;
    if (!el || typeof el.setSelectionRange !== 'function') {
      return false;
    }
    const capped = Math.max(0, Math.min(position, el.value.length));
    el.focus();
    el.setSelectionRange(capped, capped);
    return true;
  } catch {
    return false;
  }
}
