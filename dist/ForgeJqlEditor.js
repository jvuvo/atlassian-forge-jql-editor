"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.ForgeJqlEditor = void 0;
const react_1 = require("@forge/react");
const react_2 = __importStar(require("react"));
const jqlSuggest_1 = require("./jqlSuggest");
const jqlSuggestClient_1 = require("./jqlSuggestClient");
const suggestionPopupStyles = (0, react_1.xcss)({
    paddingBlock: 'space.050',
    paddingInline: 'space.100',
    maxWidth: '100%',
});
const suggestionItemStyles = (0, react_1.xcss)({
    width: '100%',
    textAlign: 'start',
    paddingBlock: 'space.050',
});
const SUGGEST_DEBOUNCE_MS = 300;
const PARSE_DEBOUNCE_MS = 450;
const DEFAULT_LEARN_MORE = 'https://support.atlassian.com/jira-software-cloud/docs/what-is-advanced-search-in-jira-cloud/';
function normalizeProjectKey(projectKey) {
    if (!projectKey || projectKey === '-1') {
        return null;
    }
    return projectKey;
}
/**
 * Forge UI Kit JQL field with read-only suggestion hints (by caret) and live parse.
 * Users type the query themselves — the popup is not selectable.
 */
exports.ForgeJqlEditor = (0, react_2.forwardRef)(function ForgeJqlEditor({ value, onChange, projectKey, id = 'forge-jql-editor', name = 'jql', label = 'JQL filter (optional)', description = 'Filter issues with JQL. Leave empty for all issues. Hints appear while you type — type the value yourself.', learnMoreHref = DEFAULT_LEARN_MORE, placeholder = 'e.g. project = "JS" AND status = Open', minimumRows = 3, isDisabled = false, onValidityChange, validateRequest, }, ref) {
    const scopedProjectKey = normalizeProjectKey(projectKey);
    const [error, setError] = (0, react_2.useState)(null);
    const [warning, setWarning] = (0, react_2.useState)(null);
    const [isValid, setIsValid] = (0, react_2.useState)(false);
    const [validating, setValidating] = (0, react_2.useState)(false);
    const [suggestions, setSuggestions] = (0, react_2.useState)([]);
    const [isSuggestOpen, setIsSuggestOpen] = (0, react_2.useState)(false);
    const suggestTimerRef = (0, react_2.useRef)(null);
    const parseTimerRef = (0, react_2.useRef)(null);
    const suggestRequestIdRef = (0, react_2.useRef)(0);
    const parseRequestIdRef = (0, react_2.useRef)(0);
    const previousValueRef = (0, react_2.useRef)(value);
    const valueRef = (0, react_2.useRef)(value);
    const onValidityChangeRef = (0, react_2.useRef)(onValidityChange);
    valueRef.current = value;
    onValidityChangeRef.current = onValidityChange;
    const publishValidity = (0, react_2.useCallback)((next) => {
        setError(next.error);
        setWarning(next.warning);
        setIsValid(next.isValid);
        onValidityChangeRef.current?.(next);
    }, []);
    const clearSuggestions = (0, react_2.useCallback)(() => {
        setSuggestions([]);
        setIsSuggestOpen(false);
    }, []);
    const requestSuggestions = (0, react_2.useCallback)((jql, insertIndex, previousJql) => {
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
        }, SUGGEST_DEBOUNCE_MS);
    }, [clearSuggestions, scopedProjectKey]);
    const requestLiveParse = (0, react_2.useCallback)((jql) => {
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
        }, PARSE_DEBOUNCE_MS);
    }, [publishValidity]);
    (0, react_2.useEffect)(() => {
        return () => {
            if (suggestTimerRef.current) {
                clearTimeout(suggestTimerRef.current);
            }
            if (parseTimerRef.current) {
                clearTimeout(parseTimerRef.current);
            }
        };
    }, []);
    (0, react_2.useEffect)(() => {
        previousValueRef.current = value;
    }, []);
    const runValidate = (0, react_2.useCallback)(async (quiet = false, jqlOverride) => {
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
    (0, react_2.useImperativeHandle)(ref, () => ({
        validate: (options) => runValidate(options?.quiet ?? false),
    }), [runValidate]);
    return (react_2.default.createElement(react_1.Stack, { space: "space.100" },
        label ? react_2.default.createElement(react_1.Label, { labelFor: id }, label) : null,
        (description || learnMoreHref) && (react_2.default.createElement(react_1.Stack, { space: "space.050" },
            description ? react_2.default.createElement(react_1.Text, { size: "small" }, description) : null,
            learnMoreHref ? (react_2.default.createElement(react_1.Link, { href: learnMoreHref, openNewTab: true }, "Learn JQL syntax \u2192")) : null)),
        react_2.default.createElement(react_1.Popup, { isOpen: isSuggestOpen, onClose: () => clearSuggestions(), placement: "bottom-start", shouldFitContainer: true, autoFocus: false, role: "listbox", label: "JQL suggestions", trigger: () => (react_2.default.createElement(react_1.TextArea, { id: id, name: name, value: value, isMonospaced: true, minimumRows: minimumRows, resize: "vertical", placeholder: placeholder, isDisabled: isDisabled, isInvalid: Boolean(error), onBlur: () => {
                    void runValidate(true);
                }, onChange: (event) => {
                    const val = String(event.target?.value ?? '');
                    const previousJql = previousValueRef.current;
                    const reportedCaret = (0, jqlSuggest_1.readSelectionStart)(event.target);
                    const insertIndex = (0, jqlSuggest_1.rememberInsertIndex)(val, reportedCaret, previousJql);
                    previousValueRef.current = val;
                    onChange(val);
                    publishValidity({ isValid: false, error: null, warning: null });
                    requestSuggestions(val, insertIndex, previousJql);
                    requestLiveParse(val);
                } })), content: () => (react_2.default.createElement(react_1.Box, { xcss: suggestionPopupStyles },
                react_2.default.createElement(react_1.Stack, { space: "space.050", alignInline: "start" },
                    react_2.default.createElement(react_1.Text, { size: "small", color: "color.text.subtlest" }, "Suggestions (type to complete)"),
                    suggestions.map((suggestion) => (react_2.default.createElement(react_1.Box, { key: `${suggestion.value}-${suggestion.label}`, xcss: suggestionItemStyles },
                        react_2.default.createElement(react_1.Text, { align: "start", size: "small" }, suggestion.label))))))) }),
        validating && (react_2.default.createElement(react_1.HelperMessage, null,
            react_2.default.createElement(react_1.Inline, { space: "space.050", alignBlock: "center" },
                react_2.default.createElement(react_1.Spinner, { size: "small", label: "Validating JQL..." }),
                react_2.default.createElement(react_1.Text, { size: "small", color: "color.text.subtlest" }, "Validating JQL...")))),
        error && react_2.default.createElement(react_1.ErrorMessage, null, error),
        !error && warning && react_2.default.createElement(react_1.HelperMessage, null, warning),
        isValid && !error && value.trim() !== '' && react_2.default.createElement(react_1.ValidMessage, null, "JQL is valid.")));
});
//# sourceMappingURL=ForgeJqlEditor.js.map