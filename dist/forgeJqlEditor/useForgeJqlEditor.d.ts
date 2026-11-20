import { type JqlSuggestion } from '../jqlSuggest';
import type { ForgeJqlEditorProps } from './types';
type UseForgeJqlEditorArgs = Pick<ForgeJqlEditorProps, 'value' | 'onChange' | 'projectKey' | 'onValidityChange' | 'validateRequest'>;
export declare function useForgeJqlEditor({ value, onChange, projectKey, onValidityChange, validateRequest, }: UseForgeJqlEditorArgs): {
    error: string | null;
    warning: string | null;
    isValid: boolean;
    validating: boolean;
    suggestions: JqlSuggestion[];
    isSuggestOpen: boolean;
    clearSuggestions: () => void;
    handleChange: (event: {
        target?: {
            value?: string;
            selectionStart?: number | null;
        } | null;
    }) => void;
    handleBlur: () => void;
    runValidate: (quiet?: boolean, jqlOverride?: string) => Promise<boolean>;
};
export {};
//# sourceMappingURL=useForgeJqlEditor.d.ts.map