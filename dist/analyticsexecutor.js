"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.AnalyticsExecutor = void 0;
/* eslint jsdoc/require-jsdoc: off */
const analyticstypes_1 = require("./analyticstypes");
const binding_1 = __importDefault(require("./binding"));
const streamablepromises_1 = require("./streamablepromises");
const utilities_1 = require("./utilities");
/**
 * @internal
 */
class AnalyticsExecutor {
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
        if (options.clientContextId) {
            queryObj.client_context_id = options.clientContextId;
        }
        if (options.priority === true) {
            queryFlags |= binding_1.default.LCBX_ANALYTICSFLAG_PRIORITY;
        }
        if (options.readOnly) {
            queryObj.readonly = !!options.readOnly;
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
            return new analyticstypes_1.AnalyticsResult({
                rows: rows,
                meta: meta,
            });
        });
        this._conn.analyticsQuery(queryData, queryFlags, options.parentSpan, lcbTimeout, (err, flags, data) => {
            if (!(flags & binding_1.default.LCBX_RESP_F_NONFINAL)) {
                if (err) {
                    emitter.emit('error', err);
                    emitter.emit('end');
                    return;
                }
                const metaData = JSON.parse(data);
                let warnings;
                if (metaData.warnings) {
                    warnings = metaData.warnings.map((warningData) => new analyticstypes_1.AnalyticsWarning({
                        code: warningData.code,
                        message: warningData.message,
                    }));
                }
                else {
                    warnings = [];
                }
                const metricsData = metaData.metrics || {};
                const metrics = new analyticstypes_1.AnalyticsMetrics({
                    elapsedTime: (0, utilities_1.goDurationStrToMs)(metricsData.elapsedTime) || 0,
                    executionTime: (0, utilities_1.goDurationStrToMs)(metricsData.executionTime) || 0,
                    resultCount: metricsData.resultCount || 0,
                    resultSize: metricsData.resultSize || 0,
                    errorCount: metricsData.errorCount || 0,
                    processedObjects: metricsData.processedObjects || 0,
                    warningCount: metricsData.warningCount || 0,
                });
                const meta = new analyticstypes_1.AnalyticsMetaData({
                    requestId: metaData.requestID,
                    clientContextId: metaData.clientContextID,
                    status: metaData.status,
                    signature: metaData.signature,
                    warnings: warnings,
                    metrics: metrics,
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
exports.AnalyticsExecutor = AnalyticsExecutor;
