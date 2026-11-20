"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DEFAULT_PLACEHOLDER = exports.DEFAULT_DESCRIPTION = exports.DEFAULT_LABEL = exports.DEFAULT_LEARN_MORE = exports.PARSE_DEBOUNCE_MS = exports.SUGGEST_DEBOUNCE_MS = void 0;
exports.normalizeProjectKey = normalizeProjectKey;
exports.SUGGEST_DEBOUNCE_MS = 300;
exports.PARSE_DEBOUNCE_MS = 450;
exports.DEFAULT_LEARN_MORE = 'https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira-cloud/';
exports.DEFAULT_LABEL = 'JQL filter (optional)';
exports.DEFAULT_DESCRIPTION = 'Filter issues with JQL. Leave empty for all issues. Hints appear while you type — type the value yourself.';
exports.DEFAULT_PLACEHOLDER = 'e.g. project = "JS" AND status = Open';
function normalizeProjectKey(projectKey) {
    if (!projectKey || projectKey === '-1') {
        return null;
    }
    return projectKey;
}
//# sourceMappingURL=constants.js.map