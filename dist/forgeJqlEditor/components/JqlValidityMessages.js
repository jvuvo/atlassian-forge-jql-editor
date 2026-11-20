"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JqlValidityMessages = JqlValidityMessages;
const react_1 = require("@forge/react");
const react_2 = __importDefault(require("react"));
function JqlValidityMessages({ value, error, warning, isValid, validating, }) {
    return (react_2.default.createElement(react_2.default.Fragment, null,
        validating && (react_2.default.createElement(react_1.HelperMessage, null,
            react_2.default.createElement(react_1.Inline, { space: "space.050", alignBlock: "center" },
                react_2.default.createElement(react_1.Spinner, { size: "small", label: "Validating JQL..." }),
                react_2.default.createElement(react_1.Text, { size: "small", color: "color.text.subtlest" }, "Validating JQL...")))),
        error && react_2.default.createElement(react_1.ErrorMessage, null, error),
        !error && warning && react_2.default.createElement(react_1.HelperMessage, null, warning),
        isValid && !error && value.trim() !== '' && react_2.default.createElement(react_1.ValidMessage, null, "JQL is valid.")));
}
//# sourceMappingURL=JqlValidityMessages.js.map