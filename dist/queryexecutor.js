"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryExecutor = void 0;
/* eslint jsdoc/require-jsdoc: off */
const binding_1 = __importDefault(require("./binding"));
const querytypes_1 = require("./querytypes");
const streamablepromises_1 = require("./streamablepromises");
const utilities_1 = require("./utilities");
/**
 * @internal
 */
class QueryExecutor {
    /**
     * @internal
     */
    constructor(conn) {
        this._conn = conn;
    }
    query(query, options) {
        const queryObj = {};
        let queryFlags = 0;
        queryObj.statement = query.toString();
        if (options.scanConsistency) {
            queryObj.scan_consistency = options.scanConsistency;
        }
        if (options.consistentWith) {
            if (queryObj.scan_consistency) {
                throw new Error('cannot specify consistency and consistentWith together');
            }
            queryObj.scan_consistency = 'at_plus';
            queryObj.scan_vectors = options.consistentWith.toJSON();
        }
        if (options.adhoc === false) {
            queryFlags |= binding_1.default.LCBX_QUERYFLAG_PREPCACHE;
        }
        if (options.flexIndex) {
            queryObj.use_fts = true;
        }
        if (options.clientContextId) {
            queryObj.client_context_id = options.clientContextId;
        }
        if (options.maxParallelism) {
            queryObj.max_parallelism = options.maxParallelism.toString();
        }
        if (options.pipelineBatch) {
            queryObj.pipeline_batch = options.pipelineBatch.toString();
        }
        if (options.pipelineCap) {
            queryObj.pipeline_cap = options.pipelineCap.toString();
        }
        if (options.scanWait) {
            queryObj.scan_wait = (0, utilities_1.msToGoDurationStr)(options.scanWait);
        }
        if (options.scanCap) {
            queryObj.scan_cap = options.scanCap.toString();
        }
        if (options.readOnly) {
            queryObj.readonly = !!options.readOnly;
        }
        if (options.profile) {
            queryObj.profile = options.profile;
        }
        if (options.metrics) {
            queryObj.metrics = options.metrics;
        }
        if (options.queryContext) {
            queryObj.query_context = options.queryContext;
        }
        if (options.parameters) {
            const params = options.parameters;
            if (Array.isArray(params)) {
                queryObj.args = params;
            }
            else {
                Object.entries(params).forEach(([key, value]) => {
                    queryObj['$' + key] = value;
                });
            }
        }
        if (options.raw) {
            for (const i in options.raw) {
                queryObj[i] = options.raw[i];
            }
        }
        const queryData = JSON.stringify(queryObj);
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        const emitter = new streamablepromises_1.StreamableRowPromise((rows, meta) => {
            return new querytypes_1.QueryResult({
                rows: rows,
                meta: meta,
            });
        });
        this._conn.query(queryData, queryFlags, options.parentSpan, lcbTimeout, (err, flags, data) => {
            if (!(flags & binding_1.default.LCBX_RESP_F_NONFINAL)) {
                if (err) {
                    emitter.emit('error', err);
                    emitter.emit('end');
                    return;
                }
                const metaData = JSON.parse(data);
                let warnings;
                if (metaData.warnings) {
                    warnings = metaData.warnings.map((warningData) => new querytypes_1.QueryWarning({
                        code: warningData.code,
                        message: warningData.message,
                    }));
                }
                else {
                    warnings = [];
                }
                let metrics;
                if (metaData.metrics) {
                    const metricsData = metaData.metrics;
                    metrics = new querytypes_1.QueryMetrics({
                        elapsedTime: (0, utilities_1.goDurationStrToMs)(metricsData.elapsedTime) || 0,
                        executionTime: (0, utilities_1.goDurationStrToMs)(metricsData.executionTime) || 0,
                        sortCount: metricsData.sortCount || 0,
                        resultCount: metricsData.resultCount || 0,
                        resultSize: metricsData.resultSize || 0,
                        mutationCount: metricsData.mutationCount || 0,
                        errorCount: metricsData.errorCount || 0,
                        warningCount: metricsData.warningCount || 0,
                    });
                }
                else {
                    metrics = undefined;
                }
                const meta = new querytypes_1.QueryMetaData({
                    requestId: metaData.requestID,
                    clientContextId: metaData.clientContextID,
                    status: metaData.status,
                    signature: metaData.signature,
                    warnings: warnings,
                    metrics: metrics,
                    profile: metaData.profile,
                });
                emitter.emit('meta', meta);
                emitter.emit('end');
                return;
            }
            if (err) {
                emitter.emit('error', err);
                return;
            }
            const row = JSON.parse(data);
            emitter.emit('row', row);
        });
        return emitter;
    }
}
exports.QueryExecutor = QueryExecutor;
