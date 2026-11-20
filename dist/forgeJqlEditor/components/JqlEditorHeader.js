"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.JqlEditorHeader = JqlEditorHeader;
const react_1 = require("@forge/react");
const react_2 = __importDefault(require("react"));
function JqlEditorHeader({ id, label, description, learnMoreHref, }) {
    return (react_2.default.createElement(react_2.default.Fragment, null,
        label ? react_2.default.createElement(react_1.Label, { labelFor: id }, label) : null,
        (description || learnMoreHref) && (react_2.default.createElement(react_1.Stack, { space: "space.050" },
            description ? react_2.default.createElement(react_1.Text, { size: "small" }, description) : null,
            learnMoreHref ? (react_2.default.createElement(react_1.Link, { href: learnMoreHref, openNewTab: true }, "Learn JQL syntax \u2192")) : null))));
}
//# sourceMappingURL=JqlEditorHeader.js.map