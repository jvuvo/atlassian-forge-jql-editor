"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JqlValidityMessages = JqlValidityMessages;
const react_1 = require("@forge/react");
const react_2 = __importDefault(require("react"));
/** Compact status affordance — icons only, no Jira parse text. */
function JqlValidityMessages({ value, error, isValid, validating, }) {
    const hasValue = value.trim() !== '';
    if (validating) {
        return react_2.default.createElement(react_1.Spinner, { size: "small", label: "Validating JQL" });
    }
    if (error) {
        return (react_2.default.createElement(react_1.Inline, { space: "space.050", alignBlock: "center" },
            react_2.default.createElement(react_1.Icon, { glyph: "error", label: "Invalid JQL", color: "color.icon.danger", size: "small" })));
    }
    if (isValid && hasValue) {
        return (react_2.default.createElement(react_1.Inline, { space: "space.050", alignBlock: "center" },
            react_2.default.createElement(react_1.Icon, { glyph: "check-circle", label: "Valid JQL", color: "color.icon.success", size: "small" })));
    }
    return null;
}
//# sourceMappingURL=JqlValidityMessages.js.map