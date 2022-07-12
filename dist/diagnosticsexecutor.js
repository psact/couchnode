"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.PingExecutor = exports.DiagnoticsExecutor = void 0;
/* eslint jsdoc/require-jsdoc: off */
const binding_1 = __importDefault(require("./binding"));
const generaltypes_1 = require("./generaltypes");
/**
 * @internal
 */
class DiagnoticsExecutor {
    /**
     * @internal
     */
    constructor(conns) {
        this._conns = conns;
    }
    async singleDiagnostics(conn) {
        return new Promise((resolve, reject) => {
            conn.diag(undefined, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const parsedReport = JSON.parse(data);
                resolve(parsedReport);
            });
        });
    }
    async diagnostics(options) {
        if (this._conns.length === 0) {
            throw new Error('found no connections to test');
        }
        const diagReses = await Promise.all(this._conns.map((conn) => this.singleDiagnostics(conn)));
        const baseConfig = diagReses[0];
        const report = {
            id: baseConfig.id,
            version: baseConfig.version,
            sdk: baseConfig.sdk,
            services: [],
        };
        if (options.reportId) {
            report.id = options.reportId;
        }
        diagReses.forEach((diagRes) => {
            if (diagRes.config) {
                diagRes.config.forEach((svcDiagRes) => {
                    report.services.push({
                        id: svcDiagRes.id,
                        type: svcDiagRes.type,
                        local: svcDiagRes.local,
                        remote: svcDiagRes.remote,
                        lastActivity: svcDiagRes.last_activity_us,
                        status: svcDiagRes.status,
                    });
                });
            }
        });
        return report;
    }
}
exports.DiagnoticsExecutor = DiagnoticsExecutor;
/**
 * @internal
 */
class PingExecutor {
    /**
     * @internal
     */
    constructor(conn) {
        this._conn = conn;
    }
    async ping(options) {
        let serviceFlags = 0;
        if (Array.isArray(options.serviceTypes)) {
            options.serviceTypes.forEach((serviceType) => {
                if (serviceType === generaltypes_1.ServiceType.KeyValue) {
                    serviceFlags |= binding_1.default.LCBX_SERVICETYPE_KEYVALUE;
                }
                else if (serviceType === generaltypes_1.ServiceType.Views) {
                    serviceFlags |= binding_1.default.LCBX_SERVICETYPE_VIEWS;
                }
                else if (serviceType === generaltypes_1.ServiceType.Query) {
                    serviceFlags |= binding_1.default.LCBX_SERVICETYPE_QUERY;
                }
                else if (serviceType === generaltypes_1.ServiceType.Search) {
                    serviceFlags |= binding_1.default.LCBX_SERVICETYPE_SEARCH;
                }
                else if (serviceType === generaltypes_1.ServiceType.Analytics) {
                    serviceFlags |= binding_1.default.LCBX_SERVICETYPE_ANALYTICS;
                }
                else {
                    throw new Error('invalid service type');
                }
            });
        }
        const reportId = options.reportId;
        const parentSpan = options.parentSpan;
        const timeout = options.timeout;
        return new Promise((resolve, reject) => {
            this._conn.ping(reportId, serviceFlags, parentSpan, timeout, (err, data) => {
                if (err) {
                    return reject(err);
                }
                const parsedReport = JSON.parse(data);
                resolve(parsedReport);
            });
        });
    }
}
exports.PingExecutor = PingExecutor;
