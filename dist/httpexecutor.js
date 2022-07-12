"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.HttpExecutor = exports.HttpMethod = exports.HttpServiceType = void 0;
/* eslint jsdoc/require-jsdoc: off */
const binding_1 = __importDefault(require("./binding"));
const errorcontexts_1 = require("./errorcontexts");
const events = __importStar(require("events"));
/**
 * @internal
 */
var HttpServiceType;
(function (HttpServiceType) {
    HttpServiceType["Management"] = "MGMT";
    HttpServiceType["Views"] = "VIEW";
    HttpServiceType["Query"] = "QUERY";
    HttpServiceType["Search"] = "SEARCH";
    HttpServiceType["Analytics"] = "ANALYTICS";
    HttpServiceType["Eventing"] = "EVENTING";
})(HttpServiceType = exports.HttpServiceType || (exports.HttpServiceType = {}));
/**
 * @internal
 */
var HttpMethod;
(function (HttpMethod) {
    HttpMethod["Get"] = "GET";
    HttpMethod["Post"] = "POST";
    HttpMethod["Put"] = "PUT";
    HttpMethod["Delete"] = "DELETE";
})(HttpMethod = exports.HttpMethod || (exports.HttpMethod = {}));
/**
 * @internal
 */
class HttpExecutor {
    /**
     * @internal
     */
    constructor(conn) {
        this._conn = conn;
    }
    streamRequest(options) {
        const emitter = new events.EventEmitter();
        let lcbHttpType;
        if (options.type === HttpServiceType.Management) {
            lcbHttpType = binding_1.default.LCB_HTTP_TYPE_MANAGEMENT;
        }
        else if (options.type === HttpServiceType.Views) {
            lcbHttpType = binding_1.default.LCB_HTTP_TYPE_VIEW;
        }
        else if (options.type === HttpServiceType.Query) {
            lcbHttpType = binding_1.default.LCB_HTTP_TYPE_QUERY;
        }
        else if (options.type === HttpServiceType.Search) {
            lcbHttpType = binding_1.default.LCB_HTTP_TYPE_SEARCH;
        }
        else if (options.type === HttpServiceType.Analytics) {
            lcbHttpType = binding_1.default.LCB_HTTP_TYPE_ANALYTICS;
        }
        else if (options.type === HttpServiceType.Eventing) {
            lcbHttpType = binding_1.default.LCB_HTTP_TYPE_EVENTING;
        }
        else {
            throw new Error('unexpected http request type');
        }
        let lcbHttpMethod;
        if (options.method === HttpMethod.Get) {
            lcbHttpMethod = binding_1.default.LCB_HTTP_METHOD_GET;
        }
        else if (options.method === HttpMethod.Post) {
            lcbHttpMethod = binding_1.default.LCB_HTTP_METHOD_POST;
        }
        else if (options.method === HttpMethod.Put) {
            lcbHttpMethod = binding_1.default.LCB_HTTP_METHOD_PUT;
        }
        else if (options.method === HttpMethod.Delete) {
            lcbHttpMethod = binding_1.default.LCB_HTTP_METHOD_DELETE;
        }
        else {
            throw new Error('unexpected http request method');
        }
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        this._conn.httpRequest(lcbHttpType, lcbHttpMethod, options.path, options.contentType, options.body, options.parentSpan, lcbTimeout, (err, flags, data) => {
            if (!(flags & binding_1.default.LCBX_RESP_F_NONFINAL)) {
                if (err) {
                    emitter.emit('error', err);
                    return;
                }
                // data will be an object
                emitter.emit('end', data);
                return;
            }
            if (err) {
                throw new Error('unexpected error on non-final callback');
            }
            // data will be a buffer
            emitter.emit('data', data);
        });
        return emitter;
    }
    async request(options) {
        return new Promise((resolve, reject) => {
            const emitter = this.streamRequest(options);
            emitter.on('error', (err) => {
                reject(err);
            });
            let dataCache = Buffer.allocUnsafe(0);
            emitter.on('data', (data) => {
                dataCache = Buffer.concat([dataCache, data]);
            });
            emitter.on('end', (meta) => {
                const headers = {};
                for (let i = 0; i < meta.headers.length; i += 2) {
                    const headerName = meta.headers[i + 0];
                    const headerValue = meta.headers[i + 1];
                    if (headers[headerName]) {
                        headers[headerName] += ',' + headerValue;
                    }
                    else {
                        headers[headerName] = headerValue;
                    }
                }
                resolve({
                    requestOptions: options,
                    statusCode: meta.statusCode,
                    headers: headers,
                    body: dataCache,
                });
            });
        });
    }
    static errorContextFromResponse(resp) {
        return new errorcontexts_1.HttpErrorContext({
            method: resp.requestOptions.method,
            request_path: resp.requestOptions.path,
            response_code: resp.statusCode,
            response_body: resp.body.toString(),
        });
    }
}
exports.HttpExecutor = HttpExecutor;
