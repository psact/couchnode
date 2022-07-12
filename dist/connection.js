"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
/* eslint jsdoc/require-jsdoc: off */
const binding_1 = __importDefault(require("./binding"));
const bindingutilities_1 = require("./bindingutilities");
const connspec_1 = require("./connspec");
const errors_1 = require("./errors");
const metrics_1 = require("./metrics");
const tracing_1 = require("./tracing");
function getClientString() {
    // Grab the various versions.  Note that we need to trim them
    // off as some Node.js versions insert strange characters into
    // the version identifiers (mainly newlines and such).
    /* eslint-disable-next-line @typescript-eslint/no-var-requires */
    const couchnodeVer = require('../package.json').version.trim();
    const nodeVer = process.versions.node.trim();
    const v8Ver = process.versions.v8.trim();
    const sslVer = process.versions.openssl.trim();
    return `couchnode/${couchnodeVer} (node/${nodeVer}; v8/${v8Ver}; ssl/${sslVer})`;
}
class Connection {
    constructor(options) {
        this._closed = false;
        this._closedErr = null;
        this._connected = false;
        this._opened = false;
        this._connectWaiters = [];
        const lcbDsnObj = connspec_1.ConnSpec.parse(options.connStr);
        // This function converts a timeout value expressed in milliseconds into
        // a string for the connection string, represented in seconds.
        const fmtTmt = (value) => {
            return (value / 1000).toString();
        };
        if (options.trustStorePath) {
            lcbDsnObj.options.truststorepath = options.trustStorePath;
        }
        if (options.certificatePath) {
            lcbDsnObj.options.certpath = options.certificatePath;
        }
        if (options.keyPath) {
            lcbDsnObj.options.keypath = options.keyPath;
        }
        if (options.bucketName) {
            lcbDsnObj.bucket = options.bucketName;
        }
        if (options.kvConnectTimeout) {
            lcbDsnObj.options.config_total_timeout = fmtTmt(options.kvConnectTimeout);
        }
        else {
            lcbDsnObj.options.config_total_timeout = '30s';
        }
        if (options.kvTimeout) {
            lcbDsnObj.options.timeout = fmtTmt(options.kvTimeout);
        }
        if (options.kvDurableTimeout) {
            lcbDsnObj.options.durability_timeout = fmtTmt(options.kvDurableTimeout);
        }
        if (options.viewTimeout) {
            lcbDsnObj.options.views_timeout = fmtTmt(options.viewTimeout);
        }
        if (options.queryTimeout) {
            lcbDsnObj.options.query_timeout = fmtTmt(options.queryTimeout);
        }
        if (options.analyticsTimeout) {
            lcbDsnObj.options.analytics_timeout = fmtTmt(options.analyticsTimeout);
        }
        if (options.searchTimeout) {
            lcbDsnObj.options.search_timeout = fmtTmt(options.searchTimeout);
        }
        if (options.managementTimeout) {
            lcbDsnObj.options.http_timeout = fmtTmt(options.managementTimeout);
        }
        let lcbTracer = undefined;
        if (options.tracer) {
            if (options.tracer instanceof tracing_1.NoopTracer) {
                lcbDsnObj.options.enable_tracing = 'off';
            }
            else if (options.tracer instanceof tracing_1.ThresholdLoggingTracer) {
                const tracerOpts = options.tracer._options;
                lcbDsnObj.options.enable_tracing = 'on';
                if (tracerOpts.emitInterval) {
                    lcbDsnObj.options.tracing_threshold_queue_flush_interval = fmtTmt(tracerOpts.emitInterval);
                }
                if (tracerOpts.sampleSize) {
                    lcbDsnObj.options.tracing_threshold_queue_size =
                        tracerOpts.sampleSize.toString();
                }
                if (tracerOpts.kvThreshold) {
                    lcbDsnObj.options.tracing_threshold_kv = fmtTmt(tracerOpts.kvThreshold);
                }
                if (tracerOpts.queryThreshold) {
                    lcbDsnObj.options.tracing_threshold_query = fmtTmt(tracerOpts.queryThreshold);
                }
                if (tracerOpts.viewsThreshold) {
                    lcbDsnObj.options.tracing_threshold_view = fmtTmt(tracerOpts.viewsThreshold);
                }
                if (tracerOpts.searchThreshold) {
                    lcbDsnObj.options.tracing_threshold_search = fmtTmt(tracerOpts.searchThreshold);
                }
                if (tracerOpts.analyticsThreshold) {
                    lcbDsnObj.options.tracing_threshold_analytics = fmtTmt(tracerOpts.analyticsThreshold);
                }
            }
            else {
                lcbDsnObj.options.enable_tracing = 'on';
                lcbTracer = options.tracer;
            }
        }
        let lcbMeter = undefined;
        if (options.meter) {
            if (options.meter instanceof metrics_1.NoopMeter) {
                lcbDsnObj.options.enable_operation_metrics = 'off';
            }
            else if (options.meter instanceof metrics_1.LoggingMeter) {
                const meterOpts = options.meter._options;
                lcbDsnObj.options.enable_operation_metrics = 'on';
                if (meterOpts.emitInterval) {
                    lcbDsnObj.options.operation_metrics_flush_interval = fmtTmt(meterOpts.emitInterval);
                }
            }
            else {
                lcbDsnObj.options.enable_operation_metrics = 'on';
                lcbMeter = options.meter;
            }
        }
        lcbDsnObj.options.client_string = getClientString();
        const lcbConnStr = lcbDsnObj.toString();
        let lcbConnType = binding_1.default.LCB_TYPE_CLUSTER;
        if (lcbDsnObj.bucket) {
            lcbConnType = binding_1.default.LCB_TYPE_BUCKET;
        }
        // This conversion relies on the LogSeverity and CppLogSeverity enumerations
        // always being in sync.  There is a test that ensures this.
        const lcbLogFunc = options.logFunc;
        this._inst = new binding_1.default.Connection(lcbConnType, lcbConnStr, options.username, options.password, lcbLogFunc, lcbTracer, lcbMeter);
        // If a bucket name is specified, this connection is immediately marked as
        // opened, with the assumption that the binding is doing this implicitly.
        if (lcbDsnObj.bucket) {
            this._opened = true;
        }
    }
    connect(callback) {
        this._inst.connect((err) => {
            if (err) {
                this._closed = true;
                this._closedErr = (0, bindingutilities_1.translateCppError)(err);
                callback(this._closedErr);
                this._connectWaiters.forEach((waitFn) => waitFn());
                this._connectWaiters = [];
                return;
            }
            this._connected = true;
            callback(null);
            this._connectWaiters.forEach((waitFn) => waitFn());
            this._connectWaiters = [];
        });
    }
    selectBucket(bucketName, callback) {
        this._inst.selectBucket(bucketName, (err) => {
            if (err) {
                return callback((0, bindingutilities_1.translateCppError)(err));
            }
            this._opened = true;
            callback(null);
        });
    }
    close(callback) {
        if (this._closed) {
            return;
        }
        this._closed = true;
        this._closedErr = new errors_1.ConnectionClosedError();
        this._inst.shutdown();
        callback(null);
    }
    get(...args) {
        return this._proxyToConn(this._inst, this._inst.get, ...args);
    }
    exists(...args) {
        return this._proxyToConn(this._inst, this._inst.exists, ...args);
    }
    getReplica(...args) {
        return this._proxyToConn(this._inst, this._inst.getReplica, ...args);
    }
    store(...args) {
        return this._proxyToConn(this._inst, this._inst.store, ...args);
    }
    remove(...args) {
        return this._proxyToConn(this._inst, this._inst.remove, ...args);
    }
    touch(...args) {
        return this._proxyToConn(this._inst, this._inst.touch, ...args);
    }
    unlock(...args) {
        return this._proxyToConn(this._inst, this._inst.unlock, ...args);
    }
    counter(...args) {
        return this._proxyToConn(this._inst, this._inst.counter, ...args);
    }
    lookupIn(...args) {
        return this._proxyToConn(this._inst, this._inst.lookupIn, ...args);
    }
    mutateIn(...args) {
        return this._proxyToConn(this._inst, this._inst.mutateIn, ...args);
    }
    viewQuery(...args) {
        return this._proxyToConn(this._inst, this._inst.viewQuery, ...args);
    }
    query(...args) {
        return this._proxyToConn(this._inst, this._inst.query, ...args);
    }
    analyticsQuery(...args) {
        return this._proxyToConn(this._inst, this._inst.analyticsQuery, ...args);
    }
    searchQuery(...args) {
        return this._proxyToConn(this._inst, this._inst.searchQuery, ...args);
    }
    httpRequest(...args) {
        return this._proxyOnBootstrap(this._inst, this._inst.httpRequest, ...args);
    }
    ping(...args) {
        return this._proxyOnBootstrap(this._inst, this._inst.ping, ...args);
    }
    diag(...args) {
        return this._proxyToConn(this._inst, this._inst.diag, ...args);
    }
    _proxyOnBootstrap(thisArg, fn, ...newArgs) {
        if (this._closed || this._connected) {
            return this._proxyToConn(thisArg, fn, ...newArgs);
        }
        else {
            this._connectWaiters.push(() => {
                return this._proxyToConn(thisArg, fn, ...newArgs);
            });
        }
    }
    _proxyToConn(thisArg, fn, ...newArgs) {
        const wrappedArgs = newArgs;
        const callback = wrappedArgs.pop();
        if (this._closed) {
            return callback(this._closedErr);
        }
        wrappedArgs.push((err, ...cbArgs) => {
            const translatedErr = (0, bindingutilities_1.translateCppError)(err);
            callback.apply(undefined, [translatedErr, ...cbArgs]);
        });
        fn.apply(thisArg, wrappedArgs);
    }
}
exports.Connection = Connection;
