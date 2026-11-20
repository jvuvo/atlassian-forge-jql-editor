"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetJqlAutocompleteCache = resetJqlAutocompleteCache;
exports.suggestJql = suggestJql;
exports.parseJql = parseJql;
const bridge_1 = require("@forge/bridge");
const jqlSuggest_1 = require("./jqlSuggest");
let catalogCacheKey = null;
let catalogCache = null;
const projectIdCache = new Map();
function resetJqlAutocompleteCache() {
    catalogCache = null;
    catalogCacheKey = null;
    projectIdCache.clear();
}
function isTruthyFlag(value) {
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        return value.toLowerCase() === 'true';
    }
    return false;
}
function mapFields(fields) {
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
        const mapped = {
            value,
            displayName,
            operators: (field.operators ?? []).map((op) => String(op)),
            auto: isTruthyFlag(field.auto),
        };
        return mapped;
    })
        .filter((field) => field != null);
}
function mapFunctions(fields) {
    if (!fields?.length) {
        return [];
    }
    return fields
        .map((field) => {
        const value = field.value?.trim() || '';
        if (!value) {
            return null;
        }
        const mapped = {
            value,
            displayName: field.displayName?.trim() || value,
        };
        return mapped;
    })
        .filter((field) => field != null);
}
function catalogFromResponse(data) {
    return {
        fields: mapFields(data.visibleFieldNames),
        functions: mapFunctions(data.visibleFunctionNames),
        reservedWords: (data.jqlReservedWords ?? []).map((word) => String(word)).filter(Boolean),
    };
}
async function resolveProjectId(projectKey) {
    if (projectIdCache.has(projectKey)) {
        return projectIdCache.get(projectKey) ?? null;
    }
    try {
        const response = await (0, bridge_1.requestJira)(`/rest/api/3/project/${encodeURIComponent(projectKey)}`, {
            method: 'GET',
            headers: { Accept: 'application/json' },
        });
        if (!response.ok) {
            projectIdCache.set(projectKey, null);
            return null;
        }
        const data = (await response.json());
        const id = data.id != null ? Number(data.id) : NaN;
        const resolved = Number.isFinite(id) ? id : null;
        projectIdCache.set(projectKey, resolved);
        return resolved;
    }
    catch {
        projectIdCache.set(projectKey, null);
        return null;
    }
}
async function fetchGlobalCatalog() {
    const response = await (0, bridge_1.requestJira)('/rest/api/3/jql/autocompletedata', {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        return { ...jqlSuggest_1.EMPTY_JQL_CATALOG };
    }
    const data = (await response.json());
    return catalogFromResponse(data);
}
async function fetchProjectCatalog(projectId) {
    const response = await (0, bridge_1.requestJira)('/rest/api/3/jql/autocompletedata', {
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
    const data = (await response.json());
    return catalogFromResponse(data);
}
async function loadJqlAutocompleteCatalog(projectKey) {
    const scopedKey = projectKey && projectKey !== '-1' ? `project:${projectKey}` : 'global';
    if (catalogCache && catalogCacheKey === scopedKey) {
        return catalogCache;
    }
    let catalog;
    if (projectKey && projectKey !== '-1') {
        const projectId = await resolveProjectId(projectKey);
        catalog = projectId != null ? await fetchProjectCatalog(projectId) : await fetchGlobalCatalog();
    }
    else {
        catalog = await fetchGlobalCatalog();
    }
    catalogCache = catalog;
    catalogCacheKey = scopedKey;
    return catalog;
}
async function fetchFieldValueSuggestions(fieldName, fieldValue) {
    const params = new URLSearchParams({
        fieldName,
        fieldValue,
    });
    const response = await (0, bridge_1.requestJira)(`/rest/api/3/jql/autocompletedata/suggestions?${params.toString()}`, {
        method: 'GET',
        headers: { Accept: 'application/json' },
    });
    if (!response.ok) {
        return [];
    }
    const data = (await response.json());
    return data.results ?? [];
}
/** Fetch JQL suggestions via Forge bridge `requestJira` (current user), scoped to insert index. */
async function suggestJql(jql, cursor, previousJql, options = {}) {
    const catalog = await loadJqlAutocompleteCatalog(options.projectKey);
    const trimmed = (jql ?? '').trim();
    if (!trimmed) {
        return catalog.fields.slice(0, jqlSuggest_1.MAX_JQL_SUGGESTIONS).map((field) => ({
            label: field.displayName || field.value,
            value: field.value,
        }));
    }
    const valueContext = (0, jqlSuggest_1.parseValueSuggestionContext)(jql, cursor, previousJql);
    let valueResults = [];
    if (valueContext && (0, jqlSuggest_1.fieldSupportsAutocomplete)(valueContext.fieldName, catalog)) {
        try {
            valueResults = await fetchFieldValueSuggestions(valueContext.fieldName, valueContext.fieldValue);
        }
        catch {
            valueResults = [];
        }
    }
    return (0, jqlSuggest_1.buildLocalJqlSuggestions)(jql, catalog, valueResults, cursor, previousJql);
}
/**
 * Live JQL validation via `POST /rest/api/3/jql/parse?validation=strict`.
 */
async function parseJql(jql) {
    const trimmed = (jql ?? '').trim();
    if (!trimmed) {
        return { valid: true, errors: [], warnings: [] };
    }
    const response = await (0, bridge_1.requestJira)('/rest/api/3/jql/parse?validation=strict', {
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
    const data = (await response.json());
    return (0, jqlSuggest_1.mapJqlParseQuery)(data.queries?.[0]);
}
//# sourceMappingURL=jqlSuggestClient.js.map