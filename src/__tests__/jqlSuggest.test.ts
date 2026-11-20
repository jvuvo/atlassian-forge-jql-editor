import {
  applySuggestion,
  buildLocalJqlSuggestions,
  fieldSupportsAutocomplete,
  findFieldMeta,
  getTrailingToken,
  mapJqlParseQuery,
  normalizeOperator,
  parseSuggestContext,
  parseValueSuggestionContext,
  resolveInsertIndex,
  type JqlAutocompleteCatalog,
} from '../jqlSuggest';

const CATALOG: JqlAutocompleteCatalog = {
  fields: [
    {
      value: 'status',
      displayName: 'status',
      operators: ['=', '!=', 'in', 'not in', 'is', 'is not'],
      auto: true,
    },
    {
      value: 'statusCategory',
      displayName: 'Status Category',
      operators: ['=', '!=', 'in', 'not in', 'is', 'is not'],
      auto: true,
    },
    {
      value: 'priority',
      displayName: 'priority',
      operators: ['=', '!=', 'in', 'not in', 'is', 'is not'],
      auto: true,
    },
    {
      value: 'assignee',
      displayName: 'assignee',
      operators: ['=', '!=', 'in', 'not in', 'is', 'is not'],
      auto: true,
    },
    {
      value: 'project',
      displayName: 'project',
      operators: ['=', '!=', 'in', 'not in'],
      auto: true,
    },
    {
      value: 'summary',
      displayName: 'summary',
      operators: ['~', '!~', 'is', 'is not'],
      auto: false,
    },
    {
      value: 'Sprint',
      displayName: 'Sprint - cf[10880]',
      operators: ['=', '!=', 'in', 'not in', 'is', 'is not'],
      auto: true,
    },
  ],
  functions: [{ value: 'currentUser()', displayName: 'currentUser()' }],
  reservedWords: ['empty', 'and', 'or', 'in'],
};

describe('resolveInsertIndex', () => {
  it('falls back to end of string when caret is missing', () => {
    expect(resolveInsertIndex('project = TDS', null)).toBe('project = TDS'.length);
  });

  it('treats false selectionStart 0 while appending as end of string', () => {
    expect(resolveInsertIndex('project = TD', 0, 'project = T')).toBe('project = TD'.length);
  });

  it('keeps a mid-string caret when reported', () => {
    expect(resolveInsertIndex('sta AND project', 3, 'sta')).toBe(3);
  });
});

describe('applySuggestion caret', () => {
  it('returns cursor at the end of the appended text', () => {
    const applied = applySuggestion('project and ', 'account', 'project and '.length);
    expect(applied.jql).toBe('project and account ');
    expect(applied.cursor).toBe('project and account '.length);
  });
});

describe('getTrailingToken', () => {
  it('returns empty for blank jql', () => {
    expect(getTrailingToken('')).toEqual({ token: '', start: 0 });
  });

  it('returns the last bare word', () => {
    expect(getTrailingToken('project = TDS AND sta')).toEqual({
      token: 'sta',
      start: 'project = TDS AND '.length,
    });
  });

  it('returns content inside an open quote', () => {
    expect(getTrailingToken('text ~ "key')).toEqual({
      token: 'key',
      start: 'text ~ "'.length,
    });
  });

  it('uses the token before the caret, not after', () => {
    expect(getTrailingToken('sta AND project = X', 3)).toEqual({
      token: 'sta',
      start: 0,
    });
  });
});

describe('applySuggestion', () => {
  it('replaces the trailing token and adds a space', () => {
    expect(applySuggestion('status = Op', 'Open')).toEqual({
      jql: 'status = Open ',
      cursor: 'status = Open '.length,
    });
  });

  it('appends after a complete token with a separating space', () => {
    expect(applySuggestion('project = TDS', 'AND')).toEqual({
      jql: 'project = TDS AND ',
      cursor: 'project = TDS AND '.length,
    });
  });

  it('fills empty jql', () => {
    expect(applySuggestion('', 'status')).toEqual({
      jql: 'status ',
      cursor: 'status '.length,
    });
  });

  it('completes the token at the caret and keeps text after', () => {
    expect(applySuggestion('sta AND project = X', 'status', 3)).toEqual({
      jql: 'status  AND project = X',
      cursor: 'status '.length,
    });
  });

  it('appends after the caret when the suggestion is not a token completion', () => {
    expect(applySuggestion('project = TDS more', 'AND', 'project = TDS'.length)).toEqual({
      jql: 'project = TDS AND  more',
      cursor: 'project = TDS AND '.length,
    });
  });

  it('places a field value after the operator', () => {
    expect(applySuggestion('status =', 'Open', 'status ='.length)).toEqual({
      jql: 'status = Open ',
      cursor: 'status = Open '.length,
    });
    expect(applySuggestion('status = ', 'Open', 'status = '.length)).toEqual({
      jql: 'status = Open ',
      cursor: 'status = Open '.length,
    });
    expect(applySuggestion('status = Op', 'Open', 'status = Op'.length)).toEqual({
      jql: 'status = Open ',
      cursor: 'status = Open '.length,
    });
  });

  it('replaces the last clause value, not the first field = in the query', () => {
    expect(
      applySuggestion('project = TDS AND status = Op', 'Open', 'project = TDS AND status = Op'.length)
    ).toEqual({
      jql: 'project = TDS AND status = Open ',
      cursor: 'project = TDS AND status = Open '.length,
    });
  });

  it('treats caret 0 from popup/blur as end when the value did not change', () => {
    expect(applySuggestion('status = ', 'Open', 0, 'status = ')).toEqual({
      jql: 'status = Open ',
      cursor: 'status = Open '.length,
    });
  });

  it('quotes multi-word values after the operator', () => {
    expect(applySuggestion('status = ', 'In Progress', 'status = '.length)).toEqual({
      jql: 'status = "In Progress" ',
      cursor: 'status = "In Progress" '.length,
    });
  });

  it('completes an open-quoted value after the operator', () => {
    expect(applySuggestion('status = "In', 'In Progress', 'status = "In'.length)).toEqual({
      jql: 'status = "In Progress" ',
      cursor: 'status = "In Progress" '.length,
    });
  });
});

describe('parseValueSuggestionContext', () => {
  it('detects field operator value at end', () => {
    expect(parseValueSuggestionContext('project = TD')).toEqual({
      fieldName: 'project',
      fieldValue: 'TD',
    });
  });

  it('returns null when no operator context', () => {
    expect(parseValueSuggestionContext('proj')).toBeNull();
  });

  it('returns null after a completed value and space', () => {
    expect(parseValueSuggestionContext('project = TDS ')).toBeNull();
  });

  it('uses text before the caret only', () => {
    expect(parseValueSuggestionContext('status = Op AND project = X', 'status = Op'.length)).toEqual({
      fieldName: 'status',
      fieldValue: 'Op',
    });
  });

  it('treats open IN ( as empty value prefix for project list', () => {
    expect(parseValueSuggestionContext('project in (')).toEqual({
      fieldName: 'project',
      fieldValue: '',
    });
    expect(parseValueSuggestionContext('project in ( ')).toEqual({
      fieldName: 'project',
      fieldValue: '',
    });
    expect(parseValueSuggestionContext('project IN(')).toEqual({
      fieldName: 'project',
      fieldValue: '',
    });
  });

  it('captures partial value inside an IN list', () => {
    expect(parseValueSuggestionContext('project in (TD')).toEqual({
      fieldName: 'project',
      fieldValue: 'TD',
    });
    expect(parseValueSuggestionContext('project in (TDS, FO')).toEqual({
      fieldName: 'project',
      fieldValue: 'FO',
    });
  });

  it('stays in value context after a list item and space', () => {
    expect(parseValueSuggestionContext('project in (TDS, ')).toEqual({
      fieldName: 'project',
      fieldValue: '',
    });
  });
});

describe('parseSuggestContext list values', () => {
  it('is value after project in (', () => {
    expect(parseSuggestContext('project in (', CATALOG)).toBe('value');
    expect(parseSuggestContext('project in (TD', CATALOG)).toBe('value');
  });
});

describe('parseSuggestContext', () => {
  it('is field while typing a field prefix', () => {
    expect(parseSuggestContext('sta', CATALOG)).toBe('field');
    expect(parseSuggestContext('', CATALOG)).toBe('field');
    expect(parseSuggestContext('project = TDS AND ', CATALOG)).toBe('field');
  });

  it('is operator after a field name', () => {
    expect(parseSuggestContext('status ', CATALOG)).toBe('operator');
    expect(parseSuggestContext('priority', CATALOG)).toBe('operator');
  });

  it('is value after field and operator', () => {
    expect(parseSuggestContext('status =', CATALOG)).toBe('value');
    expect(parseSuggestContext('status = ', CATALOG)).toBe('value');
    expect(parseSuggestContext('status = Op', CATALOG)).toBe('value');
  });
});

describe('field metadata helpers', () => {
  it('normalizes operators from autocomplete data', () => {
    expect(normalizeOperator('is not')).toBe('IS NOT');
    expect(normalizeOperator('=')).toBe('=');
  });

  it('finds fields and reports autocomplete support', () => {
    expect(findFieldMeta('summary', CATALOG)?.auto).toBe(false);
    expect(fieldSupportsAutocomplete('summary', CATALOG)).toBe(false);
    expect(fieldSupportsAutocomplete('status', CATALOG)).toBe(true);
    expect(fieldSupportsAutocomplete('unknownField', CATALOG)).toBe(true);
  });
});

describe('mapJqlParseQuery', () => {
  it('maps errors and warnings', () => {
    expect(
      mapJqlParseQuery({
        errors: ['Field missing'],
        warnings: ["The value 'INVALID' does not exist for the field 'project'."],
      })
    ).toEqual({
      valid: false,
      errors: ['Field missing'],
      warnings: ["The value 'INVALID' does not exist for the field 'project'."],
    });
  });

  it('is valid when there are only warnings', () => {
    expect(mapJqlParseQuery({ warnings: ['soft warning'] })).toEqual({
      valid: true,
      errors: [],
      warnings: ['soft warning'],
    });
  });
});

describe('buildLocalJqlSuggestions', () => {
  it('filters fields by trailing prefix and uses display labels', () => {
    const suggestions = buildLocalJqlSuggestions('sta', CATALOG);
    expect(suggestions.map((item) => item.value)).toEqual(['status', 'statusCategory']);
    expect(suggestions.find((item) => item.value === 'statusCategory')?.label).toBe(
      'Status Category'
    );
  });

  it('inserts field value while showing displayName for custom fields', () => {
    const suggestions = buildLocalJqlSuggestions('Spr', CATALOG);
    expect(suggestions[0]).toEqual({
      label: 'Sprint - cf[10880]',
      value: 'Sprint',
    });
  });

  it('includes matching junction keywords in field context', () => {
    const suggestions = buildLocalJqlSuggestions('AN', CATALOG);
    expect(suggestions.some((item) => item.value === 'AND')).toBe(true);
  });

  it('after a field only shows that field operators', () => {
    const suggestions = buildLocalJqlSuggestions('summary ', CATALOG);
    expect(suggestions.map((item) => item.value)).toEqual(['~', '!~', 'IS', 'IS NOT']);
  });

  it('after exact field also offers longer field names', () => {
    const suggestions = buildLocalJqlSuggestions('status', CATALOG);
    expect(suggestions.map((item) => item.value)).toContain('=');
    expect(suggestions.map((item) => item.value)).toContain('statusCategory');
  });

  it('prefers API value results first', () => {
    const suggestions = buildLocalJqlSuggestions(
      'status = Op',
      CATALOG,
      [{ displayName: 'Open', value: 'Open' }]
    );
    expect(suggestions[0]).toEqual({ label: 'Open', value: 'Open' });
  });

  it('after an operator only shows values, not every field', () => {
    const suggestions = buildLocalJqlSuggestions(
      'status = ',
      CATALOG,
      [{ displayName: 'Open', value: 'Open' }]
    );
    expect(suggestions.map((item) => item.value)).toEqual(['Open']);
  });

  it('scopes field prefix to the caret', () => {
    const suggestions = buildLocalJqlSuggestions('sta AND project', CATALOG, [], 3);
    expect(suggestions.map((item) => item.value)).toEqual(['status', 'statusCategory']);
  });

  it('inserts operator after field', () => {
    expect(applySuggestion('status ', '=', 'status '.length)).toEqual({
      jql: 'status = ',
      cursor: 'status = '.length,
    });
  });
});
