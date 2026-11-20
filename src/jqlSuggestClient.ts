import { requestJira } from '@forge/bridge';
import {
  buildLocalJqlSuggestions,
  EMPTY_JQL_CATALOG,
  fieldSupportsAutocomplete,
  mapJqlParseQuery,
  MAX_JQL_SUGGESTIONS,
  parseValueSuggestionContext,
  type JqlAutocompleteCatalog,
  type JqlFieldMeta,
  type JqlFunctionMeta,
  type JqlParseFeedback,
  type JqlSuggestion,
  type SuggestionApiResult,
} from './jqlSuggest';

type AutocompleteField = {
  value?: string;
  displayName?: string;
  operators?: string[];
  auto?: string | boolean;
  searchable?: string | boolean;
};

type AutocompleteDataResponse = {
  visibleFieldNames?: AutocompleteField[];
  visibleFunctionNames?: AutocompleteField[];
  jqlReservedWords?: string[];
};

type ParsedJqlQueriesResponse = {
  queries?: Array<{
    query?: string;
    errors?: string[];
    warnings?: string[];
  }>;
};

type SuggestJqlOptions = {
  projectKey?: string | null;
};

let catalogCacheKey: string | null = null;
let catalogCache: JqlAutocompleteCatalog | null = null;
const projectIdCache = new Map<string, number | null>();

export function resetJqlAutocompleteCache(): void {
  catalogCache = null;
  catalogCacheKey = null;
  projectIdCache.clear();
}

function isTruthyFlag(value: string | boolean | undefined): boolean {
  if (typeof value === 'boolean') {
    return value;
  }
  if (typeof value === 'string') {
    return value.toLowerCase() === 'true';
  }
  return false;
}

function mapFields(fields: AutocompleteField[] | undefined): JqlFieldMeta[] {
  if (!fields?.length) {
    return [];
  }
  return fields
    .map((field) => {
      const value = field.value?.trim() || '';
      if (!value) {
        return null;
      }
      const displayName = field.displayName?.trim() || value;
      const mapped: JqlFieldMeta = {
        value,
        displayName,
        operators: (field.operators ?? []).map((op) => String(op)),
        auto: isTruthyFlag(field.auto),
      };
      return mapped;
    })
    .filter((field): field is JqlFieldMeta => field != null);
}

function mapFunctions(fields: AutocompleteField[] | undefined): JqlFunctionMeta[] {
  if (!fields?.length) {
    return [];
  }
  return fields
    .map((field) => {
      const value = field.value?.trim() || '';
      if (!value) {
        return null;
      }
      const mapped: JqlFunctionMeta = {
        value,
        displayName: field.displayName?.trim() || value,
      };
      return mapped;
    })
    .filter((field): field is JqlFunctionMeta => field != null);
}

function catalogFromResponse(data: AutocompleteDataResponse): JqlAutocompleteCatalog {
  return {
    fields: mapFields(data.visibleFieldNames),
    functions: mapFunctions(data.visibleFunctionNames),
    reservedWords: (data.jqlReservedWords ?? []).map((word) => String(word)).filter(Boolean),
  };
}

async function resolveProjectId(projectKey: string): Promise<number | null> {
  if (projectIdCache.has(projectKey)) {
    return projectIdCache.get(projectKey) ?? null;
  }
  try {
    const response = await requestJira(
      `/rest/api/3/project/${encodeURIComponent(projectKey)}`,
      {
        method: 'GET',
        headers: { Accept: 'application/json' },
      }
    );
    if (!response.ok) {
      projectIdCache.set(projectKey, null);
      return null;
    }
    const data = (await response.json()) as { id?: string | number };
    const id = data.id != null ? Number(data.id) : NaN;
    const resolved = Number.isFinite(id) ? id : null;
    projectIdCache.set(projectKey, resolved);
    return resolved;
  } catch {
    projectIdCache.set(projectKey, null);
    return null;
  }
}

async function fetchGlobalCatalog(): Promise<JqlAutocompleteCatalog> {
  const response = await requestJira('/rest/api/3/jql/autocompletedata', {
    method: 'GET',
    headers: { Accept: 'application/json' },
  });
  if (!response.ok) {
    return { ...EMPTY_JQL_CATALOG };
  }
  const data = (await response.json()) as AutocompleteDataResponse;
  return catalogFromResponse(data);
}

async function fetchProjectCatalog(projectId: number): Promise<JqlAutocompleteCatalog> {
  const response = await requestJira('/rest/api/3/jql/autocompletedata', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      includeCollapsedFields: true,
      projectIds: [projectId],
    }),
  });
  if (!response.ok) {
    return fetchGlobalCatalog();
  }
  const data = (await response.json()) as AutocompleteDataResponse;
  return catalogFromResponse(data);
}

async function loadJqlAutocompleteCatalog(
  projectKey?: string | null
): Promise<JqlAutocompleteCatalog> {
  const scopedKey =
    projectKey && projectKey !== '-1' ? `project:${projectKey}` : 'global';
  if (catalogCache && catalogCacheKey === scopedKey) {
    return catalogCache;
  }

  let catalog: JqlAutocompleteCatalog;
  if (projectKey && projectKey !== '-1') {
    const projectId = await resolveProjectId(projectKey);
    catalog = projectId != null ? await fetchProjectCatalog(projectId) : await fetchGlobalCatalog();
  } else {
    catalog = await fetchGlobalCatalog();
  }

  catalogCache = catalog;
  catalogCacheKey = scopedKey;
  return catalog;
}

async function fetchFieldValueSuggestions(
  fieldName: string,
  fieldValue: string
): Promise<SuggestionApiResult[]> {
  const params = new URLSearchParams({
    fieldName,
    fieldValue,
  });
  const response = await requestJira(
    `/rest/api/3/jql/autocompletedata/suggestions?${params.toString()}`,
    {
      method: 'GET',
      headers: { Accept: 'application/json' },
    }
  );
  if (!response.ok) {
    return [];
  }
  const data = (await response.json()) as { results?: SuggestionApiResult[] };
  return data.results ?? [];
}

/** Fetch JQL suggestions via Forge bridge `requestJira` (current user), scoped to insert index. */
export async function suggestJql(
  jql: string,
  cursor?: number | null,
  previousJql?: string,
  options: SuggestJqlOptions = {}
): Promise<JqlSuggestion[]> {
  const catalog = await loadJqlAutocompleteCatalog(options.projectKey);
  const trimmed = (jql ?? '').trim();
  if (!trimmed) {
    return catalog.fields.slice(0, MAX_JQL_SUGGESTIONS).map((field) => ({
      label: field.displayName || field.value,
      value: field.value,
    }));
  }

  const valueContext = parseValueSuggestionContext(jql, cursor, previousJql);
  let valueResults: SuggestionApiResult[] = [];
  if (valueContext && fieldSupportsAutocomplete(valueContext.fieldName, catalog)) {
    try {
      valueResults = await fetchFieldValueSuggestions(
        valueContext.fieldName,
        valueContext.fieldValue
      );
    } catch {
      valueResults = [];
    }
  }

  return buildLocalJqlSuggestions(jql, catalog, valueResults, cursor, previousJql);
}

/**
 * Live JQL validation via `POST /rest/api/3/jql/parse?validation=strict`.
 */
export async function parseJql(jql: string): Promise<JqlParseFeedback> {
  const trimmed = (jql ?? '').trim();
  if (!trimmed) {
    return { valid: true, errors: [], warnings: [] };
  }

  const response = await requestJira('/rest/api/3/jql/parse?validation=strict', {
    method: 'POST',
    headers: {
      Accept: 'application/json',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ queries: [trimmed] }),
  });
  if (!response.ok) {
    return {
      valid: false,
      errors: [`JQL validation failed (${response.status}).`],
      warnings: [],
    };
  }

  const data = (await response.json()) as ParsedJqlQueriesResponse;
  return mapJqlParseQuery(data.queries?.[0]);
}
