"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.useForgeJqlEditor = useForgeJqlEditor;
const react_1 = require("react");
const jqlSuggest_1 = require("../jqlSuggest");
const jqlSuggestClient_1 = require("../jqlSuggestClient");
const constants_1 = require("./constants");
function useForgeJqlEditor({ value, onChange, projectKey, onValidityChange, validateRequest, }) {
    const scopedProjectKey = (0, constants_1.normalizeProjectKey)(projectKey);
    const [error, setError] = (0, react_1.useState)(null);
    const [warning, setWarning] = (0, react_1.useState)(null);
    const [isValid, setIsValid] = (0, react_1.useState)(false);
    const [validating, setValidating] = (0, react_1.useState)(false);
    const [suggestions, setSuggestions] = (0, react_1.useState)([]);
    const [isSuggestOpen, setIsSuggestOpen] = (0, react_1.useState)(false);
    const suggestTimerRef = (0, react_1.useRef)(null);
    const parseTimerRef = (0, react_1.useRef)(null);
    const suggestRequestIdRef = (0, react_1.useRef)(0);
    const parseRequestIdRef = (0, react_1.useRef)(0);
    const previousValueRef = (0, react_1.useRef)(value);
    const valueRef = (0, react_1.useRef)(value);
    const onValidityChangeRef = (0, react_1.useRef)(onValidityChange);
    valueRef.current = value;
    onValidityChangeRef.current = onValidityChange;
    const publishValidity = (0, react_1.useCallback)((next) => {
        setError(next.error);
        setWarning(next.warning);
        setIsValid(next.isValid);
        onValidityChangeRef.current?.(next);
    }, []);
    const clearSuggestions = (0, react_1.useCallback)(() => {
        setSuggestions([]);
        setIsSuggestOpen(false);
    }, []);
    const requestSuggestions = (0, react_1.useCallback)((jql, insertIndex, previousJql) => {
        if (suggestTimerRef.current) {
            clearTimeout(suggestTimerRef.current);
        }
        suggestTimerRef.current = setTimeout(() => {
            const requestId = ++suggestRequestIdRef.current;
            void (async () => {
                try {
                    const next = await (0, jqlSuggestClient_1.suggestJql)(jql, insertIndex, previousJql, {
                        projectKey: scopedProjectKey,
                    });
                    if (requestId !== suggestRequestIdRef.current) {
                        return;
                    }
                    setSuggestions(next);
                    setIsSuggestOpen(next.length > 0);
                }
                catch {
                    if (requestId !== suggestRequestIdRef.current) {
                        return;
                    }
                    clearSuggestions();
                }
            })();
        }, constants_1.SUGGEST_DEBOUNCE_MS);
    }, [clearSuggestions, scopedProjectKey]);
    const requestLiveParse = (0, react_1.useCallback)((jql) => {
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
                    const feedback = await (0, jqlSuggestClient_1.parseJql)(jql);
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
                }
                catch {
                    // Soft-fail while typing; explicit validate still surfaces errors.
                }
            })();
        }, constants_1.PARSE_DEBOUNCE_MS);
    }, [publishValidity]);
    (0, react_1.useEffect)(() => {
        return () => {
            if (suggestTimerRef.current) {
                clearTimeout(suggestTimerRef.current);
            }
            if (parseTimerRef.current) {
                clearTimeout(parseTimerRef.current);
            }
        };
    }, []);
    (0, react_1.useEffect)(() => {
        previousValueRef.current = value;
    }, []);
    const runValidate = (0, react_1.useCallback)(async (quiet = false, jqlOverride) => {
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
            const feedback = await (0, jqlSuggestClient_1.parseJql)(jqlToValidate);
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
        }
        catch (err) {
            const message = err instanceof Error && err.message ? err.message : 'JQL validation failed';
            publishValidity({ isValid: false, error: message, warning: null });
            return false;
        }
        finally {
            setValidating(false);
            void quiet;
        }
    }, [publishValidity, validateRequest]);
    const handleChange = (0, react_1.useCallback)((event) => {
        const val = String(event.target?.value ?? '');
        const previousJql = previousValueRef.current;
        const reportedCaret = (0, jqlSuggest_1.readSelectionStart)(event.target);
        const insertIndex = (0, jqlSuggest_1.rememberInsertIndex)(val, reportedCaret, previousJql);
        previousValueRef.current = val;
        onChange(val);
        publishValidity({ isValid: false, error: null, warning: null });
        requestSuggestions(val, insertIndex, previousJql);
        requestLiveParse(val);
    }, [onChange, publishValidity, requestLiveParse, requestSuggestions]);
    const handleBlur = (0, react_1.useCallback)(() => {
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
//# sourceMappingURL=useForgeJqlEditor.js.map