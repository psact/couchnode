"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchExecutor = void 0;
const binding_1 = __importDefault(require("./binding"));
const searchtypes_1 = require("./searchtypes");
const streamablepromises_1 = require("./streamablepromises");
/**
 * @internal
 */
class SearchExecutor {
    /**
     * @internal
     */
    constructor(conn) {
        this._conn = conn;
    }
    query(indexName, query, options) {
        const queryObj = {};
        const queryObjCtl = {};
        const queryFlags = 0;
        queryObj.indexName = indexName;
        queryObj.query = query;
        if (options.skip !== undefined) {
            queryObj.from = options.skip;
        }
        if (options.limit !== undefined) {
            queryObj.size = options.limit;
        }
        if (options.explain) {
            queryObj.explain = !!options.explain;
        }
        if (options.highlight) {
            queryObj.highlight = options.highlight;
        }
        if (options.collections) {
            queryObj.collections = options.collections;
        }
        if (options.fields) {
            queryObj.fields = options.fields;
        }
        if (options.facets) {
            queryObj.facets = options.facets;
        }
        if (options.sort) {
            queryObj.sort = options.sort;
        }
        if (options.disableScoring) {
            queryObj.score = 'none';
        }
        if (options.includeLocations !== undefined) {
            queryObj.includeLocations = options.includeLocations;
        }
        if (options.consistency) {
            queryObjCtl.consistency = {
                level: options.consistency,
            };
        }
        if (options.consistentWith) {
            if (queryObjCtl.consistency) {
                throw new Error('cannot specify consistency and consistentWith together');
            }
            queryObjCtl.consistency = {
                level: 'at_plus',
                vectors: options.consistentWith.toJSON(),
            };
        }
        if (options.timeout) {
            queryObjCtl.timeout = options.timeout;
        }
        if (options.raw) {
            for (const i in options.raw) {
                queryObj[i] = options.raw[i];
            }
        }
        // Only inject the `ctl` component if there are ctl's.
        if (Object.keys(queryObjCtl).length > 0) {
            queryObj.ctl = queryObjCtl;
        }
        const queryData = JSON.stringify(queryObj);
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        const emitter = new streamablepromises_1.StreamableRowPromise((rows, meta) => {
            return new searchtypes_1.SearchResult({
                rows: rows,
                meta: meta,
            });
        });
        this._conn.searchQuery(queryData, queryFlags, options.parentSpan, lcbTimeout, (err, flags, data) => {
            if (!(flags & binding_1.default.LCBX_RESP_F_NONFINAL)) {
                if (err) {
                    emitter.emit('error', err);
                    emitter.emit('end');
                    return;
                }
                const meta = JSON.parse(data);
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
exports.SearchExecutor = SearchExecutor;
