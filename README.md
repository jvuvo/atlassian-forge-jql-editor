# atlassian-forge-jql-editor

JQL autocomplete and parse helpers for **Atlassian Forge UI Kit** apps. Uses `@forge/bridge` `requestJira` against Jira Cloud’s [JQL REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-jql/#api-group-jql).

This is not a Custom UI / `@atlassianlabs/jql-editor-forge` wrapper. It powers a TextArea + suggestion popup (or similar) you build with Forge UI Kit.

## Install

```bash
npm install atlassian-forge-jql-editor
# or
npm install git+ssh://git@github.com:jvuvo/atlassian-forge-jql-editor.git
```

Peer dependency: `@forge/bridge` (already present in Forge apps).

Requires Forge scope `read:jira-work` for autocomplete and parse.

## Usage

```ts
import {
  suggestJql,
  parseJql,
  applySuggestion,
  parseSuggestContext,
} from 'atlassian-forge-jql-editor';

const suggestions = await suggestJql(jql, caretIndex, previousJql, {
  projectKey: 'ABC', // optional — POST project-scoped autocompletedata
});

const applied = applySuggestion(jql, suggestions[0].value, caretIndex);
const feedback = await parseJql(applied.jql);
```

### Suggestion contexts

| Context | Example | Popup |
|---------|---------|--------|
| Field | `sta` | Matching fields (label = displayName, insert = value) |
| Operator | `status ` | That field’s operators from `/jql/autocompletedata` |
| Value | `status = Op` | `/jql/autocompletedata/suggestions` when `auto` |

### Live validation

```ts
const { valid, errors, warnings } = await parseJql(jql);
// POST /rest/api/3/jql/parse?validation=strict
```

## API surface

- **Pure helpers** (`jqlSuggest`): `applySuggestion`, `buildLocalJqlSuggestions`, `parseSuggestContext`, caret helpers, types
- **Bridge client** (`jqlSuggestClient`): `suggestJql`, `parseJql`, `resetJqlAutocompleteCache`

## Scripts

```bash
npm test
npm run build
```

## License

MIT
