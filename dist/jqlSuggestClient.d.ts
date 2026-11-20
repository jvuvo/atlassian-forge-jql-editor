import { type JqlParseFeedback, type JqlSuggestion } from './jqlSuggest';
type SuggestJqlOptions = {
    projectKey?: string | null;
};
export declare function resetJqlAutocompleteCache(): void;
/** Fetch JQL suggestions via Forge bridge `requestJira` (current user), scoped to insert index. */
export declare function suggestJql(jql: string, cursor?: number | null, previousJql?: string, options?: SuggestJqlOptions): Promise<JqlSuggestion[]>;
/**
 * Live JQL validation via `POST /rest/api/3/jql/parse?validation=strict`.
 */
export declare function parseJql(jql: string): Promise<JqlParseFeedback>;
export {};
//# sourceMappingURL=jqlSuggestClient.d.ts.map