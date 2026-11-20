export const SUGGEST_DEBOUNCE_MS = 300;
export const PARSE_DEBOUNCE_MS = 450;

export const DEFAULT_LEARN_MORE =
  'https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira-cloud/';

export const DEFAULT_LABEL = 'JQL filter (optional)';

export const DEFAULT_DESCRIPTION =
  'Filter issues with JQL. Leave empty for all issues. Hints appear while you type — type the value yourself.';

export const DEFAULT_PLACEHOLDER = 'e.g. project = "JS" AND status = Open';

export function normalizeProjectKey(projectKey?: string | null): string | null {
  if (!projectKey || projectKey === '-1') {
    return null;
  }
  return projectKey;
}
