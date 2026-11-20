# atlassian-forge-jql-editor

Forge **UI Kit** JQL field with as-you-type **hint** suggestions (read-only popup) and live validation. Uses `@forge/bridge` `requestJira` against Jira Cloud’s [JQL REST API](https://developer.atlassian.com/cloud/jira/platform/rest/v3/api-group-jql/#api-group-jql).

The popup is display-only — users type completions themselves. Hints update from the caret position (field → operator → value).

![Forge JQL editor suggesting label values after `labels in (`](docs/forge-jql-editor-suggestions.png)

## Install

```bash
npm install atlassian-forge-jql-editor
# or
npm install git+ssh://git@github.com:jvuvo/atlassian-forge-jql-editor.git
```

Peer dependencies: `@forge/bridge`, `@forge/react`, `react`.

Requires Forge scope `read:jira-work`.

## Quick start

```tsx
import React, { useRef, useState } from 'react';
import {
  ForgeJqlEditor,
  type ForgeJqlEditorHandle,
} from 'atlassian-forge-jql-editor';

function MyForm() {
  const [jql, setJql] = useState('');
  const [isJqlValid, setIsJqlValid] = useState(true);
  const jqlRef = useRef<ForgeJqlEditorHandle>(null);

  return (
    <>
      <ForgeJqlEditor
        ref={jqlRef}
        value={jql}
        onChange={setJql}
        projectKey="ABC" // optional — scopes autocomplete
        onValidityChange={({ isValid }) => setIsJqlValid(isValid)}
      />
      <button
        type="button"
        onClick={() => void jqlRef.current?.validate()}
      >
        Validate JQL
      </button>
    </>
  );
}
```

### Optional cloud validator

```tsx
<ForgeJqlEditor
  value={jql}
  onChange={setJql}
  validateRequest={async (query) => invoke('testJql', { jql: query })}
/>
```

## Suggestion hints (not clickable)

| Context | Example | Popup shows |
|---------|---------|-------------|
| Field | `sta` | Matching fields |
| Operator | `status ` | That field’s operators |
| Value | `status = Op` | Field values when `auto` |

## Low-level API

Helpers are still exported for custom UIs:

- `suggestJql`, `parseJql`, `applySuggestion`, `parseSuggestContext`, …

## Scripts

```bash
npm test
npm run build
```

## License

MIT
