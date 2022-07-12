"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.ViewExecutor = void 0;
const binding_1 = __importDefault(require("./binding"));
const streamablepromises_1 = require("./streamablepromises");
const utilities_1 = require("./utilities");
const viewtypes_1 = require("./viewtypes");
/**
 * @internal
 */
class ViewExecutor {
    /**
     * @internal
     */
    constructor(conn) {
        this._conn = conn;
    }
    query(designDoc, viewName, options) {
        // BUG(JSCBC-727): Due to an oversight, the 3.0.0 release of the SDK incorrectly
        // specified various options using underscores rather than camelCase as the
        // rest of our API does.  We accept the deprecated versions as well as the standard
        // versions below.
        // BUG(JSCBC-822): We inadvertently created the enumeration for view ordering incorrectly
        // when it was first introduced, we perform some compatibility handling to support this.
        const queryOpts = {};
        const queryFlags = 0;
        if (options.stale !== undefined) {
            queryOpts.stale = options.stale;
        }
        if (options.scanConsistency !== undefined) {
            queryOpts.stale = options.scanConsistency;
        }
        if (options.skip !== undefined) {
            queryOpts.skip = options.skip;
        }
        if (options.limit !== undefined) {
            queryOpts.limit = options.limit;
        }
        if (options.order !== undefined) {
            if (typeof options.order === 'string') {
                queryOpts.descending = options.order;
            }
            else {
                if (options.order > 0) {
                    queryOpts.descending = false;
                }
                else if (options.order < 0) {
                    queryOpts.descending = true;
                }
            }
        }
        if (options.reduce !== undefined) {
            queryOpts.reduce = options.reduce;
        }
        if (options.group !== undefined) {
            queryOpts.group = options.group;
        }
        if (options.group_level) {
            queryOpts.group_level = options.group_level;
        }
        if (options.groupLevel !== undefined) {
            queryOpts.group_level = options.groupLevel;
        }
        if (options.key !== undefined) {
            queryOpts.key = JSON.stringify(options.key);
        }
        if (options.keys !== undefined) {
            queryOpts.keys = JSON.stringify(options.keys);
        }
        if (options.full_set !== undefined) {
            queryOpts.full_set = options.full_set;
        }
        if (options.fullSet !== undefined) {
            queryOpts.full_set = options.fullSet;
        }
        if (options.on_error !== undefined) {
            queryOpts.on_error = options.on_error;
        }
        if (options.onError !== undefined) {
            queryOpts.on_error = options.onError;
        }
        if (options.range !== undefined) {
            if (options.range.inclusive_end !== undefined) {
                queryOpts.inclusive_end = JSON.stringify(options.range.inclusive_end);
            }
            queryOpts.startkey = JSON.stringify(options.range.start);
            queryOpts.endkey = JSON.stringify(options.range.end);
            queryOpts.inclusive_end = JSON.stringify(options.range.inclusiveEnd);
        }
        if (options.id_range !== undefined) {
            queryOpts.startkey_docid = options.id_range.start;
            queryOpts.endkey_docid = options.id_range.end;
        }
        if (options.idRange !== undefined) {
            queryOpts.startkey_docid = options.idRange.start;
            queryOpts.endkey_docid = options.idRange.end;
        }
        const queryData = (0, utilities_1.cbQsStringify)(queryOpts, { boolAsString: true });
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        const emitter = new streamablepromises_1.StreamableRowPromise((rows, meta) => {
            return new viewtypes_1.ViewResult({
                rows: rows,
                meta: meta,
            });
        });
        this._conn.viewQuery(designDoc, viewName, queryData, undefined, queryFlags, options.parentSpan, lcbTimeout, (err, flags, data, docId, key) => {
            if (!(flags & binding_1.default.LCBX_RESP_F_NONFINAL)) {
                if (err) {
                    emitter.emit('error', err);
                    emitter.emit('end');
                    return;
                }
                const metaInfo = JSON.parse(data);
                const meta = new viewtypes_1.ViewMetaData({
                    totalRows: metaInfo.total_rows,
                    debug: metaInfo.debug || undefined,
                });
                emitter.emit('meta', meta);
                emitter.emit('end');
                return;
            }
            if (err) {
                emitter.emit('error', err);
                return;
            }
            const row = new viewtypes_1.ViewRow({
                value: JSON.parse(data),
                id: docId ? docId.toString() : undefined,
                key: key ? JSON.parse(key) : undefined,
            });
            emitter.emit('row', row);
        });
        return emitter;
    }
}
exports.ViewExecutor = ViewExecutor;
