"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JqlSuggestionHints = JqlSuggestionHints;
const react_1 = require("@forge/react");
const react_2 = __importDefault(require("react"));
const popupStyles = (0, react_1.xcss)({
    paddingBlock: 'space.050',
    paddingInline: 'space.100',
    maxWidth: '100%',
});
const itemStyles = (0, react_1.xcss)({
    width: '100%',
    textAlign: 'start',
    paddingBlock: 'space.050',
});
/** Read-only hint list — not selectable. */
function JqlSuggestionHints({ suggestions }) {
    return (react_2.default.createElement(react_1.Box, { xcss: popupStyles },
        react_2.default.createElement(react_1.Stack, { space: "space.050", alignInline: "start" },
            react_2.default.createElement(react_1.Text, { size: "small", color: "color.text.subtlest" }, "Suggestions (type to complete)"),
            suggestions.map((suggestion) => (react_2.default.createElement(react_1.Box, { key: `${suggestion.value}-${suggestion.label}`, xcss: itemStyles },
                react_2.default.createElement(react_1.Text, { align: "start", size: "small" }, suggestion.label)))))));
}
//# sourceMappingURL=JqlSuggestionHints.js.map