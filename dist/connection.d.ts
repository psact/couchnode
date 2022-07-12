import { CppConnection, CppError } from './binding';
import { LogFunc } from './logging';
import { Meter } from './metrics';
import { RequestTracer } from './tracing';
export interface ConnectionOptions {
    connStr: string;
    username?: string;
    password?: string;
    trustStorePath?: string;
    certificatePath?: string;
    keyPath?: string;
    bucketName?: string;
    kvConnectTimeout?: number;
    kvTimeout?: number;
    kvDurableTimeout?: number;
    viewTimeout?: number;
    queryTimeout?: number;
    analyticsTimeout?: number;
    searchTimeout?: number;
    managementTimeout?: number;
    tracer?: RequestTracer;
    meter?: Meter;
    logFunc?: LogFunc;
}
declare type MergeArgs<A, B> = A extends [...infer Params] ? [...Params, ...(B extends [...infer Params2] ? Params2 : [])] : never;
declare type CppCbToNew<T extends (...fargs: any[]) => void> = T extends (...fargs: [
    ...infer FArgs,
    (err: CppError | null, ...cbArgs: infer CbArgs) => void
]) => void ? [
    ...fargs: MergeArgs<FArgs, [
        callback: (err: Error | null, ...cbArgs: CbArgs) => void
    ]>
] : never;
export declare class Connection {
    private _inst;
    private _connected;
    private _opened;
    private _closed;
    private _closedErr;
    private _connectWaiters;
    constructor(options: ConnectionOptions);
    connect(callback: (err: Error | null) => void): void;
    selectBucket(bucketName: string, callback: (err: Error | null) => void): void;
    close(callback: (err: Error | null) => void): void;
    get(...args: CppCbToNew<CppConnection['get']>): ReturnType<CppConnection['get']>;
    exists(...args: CppCbToNew<CppConnection['exists']>): ReturnType<CppConnection['exists']>;
    getReplica(...args: CppCbToNew<CppConnection['getReplica']>): ReturnType<CppConnection['getReplica']>;
    store(...args: CppCbToNew<CppConnection['store']>): ReturnType<CppConnection['store']>;
    remove(...args: CppCbToNew<CppConnection['remove']>): ReturnType<CppConnection['remove']>;
    touch(...args: CppCbToNew<CppConnection['touch']>): ReturnType<CppConnection['touch']>;
    unlock(...args: CppCbToNew<CppConnection['unlock']>): ReturnType<CppConnection['unlock']>;
    counter(...args: CppCbToNew<CppConnection['counter']>): ReturnType<CppConnection['counter']>;
    lookupIn(...args: CppCbToNew<CppConnection['lookupIn']>): ReturnType<CppConnection['lookupIn']>;
    mutateIn(...args: CppCbToNew<CppConnection['mutateIn']>): ReturnType<CppConnection['mutateIn']>;
    viewQuery(...args: CppCbToNew<CppConnection['viewQuery']>): ReturnType<CppConnection['viewQuery']>;
    query(...args: CppCbToNew<CppConnection['query']>): ReturnType<CppConnection['query']>;
    analyticsQuery(...args: CppCbToNew<CppConnection['analyticsQuery']>): ReturnType<CppConnection['analyticsQuery']>;
    searchQuery(...args: CppCbToNew<CppConnection['searchQuery']>): ReturnType<CppConnection['searchQuery']>;
    httpRequest(...args: CppCbToNew<CppConnection['httpRequest']>): ReturnType<CppConnection['httpRequest']>;
    ping(...args: CppCbToNew<CppConnection['ping']>): ReturnType<CppConnection['ping']>;
    diag(...args: CppCbToNew<CppConnection['diag']>): ReturnType<CppConnection['diag']>;
    private _proxyOnBootstrap;
    private _proxyToConn;
}
export {};
