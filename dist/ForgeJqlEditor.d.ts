import React from 'react';
export type ForgeJqlEditorValidity = {
    /** True when JQL is empty (optional) or parses without errors. */
    isValid: boolean;
    error: string | null;
    warning: string | null;
};
export type ForgeJqlEditorHandle = {
    /**
     * Validate current JQL. Empty string is valid (optional filter).
     * Uses `validateRequest` when provided, otherwise `parseJql`.
     */
    validate: (options?: {
        quiet?: boolean;
    }) => Promise<boolean>;
};
export type ForgeJqlEditorProps = {
    value: string;
    onChange: (jql: string) => void;
    /** When set (and not `-1`), scopes autocomplete via POST `/jql/autocompletedata`. */
    projectKey?: string | null;
    id?: string;
    name?: string;
    label?: string;
    description?: string;
    learnMoreHref?: string | null;
    placeholder?: string;
    minimumRows?: number;
    isDisabled?: boolean;
    /** Live validity for save gating, etc. */
    onValidityChange?: (state: ForgeJqlEditorValidity) => void;
    /**
     * Optional server-side validator (e.g. Forge `invoke('testJql')`).
     * Return `{ error }` or throw; success = no error / `true`.
     */
    validateRequest?: (jql: string) => Promise<{
        error?: string;
    } | boolean | void>;
};
/**
 * Forge UI Kit JQL field with as-you-type suggestions and live parse feedback.
 */
export declare const ForgeJqlEditor: React.ForwardRefExoticComponent<ForgeJqlEditorProps & React.RefAttributes<ForgeJqlEditorHandle>>;
//# sourceMappingURL=ForgeJqlEditor.d.ts.map