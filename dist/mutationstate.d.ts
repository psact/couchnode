/**
 * Represents the mutation token returned by the server.
 *
 * @see {@link MutationState}
 */
export declare class MutationToken {
    private constructor();
}
/**
 * Aggregates a number of {@link MutationToken}'s which have been returned by mutation
 * operations, which can then be used when performing queries.  This will guarenteed
 * that the query includes the specified set of mutations without incurring the wait
 * associated with request_plus level consistency.
 */
export declare class MutationState {
    private _data;
    constructor(...tokens: MutationToken[]);
    /**
     * Adds a set of tokens to this state.
     *
     * @param tokens The tokens to add.
     */
    add(...tokens: MutationToken[]): void;
    private _addOne;
    /**
     * @internal
     */
    toJSON(): any;
    /**
     * @internal
     */
    inspect(): string;
}
