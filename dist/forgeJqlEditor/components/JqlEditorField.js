"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JqlEditorField = JqlEditorField;
const react_1 = require("@forge/react");
const react_2 = __importDefault(require("react"));
const JqlSuggestionHints_1 = require("./JqlSuggestionHints");
function JqlEditorField({ id, name, value, placeholder, minimumRows, isDisabled, isInvalid, isSuggestOpen, suggestions, onCloseSuggestions, onBlur, onChange, }) {
    return (react_2.default.createElement(react_1.Popup, { isOpen: isSuggestOpen, onClose: onCloseSuggestions, placement: "bottom-start", shouldFitContainer: true, autoFocus: false, role: "listbox", label: "JQL suggestions", trigger: () => (react_2.default.createElement(react_1.TextArea, { id: id, name: name, value: value, isMonospaced: true, minimumRows: minimumRows, resize: "vertical", placeholder: placeholder, isDisabled: isDisabled, isInvalid: isInvalid, onBlur: onBlur, onChange: onChange })), content: () => react_2.default.createElement(JqlSuggestionHints_1.JqlSuggestionHints, { suggestions: suggestions }) }));
}
//# sourceMappingURL=JqlEditorField.js.map