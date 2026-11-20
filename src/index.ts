export {
  applySuggestion,
  buildLocalJqlSuggestions,
  EMPTY_JQL_CATALOG,
  fieldSupportsAutocomplete,
  findFieldMeta,
  getTrailingToken,
  mapJqlParseQuery,
  MAX_JQL_SUGGESTIONS,
  normalizeOperator,
  parseSuggestContext,
  parseValueSuggestionContext,
  readSelectionStart,
  rememberInsertIndex,
  resolveInsertIndex,
  setTextAreaCaret,
  textBeforeCursor,
} from './jqlSuggest';

export type {
  ApplySuggestionResult,
  JqlAutocompleteCatalog,
  JqlFieldMeta,
  JqlFunctionMeta,
  JqlParseFeedback,
  JqlSuggestion,
  SuggestContextKind,
  SuggestionApiResult,
  TrailingToken,
} from './jqlSuggest';

export { parseJql, resetJqlAutocompleteCache, suggestJql } from './jqlSuggestClient';

export { ForgeJqlEditor } from './ForgeJqlEditor';
export type {
  ForgeJqlEditorHandle,
  ForgeJqlEditorProps,
  ForgeJqlEditorValidity,
} from './ForgeJqlEditor';
