import {
  Box,
  ErrorMessage,
  HelperMessage,
  Inline,
  Label,
  Link,
  Popup,
  Spinner,
  Stack,
  Text,
  TextArea,
  ValidMessage,
  xcss,
} from '@forge/react';
import React, {
  forwardRef,
  useCallback,
  useEffect,
  useImperativeHandle,
  useRef,
  useState,
} from 'react';
import { readSelectionStart, rememberInsertIndex, type JqlSuggestion } from './jqlSuggest';
import { parseJql, suggestJql } from './jqlSuggestClient';

const suggestionPopupStyles = xcss({
  paddingBlock: 'space.050',
  paddingInline: 'space.100',
  maxWidth: '100%',
});

const suggestionItemStyles = xcss({
  width: '100%',
  textAlign: 'start',
  paddingBlock: 'space.050',
});

const SUGGEST_DEBOUNCE_MS = 300;
const PARSE_DEBOUNCE_MS = 450;

const DEFAULT_LEARN_MORE =
  'https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira-cloud/';

export type ForgeJqlEditorValidity = {
  /** True when JQL is empty (optional) or parses without errors. */
  isValid: boolean;
  error: string | null;
  warning: string | null;
};

export type ForgeJqlEditorHandle = {
  /**
   * Validate current JQL. Empty string is valid (optional filter).
   * Uses `validateRequest` when provided, otherwise `parseJql`.
   */
  validate: (options?: { quiet?: boolean }) => Promise<boolean>;
};

export type ForgeJqlEditorProps = {
  value: string;
  onChange: (jql: string) => void;
  /** When set (and not `-1`), scopes autocomplete via POST `/jql/autocompletedata`. */
  projectKey?: string | null;
  id?: string;
  name?: string;
  label?: string;
  description?: string;
  learnMoreHref?: string | null;
  placeholder?: string;
  minimumRows?: number;
  isDisabled?: boolean;
  /** Live validity for save gating, etc. */
  onValidityChange?: (state: ForgeJqlEditorValidity) => void;
  /**
   * Optional server-side validator (e.g. Forge `invoke('testJql')`).
   * Return `{ error }` or throw; success = no error / `true`.
   */
  validateRequest?: (jql: string) => Promise<{ error?: string } | boolean | void>;
};

function normalizeProjectKey(projectKey?: string | null): string | null {
  if (!projectKey || projectKey === '-1') {
    return null;
  }
  return projectKey;
}

/**
 * Forge UI Kit JQL field with read-only suggestion hints (by caret) and live parse.
 * Users type the query themselves — the popup is not selectable.
 */
export const ForgeJqlEditor = forwardRef<ForgeJqlEditorHandle, ForgeJqlEditorProps>(
  function ForgeJqlEditor(
    {
      value,
      onChange,
      projectKey,
      id = 'forge-jql-editor',
      name = 'jql',
      label = 'JQL filter (optional)',
      description = 'Filter issues with JQL. Leave empty for all issues. Hints appear while you type — type the value yourself.',
      learnMoreHref = DEFAULT_LEARN_MORE,
      placeholder = 'e.g. project = "JS" AND status = Open',
      minimumRows = 3,
      isDisabled = false,
      onValidityChange,
      validateRequest,
    },
    ref
  ) {
    const scopedProjectKey = normalizeProjectKey(projectKey);
    const [error, setError] = useState<string | null>(null);
    const [warning, setWarning] = useState<string | null>(null);
    const [isValid, setIsValid] = useState(false);
    const [validating, setValidating] = useState(false);
    const [suggestions, setSuggestions] = useState<JqlSuggestion[]>([]);
    const [isSuggestOpen, setIsSuggestOpen] = useState(false);

    const suggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const parseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const suggestRequestIdRef = useRef(0);
    const parseRequestIdRef = useRef(0);
    const previousValueRef = useRef(value);
    const valueRef = useRef(value);
    const onValidityChangeRef = useRef(onValidityChange);

    valueRef.current = value;
    onValidityChangeRef.current = onValidityChange;

    const publishValidity = useCallback((next: ForgeJqlEditorValidity) => {
      setError(next.error);
      setWarning(next.warning);
      setIsValid(next.isValid);
      onValidityChangeRef.current?.(next);
    }, []);

    const clearSuggestions = useCallback(() => {
      setSuggestions([]);
      setIsSuggestOpen(false);
    }, []);

    const requestSuggestions = useCallback(
      (jql: string, insertIndex: number, previousJql: string) => {
        if (suggestTimerRef.current) {
          clearTimeout(suggestTimerRef.current);
        }
        suggestTimerRef.current = setTimeout(() => {
          const requestId = ++suggestRequestIdRef.current;
          void (async () => {
            try {
              const next = await suggestJql(jql, insertIndex, previousJql, {
                projectKey: scopedProjectKey,
              });
              if (requestId !== suggestRequestIdRef.current) {
                return;
              }
              setSuggestions(next);
              setIsSuggestOpen(next.length > 0);
            } catch {
              if (requestId !== suggestRequestIdRef.current) {
                return;
              }
              clearSuggestions();
            }
          })();
        }, SUGGEST_DEBOUNCE_MS);
      },
      [clearSuggestions, scopedProjectKey]
    );

    const requestLiveParse = useCallback(
      (jql: string) => {
        if (parseTimerRef.current) {
          clearTimeout(parseTimerRef.current);
        }
        parseTimerRef.current = setTimeout(() => {
          const requestId = ++parseRequestIdRef.current;
          void (async () => {
            if (!jql.trim()) {
              if (requestId !== parseRequestIdRef.current) {
                return;
              }
              publishValidity({ isValid: true, error: null, warning: null });
              return;
            }
            try {
              const feedback = await parseJql(jql);
              if (requestId !== parseRequestIdRef.current) {
                return;
              }
              if (feedback.errors.length > 0) {
                publishValidity({
                  isValid: false,
                  error: feedback.errors[0],
                  warning: null,
                });
                return;
              }
              publishValidity({
                isValid: true,
                error: null,
                warning: feedback.warnings[0] ?? null,
              });
            } catch {
              // Soft-fail while typing; explicit validate still surfaces errors.
            }
          })();
        }, PARSE_DEBOUNCE_MS);
      },
      [publishValidity]
    );

    useEffect(() => {
      return () => {
        if (suggestTimerRef.current) {
          clearTimeout(suggestTimerRef.current);
        }
        if (parseTimerRef.current) {
          clearTimeout(parseTimerRef.current);
        }
      };
    }, []);

    useEffect(() => {
      previousValueRef.current = value;
    }, []);

    const runValidate = useCallback(
      async (quiet = false, jqlOverride?: string): Promise<boolean> => {
        const jqlToValidate = jqlOverride ?? valueRef.current;
        if (!jqlToValidate.trim()) {
          publishValidity({ isValid: true, error: null, warning: null });
          return true;
        }
        setValidating(true);
        try {
          if (validateRequest) {
            const result = await validateRequest(jqlToValidate);
            if (result === false) {
              publishValidity({
                isValid: false,
                error: 'Invalid JQL.',
                warning: null,
              });
              return false;
            }
            if (result && typeof result === 'object' && result.error) {
              publishValidity({
                isValid: false,
                error: result.error,
                warning: null,
              });
              return false;
            }
            publishValidity({ isValid: true, error: null, warning: null });
            return true;
          }

          const feedback = await parseJql(jqlToValidate);
          if (feedback.errors.length > 0) {
            publishValidity({
              isValid: false,
              error: feedback.errors[0],
              warning: null,
            });
            return false;
          }
          publishValidity({
            isValid: true,
            error: null,
            warning: feedback.warnings[0] ?? null,
          });
          return true;
        } catch (err) {
          const message =
            err instanceof Error && err.message ? err.message : 'JQL validation failed';
          publishValidity({ isValid: false, error: message, warning: null });
          return false;
        } finally {
          setValidating(false);
          void quiet;
        }
      },
      [publishValidity, validateRequest]
    );

    useImperativeHandle(
      ref,
      () => ({
        validate: (options) => runValidate(options?.quiet ?? false),
      }),
      [runValidate]
    );

    return (
      <Stack space="space.100">
        {label ? <Label labelFor={id}>{label}</Label> : null}
        {(description || learnMoreHref) && (
          <Stack space="space.050">
            {description ? <Text size="small">{description}</Text> : null}
            {learnMoreHref ? (
              <Link href={learnMoreHref} openNewTab>
                Learn JQL syntax →
              </Link>
            ) : null}
          </Stack>
        )}
        <Popup
          isOpen={isSuggestOpen}
          onClose={() => clearSuggestions()}
          placement="bottom-start"
          shouldFitContainer
          autoFocus={false}
          role="listbox"
          label="JQL suggestions"
          trigger={() => (
            <TextArea
              id={id}
              name={name}
              value={value}
              isMonospaced
              minimumRows={minimumRows}
              resize="vertical"
              placeholder={placeholder}
              isDisabled={isDisabled}
              isInvalid={Boolean(error)}
              onBlur={() => {
                void runValidate(true);
              }}
              onChange={(event) => {
                const val = String(event.target?.value ?? '');
                const previousJql = previousValueRef.current;
                const reportedCaret = readSelectionStart(event.target);
                const insertIndex = rememberInsertIndex(val, reportedCaret, previousJql);
                previousValueRef.current = val;
                onChange(val);
                publishValidity({ isValid: false, error: null, warning: null });
                requestSuggestions(val, insertIndex, previousJql);
                requestLiveParse(val);
              }}
            />
          )}
          content={() => (
            <Box xcss={suggestionPopupStyles}>
              <Stack space="space.050" alignInline="start">
                <Text size="small" color="color.text.subtlest">
                  Suggestions (type to complete)
                </Text>
                {suggestions.map((suggestion) => (
                  <Box key={`${suggestion.value}-${suggestion.label}`} xcss={suggestionItemStyles}>
                    <Text align="start" size="small">
                      {suggestion.label}
                    </Text>
                  </Box>
                ))}
              </Stack>
            </Box>
          )}
        />
        {validating && (
          <HelperMessage>
            <Inline space="space.050" alignBlock="center">
              <Spinner size="small" label="Validating JQL..." />
              <Text size="small" color="color.text.subtlest">
                Validating JQL...
              </Text>
            </Inline>
          </HelperMessage>
        )}
        {error && <ErrorMessage>{error}</ErrorMessage>}
        {!error && warning && <HelperMessage>{warning}</HelperMessage>}
        {isValid && !error && value.trim() !== '' && <ValidMessage>JQL is valid.</ValidMessage>}
      </Stack>
    );
  }
);
