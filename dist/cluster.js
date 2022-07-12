"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.Cluster = void 0;
const analyticsexecutor_1 = require("./analyticsexecutor");
const analyticsindexmanager_1 = require("./analyticsindexmanager");
const bucket_1 = require("./bucket");
const bucketmanager_1 = require("./bucketmanager");
const connection_1 = require("./connection");
const diagnosticsexecutor_1 = require("./diagnosticsexecutor");
const errors_1 = require("./errors");
const eventingfunctionmanager_1 = require("./eventingfunctionmanager");
const logging_1 = require("./logging");
const logging_2 = require("./logging");
const metrics_1 = require("./metrics");
const queryexecutor_1 = require("./queryexecutor");
const queryindexmanager_1 = require("./queryindexmanager");
const searchexecutor_1 = require("./searchexecutor");
const searchindexmanager_1 = require("./searchindexmanager");
const tracing_1 = require("./tracing");
const transcoders_1 = require("./transcoders");
const usermanager_1 = require("./usermanager");
const utilities_1 = require("./utilities");
/**
 * Exposes the operations which are available to be performed against a cluster.
 * Namely the ability to access to Buckets as well as performing management
 * operations against the cluster.
 *
 * @category Core
 */
class Cluster {
    /**
    @internal
    @deprecated Use the static sdk-level {@link connect} method instead.
    */
    constructor(connStr, options) {
        if (!options) {
            options = {};
        }
        this._connStr = connStr;
        this._trustStorePath = options.trustStorePath || '';
        this._kvTimeout = options.kvTimeout || 0;
        this._kvDurableTimeout = options.kvDurableTimeout || 0;
        this._viewTimeout = options.viewTimeout || 0;
        this._queryTimeout = options.queryTimeout || 0;
        this._analyticsTimeout = options.analyticsTimeout || 0;
        this._searchTimeout = options.searchTimeout || 0;
        this._managementTimeout = options.managementTimeout || 0;
        if (options.transcoder) {
            this._transcoder = options.transcoder;
        }
        else {
            this._transcoder = new transcoders_1.DefaultTranscoder();
        }
        if (options.tracer) {
            this._tracer = options.tracer;
        }
        else {
            this._tracer = new tracing_1.ThresholdLoggingTracer({});
        }
        if (options.meter) {
            this._meter = options.meter;
        }
        else {
            this._meter = new metrics_1.LoggingMeter({});
        }
        if (options.logFunc) {
            this._logFunc = options.logFunc;
        }
        else {
            this._logFunc = logging_2.defaultLogger;
        }
        if (options.username || options.password) {
            if (options.authenticator) {
                throw new Error('Cannot specify authenticator along with username/password.');
            }
            this._auth = {
                username: options.username || '',
                password: options.password || '',
            };
        }
        else if (options.authenticator) {
            this._auth = options.authenticator;
        }
        else {
            this._auth = {
                username: '',
                password: '',
            };
        }
        this._closed = false;
        this._clusterConn = null;
        this._conns = {};
    }
    /**
    @internal
    */
    get transcoder() {
        return this._transcoder;
    }
    /**
    @internal
    */
    static async connect(connStr, options, callback) {
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            const cluster = new Cluster(connStr, options);
            await cluster._clusterConnect();
            return cluster;
        }, callback);
    }
    /**
     * Creates a Bucket object reference to a specific bucket.
     *
     * @param bucketName The name of the bucket to reference.
     */
    bucket(bucketName) {
        return new bucket_1.Bucket(this, bucketName);
    }
    /**
     * Returns a UserManager which can be used to manage the users
     * of this cluster.
     */
    users() {
        return new usermanager_1.UserManager(this);
    }
    /**
     * Returns a BucketManager which can be used to manage the buckets
     * of this cluster.
     */
    buckets() {
        return new bucketmanager_1.BucketManager(this);
    }
    /**
     * Returns a QueryIndexManager which can be used to manage the query indexes
     * of this cluster.
     */
    queryIndexes() {
        return new queryindexmanager_1.QueryIndexManager(this);
    }
    /**
     * Returns a AnalyticsIndexManager which can be used to manage the analytics
     * indexes of this cluster.
     */
    analyticsIndexes() {
        return new analyticsindexmanager_1.AnalyticsIndexManager(this);
    }
    /**
     * Returns a SearchIndexManager which can be used to manage the search
     * indexes of this cluster.
     */
    searchIndexes() {
        return new searchindexmanager_1.SearchIndexManager(this);
    }
    /**
     * Returns a EventingFunctionManager which can be used to manage the eventing
     * functions of this cluster.
     * Volatile: This API is subject to change at any time.
     */
    eventingFunctions() {
        return new eventingfunctionmanager_1.EventingFunctionManager(this);
    }
    /**
     * Executes a N1QL query against the cluster.
     *
     * @param statement The N1QL statement to execute.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    query(statement, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const conn = this._getClusterConn();
        const exec = new queryexecutor_1.QueryExecutor(conn);
        const options_ = options;
        return utilities_1.PromiseHelper.wrapAsync(() => exec.query(statement, options_), callback);
    }
    /**
     * Executes an analytics query against the cluster.
     *
     * @param statement The analytics statement to execute.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    analyticsQuery(statement, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const conn = this._getClusterConn();
        const exec = new analyticsexecutor_1.AnalyticsExecutor(conn);
        const options_ = options;
        return utilities_1.PromiseHelper.wrapAsync(() => exec.query(statement, options_), callback);
    }
    /**
     * Executes a search query against the cluster.
     *
     * @param indexName The name of the index to query.
     * @param query The SearchQuery describing the query to execute.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    searchQuery(indexName, query, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const conn = this._getClusterConn();
        const exec = new searchexecutor_1.SearchExecutor(conn);
        const options_ = options;
        return utilities_1.PromiseHelper.wrapAsync(() => exec.query(indexName, query, options_), callback);
    }
    /**
     * Returns a diagnostics report about the currently active connections with the
     * cluster.  Includes information about remote and local addresses, last activity,
     * and other diagnostics information.
     *
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    diagnostics(options, callback) {
        if (options instanceof Function) {
            callback = arguments[0];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        let conns = Object.values(this._conns);
        if (this._clusterConn) {
            conns = [...conns, this._clusterConn];
        }
        const exec = new diagnosticsexecutor_1.DiagnoticsExecutor(conns);
        const options_ = options;
        return utilities_1.PromiseHelper.wrapAsync(() => exec.diagnostics(options_), callback);
    }
    /**
     * Performs a ping operation against the cluster.  Pinging the services which
     * are specified (or all services if none are specified).  Returns a report
     * which describes the outcome of the ping operations which were performed.
     *
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    ping(options, callback) {
        if (options instanceof Function) {
            callback = arguments[0];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const conn = this._getClusterConn();
        const exec = new diagnosticsexecutor_1.PingExecutor(conn);
        const options_ = options;
        return utilities_1.PromiseHelper.wrapAsync(() => exec.ping(options_), callback);
    }
    /**
     * Shuts down this cluster object.  Cleaning up all resources associated with it.
     *
     * @param callback A node-style callback to be invoked after execution.
     */
    close(callback) {
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            const closeOneConn = async (conn) => {
                return utilities_1.PromiseHelper.wrap((wrapCallback) => {
                    conn.close(wrapCallback);
                });
            };
            let allConns = Object.values(this._conns);
            this._conns = {};
            if (this._clusterConn) {
                allConns = [...allConns, this._clusterConn];
                this._clusterConn = null;
            }
            this._closed = true;
            await Promise.all(allConns.map((conn) => closeOneConn(conn)));
        }, callback);
    }
    _buildConnOpts(extraOpts) {
        const connOpts = {
            connStr: this._connStr,
            trustStorePath: this._trustStorePath,
            tracer: this._tracer,
            meter: this._meter,
            logFunc: this._logFunc,
            kvTimeout: this._kvTimeout,
            kvDurableTimeout: this._kvDurableTimeout,
            viewTimeout: this._viewTimeout,
            queryTimeout: this._queryTimeout,
            analyticsTimeout: this._analyticsTimeout,
            searchTimeout: this._searchTimeout,
            managementTimeout: this._managementTimeout,
            ...extraOpts,
        };
        if (this._auth) {
            const passAuth = this._auth;
            if (passAuth.username || passAuth.password) {
                connOpts.username = passAuth.username;
                connOpts.password = passAuth.password;
            }
            const certAuth = this._auth;
            if (certAuth.certificatePath || certAuth.keyPath) {
                connOpts.certificatePath = certAuth.certificatePath;
                connOpts.keyPath = certAuth.keyPath;
            }
        }
        return connOpts;
    }
    async _clusterConnect() {
        return new Promise((resolve, reject) => {
            const connOpts = this._buildConnOpts({});
            const conn = new connection_1.Connection(connOpts);
            conn.connect((err) => {
                if (err) {
                    return reject(err);
                }
                this._clusterConn = conn;
                resolve(null);
            });
        });
    }
    /**
    @internal
    */
    _getClusterConn() {
        if (this._closed) {
            throw new errors_1.ClusterClosedError();
        }
        if (this._clusterConn) {
            return this._clusterConn;
        }
        const conns = Object.values(this._conns);
        if (conns.length === 0) {
            throw new errors_1.NeedOpenBucketError();
        }
        return conns[0];
    }
    /**
     * @internal
     */
    _getConn(options) {
        if (this._closed) {
            throw new errors_1.ClusterClosedError();
        }
        // Hijack the cluster-level connection if it is available
        if (this._clusterConn) {
            this._clusterConn.close(() => {
                // TODO(brett19): Handle the close error here...
            });
            this._clusterConn = null;
            /*
            let conn = this._clusterConn;
            this._clusterConn = null;
      
            conn.selectBucket(opts.bucketName);
      
            this._conns[bucketName] = conn;
            return conn;
            */
        }
        // Build a new connection for this, since there is no
        // cluster-level connection available.
        const connOpts = this._buildConnOpts({
            bucketName: options.bucketName,
        });
        let conn = this._conns[options.bucketName];
        if (!conn) {
            conn = new connection_1.Connection(connOpts);
            conn.connect((err) => {
                if (err) {
                    (0, logging_1.libLogger)('failed to connect to bucket: %O', err);
                    conn.close(() => undefined);
                }
            });
            this._conns[options.bucketName] = conn;
        }
        return conn;
    }
}
exports.Cluster = Cluster;
