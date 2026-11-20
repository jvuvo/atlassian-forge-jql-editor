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
export declare const MAX_JQL_SUGGESTIONS = 15;
export declare const EMPTY_JQL_CATALOG: JqlAutocompleteCatalog;
/**
 * Resolve where to insert. Forge TextArea often omits or falsely reports
 * `selectionStart` as 0, so fall back to the end of the string (last index).
 *
 * - reliable caret → insert at that index (text appends before the after-cursor slice)
 * - missing / untrusted caret → `jql.length`
 */
export declare function resolveInsertIndex(jql: string, reportedCursor?: number | null, previousJql?: string): number;
/** Text before the insert index (defaults to full string when caret is omitted/untrusted). */
export declare function textBeforeCursor(jql: string, cursor?: number | null, previousJql?: string): string;
/**
 * Incomplete token ending at the caret (or end of string).
 * Handles an open double-quoted value before the caret.
 */
export declare function getTrailingToken(jql: string, cursor?: number | null, previousJql?: string): TrailingToken;
/** Normalize Jira autocomplete operators (`is not` → `IS NOT`). */
export declare function normalizeOperator(op: string): string;
export declare function findFieldMeta(name: string, catalog: JqlAutocompleteCatalog): JqlFieldMeta | undefined;
export declare function fieldSupportsAutocomplete(fieldName: string, catalog: JqlAutocompleteCatalog): boolean;
/**
 * Insert at a resolved index (caret when trusted, else end of TextArea value).
 * After `field <op>`, values are always placed after the operator.
 */
export declare function applySuggestion(jql: string, suggestion: string, cursor?: number | null, previousJql?: string): ApplySuggestionResult;
/**
 * Detect `field operator partialValue` ending at the caret for value suggestions.
 * Supports list forms: `project in (`, `project in (TDS, FO`.
 */
export declare function parseValueSuggestionContext(jql: string, cursor?: number | null, previousJql?: string): {
    fieldName: string;
    fieldValue: string;
} | null;
/**
 * Classify caret position so the popup shows fields, operators, or values.
 */
export declare function parseSuggestContext(jql: string, catalog?: JqlAutocompleteCatalog, cursor?: number | null, previousJql?: string): SuggestContextKind;
export declare function buildLocalJqlSuggestions(jql: string, catalog: JqlAutocompleteCatalog, valueResults?: SuggestionApiResult[], cursor?: number | null, previousJql?: string): JqlSuggestion[];
/**
 * Map `POST /jql/parse` query result into UI feedback.
 */
export declare function mapJqlParseQuery(query: {
    errors?: string[];
    warnings?: string[];
} | null | undefined): JqlParseFeedback;
/**
 * Best-effort caret from a Forge UI Kit input event.
 * Returns null when the platform does not expose a usable selectionStart.
 */
export declare function readSelectionStart(target: {
    selectionStart?: number | null;
    value?: string;
} | null | undefined): number | null;
/**
 * Prefer a live caret when trusted; otherwise use the end of the current value.
 */
export declare function rememberInsertIndex(jql: string, reportedCursor: number | null, previousJql: string): number;
/**
 * Move the caret in a real DOM textarea when the runtime exposes one.
 * Forge UI Kit may not support this; callers should still keep an internal insert index.
 */
export declare function setTextAreaCaret(position: number, options?: {
    id?: string;
    name?: string;
}): boolean;
//# sourceMappingURL=jqlSuggest.d.ts.map