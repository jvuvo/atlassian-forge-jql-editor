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
const constants_1 = require("./constants");
const JqlEditorField_1 = require("./components/JqlEditorField");
const JqlEditorHeader_1 = require("./components/JqlEditorHeader");
const JqlValidityMessages_1 = require("./components/JqlValidityMessages");
const useForgeJqlEditor_1 = require("./useForgeJqlEditor");
/**
 * Forge UI Kit JQL field with read-only suggestion hints (by caret) and live parse.
 * Users type the query themselves — the popup is not selectable.
 */
exports.ForgeJqlEditor = (0, react_2.forwardRef)(function ForgeJqlEditor({ value, onChange, projectKey, id = 'forge-jql-editor', name = 'jql', label = constants_1.DEFAULT_LABEL, description = constants_1.DEFAULT_DESCRIPTION, learnMoreHref = constants_1.DEFAULT_LEARN_MORE, placeholder = constants_1.DEFAULT_PLACEHOLDER, minimumRows = 3, isDisabled = false, onValidityChange, validateRequest, }, ref) {
    const { error, isValid, validating, suggestions, isSuggestOpen, clearSuggestions, handleChange, handleBlur, runValidate, } = (0, useForgeJqlEditor_1.useForgeJqlEditor)({
        value,
        onChange,
        projectKey,
        onValidityChange,
        validateRequest,
    });
    (0, react_2.useImperativeHandle)(ref, () => ({
        validate: (options) => runValidate(options?.quiet ?? false),
    }), [runValidate]);
    return (react_2.default.createElement(react_1.Stack, { space: "space.100" },
        react_2.default.createElement(JqlEditorHeader_1.JqlEditorHeader, { id: id, label: label, description: description, learnMoreHref: learnMoreHref }),
        react_2.default.createElement(JqlEditorField_1.JqlEditorField, { id: id, name: name, value: value, placeholder: placeholder, minimumRows: minimumRows, isDisabled: isDisabled, isInvalid: Boolean(error), isSuggestOpen: isSuggestOpen, suggestions: suggestions, onCloseSuggestions: clearSuggestions, onBlur: handleBlur, onChange: handleChange }),
        react_2.default.createElement(JqlValidityMessages_1.JqlValidityMessages, { value: value, error: error, isValid: isValid, validating: validating })));
});
//# sourceMappingURL=ForgeJqlEditor.js.map