import { CppDurabilityMode, CppReplicaMode, CppStoreOpType } from './binding';
import { CppError } from './binding';
import { ErrorContext } from './errorcontexts';
import { DurabilityLevel } from './generaltypes';
/**
 * @internal
 */
export declare function cppStoreOpTypeToOpName(opType: CppStoreOpType): string;
/**
 * @internal
 */
export declare function cppReplicaModeToOpName(replicaMode: CppReplicaMode): string;
/**
 * @internal
 */
export declare function duraLevelToCppDuraMode(mode: DurabilityLevel | undefined): CppDurabilityMode | undefined;
/**
 * Wraps an error which has occurred within libcouchbase.
 */
export declare class LibcouchbaseError extends Error {
    /**
     * The error code that occurred.
     */
    code: number;
    /**
     * @internal
     */
    constructor(code: number);
}
/**
 * @internal
 */
export declare function translateCppContext(err: CppError | null): ErrorContext | null;
/**
 * @internal
 */
export declare function translateCppError(err: CppError | null): Error | null;
