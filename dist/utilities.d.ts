import { DurabilityLevel } from './generaltypes';
/**
 * CAS represents an opaque value which can be used to compare documents to
 * determine if a change has occurred.
 *
 * @category Key-Value
 */
export declare type Cas = any;
/**
 * Reprents a node-style callback which receives an optional error or result.
 *
 * @category Utilities
 */
export interface NodeCallback<T> {
    (err: Error | null, result: T | null): void;
}
/**
 * @internal
 */
export declare class PromiseHelper {
    /**
     * @internal
     */
    static wrapAsync<T, U extends Promise<T>>(fn: () => U, callback?: (err: Error | null, result: T | null) => void): U;
    /**
     * @internal
     */
    static wrap<T>(fn: (callback: NodeCallback<T>) => void, callback?: NodeCallback<T> | null): Promise<T>;
}
/**
 * @internal
 */
export declare class CompoundTimeout {
    private _start;
    private _timeout;
    /**
     * @internal
     */
    constructor(timeout: number | undefined);
    /**
     * @internal
     */
    left(): number | undefined;
    /**
     * @internal
     */
    expired(): boolean;
}
/**
 * @internal
 */
export declare function msToGoDurationStr(ms?: number): string | undefined;
/**
 * @internal
 */
export declare function goDurationStrToMs(str?: string): number | undefined;
/**
 * @internal
 */
export declare function duraLevelToNsServerStr(level: DurabilityLevel | string | undefined): string | undefined;
/**
 * @internal
 */
export declare function nsServerStrToDuraLevel(level: string): DurabilityLevel;
/**
 * @internal
 */
export declare function cbQsStringify(values: {
    [key: string]: any;
}, options?: {
    boolAsString?: boolean;
}): string;
