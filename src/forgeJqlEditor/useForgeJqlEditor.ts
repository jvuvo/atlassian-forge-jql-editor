import { useCallback, useEffect, useRef, useState } from 'react';
import { readSelectionStart, rememberInsertIndex, type JqlSuggestion } from '../jqlSuggest';
import { parseJql, suggestJql } from '../jqlSuggestClient';
import { PARSE_DEBOUNCE_MS, SUGGEST_DEBOUNCE_MS, normalizeProjectKey } from './constants';
import type { ForgeJqlEditorProps, ForgeJqlEditorValidity } from './types';

type UseForgeJqlEditorArgs = Pick<
  ForgeJqlEditorProps,
  'value' | 'onChange' | 'projectKey' | 'onValidityChange' | 'validateRequest'
>;

export function useForgeJqlEditor({
  value,
  onChange,
  projectKey,
  onValidityChange,
  validateRequest,
}: UseForgeJqlEditorArgs) {
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

  const handleChange = useCallback(
    (event: { target?: { value?: string; selectionStart?: number | null } | null }) => {
      const val = String(event.target?.value ?? '');
      const previousJql = previousValueRef.current;
      const reportedCaret = readSelectionStart(event.target);
      const insertIndex = rememberInsertIndex(val, reportedCaret, previousJql);
      previousValueRef.current = val;
      onChange(val);
      publishValidity({ isValid: false, error: null, warning: null });
      requestSuggestions(val, insertIndex, previousJql);
      requestLiveParse(val);
    },
    [onChange, publishValidity, requestLiveParse, requestSuggestions]
  );

  const handleBlur = useCallback(() => {
    void runValidate(true);
  }, [runValidate]);

  return {
    error,
    warning,
    isValid,
    validating,
    suggestions,
    isSuggestOpen,
    clearSuggestions,
    handleChange,
    handleBlur,
    runValidate,
  };
}
