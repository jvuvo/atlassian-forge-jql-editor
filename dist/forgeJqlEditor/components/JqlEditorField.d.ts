import React from 'react';
import type { JqlSuggestion } from '../../jqlSuggest';
type JqlEditorFieldProps = {
    id: string;
    name: string;
    value: string;
    placeholder: string;
    minimumRows: number;
    isDisabled: boolean;
    isInvalid: boolean;
    isSuggestOpen: boolean;
    suggestions: JqlSuggestion[];
    onCloseSuggestions: () => void;
    onBlur: () => void;
    onChange: (event: {
        target?: {
            value?: string;
            selectionStart?: number | null;
        } | null;
    }) => void;
};
export declare function JqlEditorField({ id, name, value, placeholder, minimumRows, isDisabled, isInvalid, isSuggestOpen, suggestions, onCloseSuggestions, onBlur, onChange, }: JqlEditorFieldProps): React.JSX.Element;
export {};
//# sourceMappingURL=JqlEditorField.d.ts.map