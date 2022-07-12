import { AnalyticsIndexManager } from './analyticsindexmanager';
import { AnalyticsMetaData, AnalyticsQueryOptions, AnalyticsResult } from './analyticstypes';
import { Authenticator } from './authenticators';
import { Bucket } from './bucket';
import { BucketManager } from './bucketmanager';
import { Connection } from './connection';
import { DiagnosticsOptions, DiagnosticsResult, PingOptions, PingResult } from './diagnosticstypes';
import { EventingFunctionManager } from './eventingfunctionmanager';
import { LogFunc } from './logging';
import { Meter } from './metrics';
import { QueryIndexManager } from './queryindexmanager';
import { QueryMetaData, QueryOptions, QueryResult } from './querytypes';
import { SearchIndexManager } from './searchindexmanager';
import { SearchQuery } from './searchquery';
import { SearchMetaData, SearchQueryOptions, SearchResult, SearchRow } from './searchtypes';
import { StreamableRowPromise } from './streamablepromises';
import { RequestTracer } from './tracing';
import { Transcoder } from './transcoders';
import { UserManager } from './usermanager';
import { NodeCallback } from './utilities';
/**
 * Specifies the options which can be specified when connecting
 * to a cluster.
 *
 * @category Core
 */
export interface ConnectOptions {
    /**
     * Specifies a username to use for an implicitly created IPasswordAuthenticator
     * used for authentication with the cluster.
     */
    username?: string;
    /**
     * Specifies a password to be used in concert with username for authentication.
     *
     * @see ConnectOptions.username
     */
    password?: string;
    /**
     * Specifies a specific authenticator to use when connecting to the cluster.
     */
    authenticator?: Authenticator;
    /**
     * Specifies the path to a trust store file to be used when validating the
     * authenticity of the server when connecting over SSL.
     */
    trustStorePath?: string;
    /**
     * Specifies the default timeout for KV operations, specified in millseconds.
     */
    kvTimeout?: number;
    /**
     * Specifies the default timeout for durable KV operations, specified in millseconds.
     */
    kvDurableTimeout?: number;
    /**
     * Specifies the default timeout for views operations, specified in millseconds.
     */
    viewTimeout?: number;
    /**
     * Specifies the default timeout for query operations, specified in millseconds.
     */
    queryTimeout?: number;
    /**
     * Specifies the default timeout for analytics query operations, specified in millseconds.
     */
    analyticsTimeout?: number;
    /**
     * Specifies the default timeout for search query operations, specified in millseconds.
     */
    searchTimeout?: number;
    /**
     * Specifies the default timeout for management operations, specified in millseconds.
     */
    managementTimeout?: number;
    /**
     * Specifies the default transcoder to use when encoding or decoding document values.
     */
    transcoder?: Transcoder;
    /**
     * Specifies the tracer to use for diagnostics tracing.
     */
    tracer?: RequestTracer;
    /**
     * Specifies the meter to use for diagnostics metrics.
     */
    meter?: Meter;
    /**
     * Specifies a logging function to use when outputting logging.
     */
    logFunc?: LogFunc;
}
/**
 * Exposes the operations which are available to be performed against a cluster.
 * Namely the ability to access to Buckets as well as performing management
 * operations against the cluster.
 *
 * @category Core
 */
export declare class Cluster {
    private _connStr;
    private _trustStorePath;
    private _kvTimeout;
    private _kvDurableTimeout;
    private _viewTimeout;
    private _queryTimeout;
    private _analyticsTimeout;
    private _searchTimeout;
    private _managementTimeout;
    private _auth;
    private _closed;
    private _clusterConn;
    private _conns;
    private _transcoder;
    private _tracer;
    private _meter;
    private _logFunc;
    /**
    @internal
    */
    get transcoder(): Transcoder;
    /**
    @internal
    @deprecated Use the static sdk-level {@link connect} method instead.
    */
    constructor(connStr: string, options?: ConnectOptions);
    /**
    @internal
    */
    static connect(connStr: string, options?: ConnectOptions, callback?: NodeCallback<Cluster>): Promise<Cluster>;
    /**
     * Creates a Bucket object reference to a specific bucket.
     *
     * @param bucketName The name of the bucket to reference.
     */
    bucket(bucketName: string): Bucket;
    /**
     * Returns a UserManager which can be used to manage the users
     * of this cluster.
     */
    users(): UserManager;
    /**
     * Returns a BucketManager which can be used to manage the buckets
     * of this cluster.
     */
    buckets(): BucketManager;
    /**
     * Returns a QueryIndexManager which can be used to manage the query indexes
     * of this cluster.
     */
    queryIndexes(): QueryIndexManager;
    /**
     * Returns a AnalyticsIndexManager which can be used to manage the analytics
     * indexes of this cluster.
     */
    analyticsIndexes(): AnalyticsIndexManager;
    /**
     * Returns a SearchIndexManager which can be used to manage the search
     * indexes of this cluster.
     */
    searchIndexes(): SearchIndexManager;
    /**
     * Returns a EventingFunctionManager which can be used to manage the eventing
     * functions of this cluster.
     * Volatile: This API is subject to change at any time.
     */
    eventingFunctions(): EventingFunctionManager;
    /**
     * Executes a N1QL query against the cluster.
     *
     * @param statement The N1QL statement to execute.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    query<TRow = any>(statement: string, options?: QueryOptions, callback?: NodeCallback<QueryResult<TRow>>): StreamableRowPromise<QueryResult<TRow>, TRow, QueryMetaData>;
    /**
     * Executes an analytics query against the cluster.
     *
     * @param statement The analytics statement to execute.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    analyticsQuery<TRow = any>(statement: string, options?: AnalyticsQueryOptions, callback?: NodeCallback<AnalyticsResult<TRow>>): StreamableRowPromise<AnalyticsResult<TRow>, TRow, AnalyticsMetaData>;
    /**
     * Executes a search query against the cluster.
     *
     * @param indexName The name of the index to query.
     * @param query The SearchQuery describing the query to execute.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    searchQuery(indexName: string, query: SearchQuery, options?: SearchQueryOptions, callback?: NodeCallback<SearchResult>): StreamableRowPromise<SearchResult, SearchRow, SearchMetaData>;
    /**
     * Returns a diagnostics report about the currently active connections with the
     * cluster.  Includes information about remote and local addresses, last activity,
     * and other diagnostics information.
     *
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    diagnostics(options?: DiagnosticsOptions, callback?: NodeCallback<DiagnosticsResult>): Promise<DiagnosticsResult>;
    /**
     * Performs a ping operation against the cluster.  Pinging the services which
     * are specified (or all services if none are specified).  Returns a report
     * which describes the outcome of the ping operations which were performed.
     *
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    ping(options?: PingOptions, callback?: NodeCallback<PingResult>): Promise<PingResult>;
    /**
     * Shuts down this cluster object.  Cleaning up all resources associated with it.
     *
     * @param callback A node-style callback to be invoked after execution.
     */
    close(callback?: NodeCallback<void>): Promise<void>;
    private _buildConnOpts;
    private _clusterConnect;
    /**
    @internal
    */
    _getClusterConn(): Connection;
    /**
     * @internal
     */
    _getConn(options: {
        bucketName: string;
    }): Connection;
}
