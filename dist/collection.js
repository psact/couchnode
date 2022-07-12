"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Collection = void 0;
const binarycollection_1 = require("./binarycollection");
const binding_1 = __importDefault(require("./binding"));
const bindingutilities_1 = require("./bindingutilities");
const crudoptypes_1 = require("./crudoptypes");
const datastructures_1 = require("./datastructures");
const errors_1 = require("./errors");
const generaltypes_1 = require("./generaltypes");
const sdspecs_1 = require("./sdspecs");
const sdutils_1 = require("./sdutils");
const streamablepromises_1 = require("./streamablepromises");
const utilities_1 = require("./utilities");
/**
 * Exposes the operations which are available to be performed against a collection.
 * Namely the ability to perform KV operations.
 *
 * @category Core
 */
class Collection {
    /**
    @internal
    */
    constructor(scope, collectionName) {
        this._scope = scope;
        this._name = collectionName;
        this._conn = scope.conn;
    }
    /**
     * @internal
     */
    static get DEFAULT_NAME() {
        return '_default';
    }
    /**
    @internal
    */
    get conn() {
        return this._conn;
    }
    /**
    @internal
    */
    get scope() {
        return this._scope;
    }
    /**
    @internal
    */
    get transcoder() {
        return this._scope.transcoder;
    }
    /**
     * The name of the collection this Collection object references.
     */
    get name() {
        return this._name;
    }
    get _lcbScopeColl() {
        // BUG(JSCBC-853): There is a bug in libcouchbase which causes non-blank scope
        // and collection names to fail the collections feature-check when they should not.
        const scopeName = this.scope.name || '_default';
        const collectionName = this.name || '_default';
        if (scopeName === '_default' && collectionName === '_default') {
            return ['', ''];
        }
        return [scopeName, collectionName];
    }
    /**
     * Retrieves the value of a document from the collection.
     *
     * @param key The document key to retrieve.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    get(key, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        if (options.project || options.withExpiry) {
            return this._projectedGet(key, options, callback);
        }
        const transcoder = options.transcoder || this.transcoder;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.get(...this._lcbScopeColl, key, transcoder, undefined, undefined, parentSpan, lcbTimeout, (err, cas, value) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(null, new crudoptypes_1.GetResult({
                    content: value,
                    cas: cas,
                }));
            });
        }, callback);
    }
    _projectedGet(key, options, callback) {
        let expiryStart = -1;
        let projStart = -1;
        let paths = [];
        let spec = [];
        let needReproject = false;
        if (options.withExpiry) {
            expiryStart = spec.length;
            spec.push(sdspecs_1.LookupInSpec.get(sdspecs_1.LookupInMacro.Expiry));
        }
        projStart = spec.length;
        if (!options.project) {
            paths = [''];
            spec.push(sdspecs_1.LookupInSpec.get(''));
        }
        else {
            let projects = options.project;
            if (!Array.isArray(projects)) {
                projects = [projects];
            }
            for (let i = 0; i < projects.length; ++i) {
                paths.push(projects[i]);
                spec.push(sdspecs_1.LookupInSpec.get(projects[i]));
            }
        }
        // The following code relies on the projections being
        // the last segment of the specs array, this way we handle
        // an overburdened operation in a single area.
        if (spec.length > 16) {
            spec = spec.splice(0, projStart);
            spec.push(sdspecs_1.LookupInSpec.get(''));
            needReproject = true;
        }
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            const res = await this.lookupIn(key, spec, {
                ...options,
                parentSpan: options.parentSpan,
            });
            let content = null;
            let expiry = undefined;
            if (expiryStart >= 0) {
                const expiryRes = res.content[expiryStart];
                expiry = expiryRes.value;
            }
            if (projStart >= 0) {
                if (!needReproject) {
                    for (let i = 0; i < paths.length; ++i) {
                        const projPath = paths[i];
                        const projRes = res.content[projStart + i];
                        if (!projRes.error) {
                            content = sdutils_1.SdUtils.insertByPath(content, projPath, projRes.value);
                        }
                    }
                }
                else {
                    content = {};
                    const reprojRes = res.content[projStart];
                    for (let j = 0; j < paths.length; ++j) {
                        const reprojPath = paths[j];
                        const value = sdutils_1.SdUtils.getByPath(reprojRes.value, reprojPath);
                        content = sdutils_1.SdUtils.insertByPath(content, reprojPath, value);
                    }
                }
            }
            return new crudoptypes_1.GetResult({
                content: content,
                cas: res.cas,
                expiryTime: expiry,
            });
        }, callback);
    }
    /**
     * Checks whether a specific document exists or not.
     *
     * @param key The document key to check for existence.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    exists(key, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.exists(...this._lcbScopeColl, key, parentSpan, lcbTimeout, (err, cas, exists) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(null, new crudoptypes_1.ExistsResult({
                    cas,
                    exists,
                }));
            });
        }, callback);
    }
    /**
     * Retrieves the value of the document from any of the available replicas.  This
     * will return as soon as the first response is received from any replica node.
     *
     * @param key The document key to retrieve.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    getAnyReplica(key, options, callback) {
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            const replicas = await this._getReplica(binding_1.default.LCB_REPLICA_MODE_ANY, key, options);
            return replicas[0];
        }, callback);
    }
    /**
     * Retrieves the value of the document from all available replicas.  Note that
     * as replication is asynchronous, each node may return a different value.
     *
     * @param key The document key to retrieve.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    getAllReplicas(key, options, callback) {
        return this._getReplica(binding_1.default.LCB_REPLICA_MODE_ALL, key, options, callback);
    }
    /**
     * Inserts a new document to the collection, failing if the document already exists.
     *
     * @param key The document key to insert.
     * @param value The value of the document to insert.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    insert(key, value, options, callback) {
        return this._store(binding_1.default.LCB_STORE_INSERT, key, value, options, callback);
    }
    /**
     * Upserts a document to the collection.  This operation succeeds whether or not the
     * document already exists.
     *
     * @param key The document key to upsert.
     * @param value The new value for the document.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    upsert(key, value, options, callback) {
        return this._store(binding_1.default.LCB_STORE_UPSERT, key, value, options, callback);
    }
    /**
     * Replaces the value of an existing document.  Failing if the document does not exist.
     *
     * @param key The document key to replace.
     * @param value The new value for the document.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    replace(key, value, options, callback) {
        return this._store(binding_1.default.LCB_STORE_REPLACE, key, value, options, callback);
    }
    /**
     * Remove an existing document from the collection.
     *
     * @param key The document key to remove.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    remove(key, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const cas = options.cas || null;
        const cppDuraMode = (0, bindingutilities_1.duraLevelToCppDuraMode)(options.durabilityLevel);
        const persistTo = options.durabilityPersistTo;
        const replicateTo = options.durabilityReplicateTo;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.remove(...this._lcbScopeColl, key, cas, cppDuraMode, persistTo, replicateTo, parentSpan, lcbTimeout, (err, cas) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(err, new crudoptypes_1.MutationResult({
                    cas: cas,
                }));
            });
        }, callback);
    }
    /**
     * Retrieves the value of the document and simultanously updates the expiry time
     * for the same document.
     *
     * @param key The document to fetch and touch.
     * @param expiry The new expiry to apply to the document, specified in seconds.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    getAndTouch(key, expiry, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const transcoder = options.transcoder || this.transcoder;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.get(...this._lcbScopeColl, key, transcoder, expiry, undefined, parentSpan, lcbTimeout, (err, cas, value) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(err, new crudoptypes_1.GetResult({
                    content: value,
                    cas: cas,
                }));
            });
        }, callback);
    }
    /**
     * Updates the expiry on an existing document.
     *
     * @param key The document key to touch.
     * @param expiry The new expiry to set for the document, specified in seconds.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    touch(key, expiry, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const cppDuraMode = (0, bindingutilities_1.duraLevelToCppDuraMode)(options.durabilityLevel);
        const persistTo = options.durabilityPersistTo;
        const replicateTo = options.durabilityReplicateTo;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.touch(...this._lcbScopeColl, key, expiry, cppDuraMode, persistTo, replicateTo, parentSpan, lcbTimeout, (err, cas) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(err, new crudoptypes_1.MutationResult({
                    cas: cas,
                }));
            });
        }, callback);
    }
    /**
     * Locks a document and retrieves the value of that document at the time it is locked.
     *
     * @param key The document key to retrieve and lock.
     * @param lockTime The amount of time to lock the document for, specified in seconds.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    getAndLock(key, lockTime, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const transcoder = options.transcoder || this.transcoder;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.get(...this._lcbScopeColl, key, transcoder, undefined, lockTime, parentSpan, lcbTimeout, (err, cas, value) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(err, new crudoptypes_1.GetResult({
                    cas: cas,
                    content: value,
                }));
            });
        }, callback);
    }
    /**
     * Unlocks a previously locked document.
     *
     * @param key The document key to unlock.
     * @param cas The CAS of the document, used to validate lock ownership.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    unlock(key, cas, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.unlock(...this._lcbScopeColl, key, cas, parentSpan, lcbTimeout, (err) => {
                if (err) {
                    return wrapCallback(err);
                }
                wrapCallback(null);
            });
        }, callback);
    }
    /**
     * Performs a lookup-in operation against a document, fetching individual fields or
     * information about specific fields inside the document value.
     *
     * @param key The document key to look in.
     * @param specs A list of specs describing the data to fetch from the document.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    lookupIn(key, specs, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const flags = 0;
        let cmdData = [];
        for (let i = 0; i < specs.length; ++i) {
            cmdData = [...cmdData, specs[i]._op, specs[i]._flags, specs[i]._path];
        }
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.lookupIn(...this._lcbScopeColl, key, flags, cmdData, parentSpan, lcbTimeout, (err, res) => {
                if (res && res.content) {
                    for (let i = 0; i < res.content.length; ++i) {
                        const itemRes = res.content[i];
                        itemRes.error = (0, bindingutilities_1.translateCppError)(itemRes.error);
                        if (itemRes.value && itemRes.value.length > 0) {
                            itemRes.value = JSON.parse(itemRes.value);
                        }
                        else {
                            itemRes.value = null;
                        }
                        // TODO(brett19): BUG JSCBC-632 - This conversion logic should not be required,
                        // it is expected that when JSCBC-632 is fixed, this code is removed as well.
                        if (specs[i]._op === binding_1.default.LCBX_SDCMD_EXISTS) {
                            if (!itemRes.error) {
                                itemRes.value = true;
                            }
                            else if (itemRes.error instanceof errors_1.PathNotFoundError) {
                                itemRes.error = null;
                                itemRes.value = false;
                            }
                        }
                    }
                    wrapCallback(err, new crudoptypes_1.LookupInResult({
                        content: res.content,
                        cas: res.cas,
                    }));
                    return;
                }
                wrapCallback(err, null);
            });
        }, callback);
    }
    /**
     * Performs a mutate-in operation against a document.  Allowing atomic modification of
     * specific fields within a document.  Also enables access to document extended-attributes.
     *
     * @param key The document key to mutate.
     * @param specs A list of specs describing the operations to perform on the document.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    mutateIn(key, specs, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        let flags = 0;
        if (options.storeSemantics === generaltypes_1.StoreSemantics.Upsert) {
            flags |= binding_1.default.LCBX_SDFLAG_UPSERT_DOC;
        }
        else if (options.storeSemantics === generaltypes_1.StoreSemantics.Replace) {
            // This is the default behaviour
        }
        else if (options.storeSemantics === generaltypes_1.StoreSemantics.Insert) {
            flags |= binding_1.default.LCBX_SDFLAG_INSERT_DOC;
        }
        else if (options.upsertDocument) {
            flags |= binding_1.default.LCBX_SDFLAG_UPSERT_DOC;
        }
        let cmdData = [];
        for (let i = 0; i < specs.length; ++i) {
            cmdData = [
                ...cmdData,
                specs[i]._op,
                specs[i]._flags,
                specs[i]._path,
                specs[i]._data,
            ];
        }
        const expiry = options.preserveExpiry ? -1 : options.expiry;
        const cas = options.cas;
        const cppDuraMode = (0, bindingutilities_1.duraLevelToCppDuraMode)(options.durabilityLevel);
        const persistTo = options.durabilityPersistTo;
        const replicateTo = options.durabilityReplicateTo;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.mutateIn(...this._lcbScopeColl, key, expiry, cas, flags, cmdData, cppDuraMode, persistTo, replicateTo, parentSpan, lcbTimeout, (err, res) => {
                if (res && res.content) {
                    for (let i = 0; i < res.content.length; ++i) {
                        const itemRes = res.content[i];
                        if (itemRes.value && itemRes.value.length > 0) {
                            res.content[i] = {
                                value: JSON.parse(itemRes.value),
                            };
                        }
                        else {
                            res.content[i] = null;
                        }
                    }
                    wrapCallback(err, new crudoptypes_1.MutateInResult({
                        content: res.content,
                        cas: res.cas,
                    }));
                    return;
                }
                wrapCallback(err, null);
            });
        }, callback);
    }
    /**
     * Returns a CouchbaseList permitting simple list storage in a document.
     *
     * @param key The document key the data-structure resides in.
     */
    list(key) {
        return new datastructures_1.CouchbaseList(this, key);
    }
    /**
     * Returns a CouchbaseQueue permitting simple queue storage in a document.
     *
     * @param key The document key the data-structure resides in.
     */
    queue(key) {
        return new datastructures_1.CouchbaseQueue(this, key);
    }
    /**
     * Returns a CouchbaseMap permitting simple map storage in a document.
     *
     * @param key The document key the data-structure resides in.
     */
    map(key) {
        return new datastructures_1.CouchbaseMap(this, key);
    }
    /**
     * Returns a CouchbaseSet permitting simple set storage in a document.
     *
     * @param key The document key the data-structure resides in.
     */
    set(key) {
        return new datastructures_1.CouchbaseSet(this, key);
    }
    /**
     * Returns a BinaryCollection object reference, allowing access to various
     * binary operations possible against a collection.
     */
    binary() {
        return new binarycollection_1.BinaryCollection(this);
    }
    _getReplica(mode, key, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const emitter = new streamablepromises_1.StreamableReplicasPromise((replicas) => replicas);
        const transcoder = options.transcoder || this.transcoder;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        this._conn.getReplica(...this._lcbScopeColl, key, transcoder, mode, options.parentSpan, lcbTimeout, (err, rflags, cas, value) => {
            if (!err) {
                emitter.emit('replica', new crudoptypes_1.GetReplicaResult({
                    content: value,
                    cas: cas,
                    isReplica: true,
                }));
            }
            if (!(rflags & binding_1.default.LCBX_RESP_F_NONFINAL)) {
                emitter.emit('end');
            }
        });
        return utilities_1.PromiseHelper.wrapAsync(() => emitter, callback);
    }
    _store(opType, key, value, options, callback) {
        if (options instanceof Function) {
            callback = arguments[3];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const expiry = options.preserveExpiry ? -1 : options.expiry;
        const cas = options.cas;
        const cppDuraMode = (0, bindingutilities_1.duraLevelToCppDuraMode)(options.durabilityLevel);
        const persistTo = options.durabilityPersistTo;
        const replicateTo = options.durabilityReplicateTo;
        const transcoder = options.transcoder || this.transcoder;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.store(...this._lcbScopeColl, key, transcoder, value, expiry, cas, cppDuraMode, persistTo, replicateTo, parentSpan, lcbTimeout, opType, (err, cas, token) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(err, new crudoptypes_1.MutationResult({
                    cas: cas,
                    token: token,
                }));
            });
        }, callback);
    }
    _counter(key, delta, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const initial = options.initial;
        const expiry = options.expiry;
        const cppDuraMode = (0, bindingutilities_1.duraLevelToCppDuraMode)(options.durabilityLevel);
        const persistTo = options.durabilityPersistTo;
        const replicateTo = options.durabilityReplicateTo;
        const parentSpan = options.parentSpan;
        const lcbTimeout = options.timeout ? options.timeout * 1000 : undefined;
        return utilities_1.PromiseHelper.wrap((wrapCallback) => {
            this._conn.counter(...this._lcbScopeColl, key, delta, initial, expiry, cppDuraMode, persistTo, replicateTo, parentSpan, lcbTimeout, (err, cas, token, value) => {
                if (err) {
                    return wrapCallback(err, null);
                }
                wrapCallback(err, new crudoptypes_1.CounterResult({
                    cas: cas,
                    token: token,
                    value: value,
                }));
            });
        }, callback);
    }
    /**
     * @internal
     */
    _binaryIncrement(key, delta, options, callback) {
        return this._counter(key, +delta, options, callback);
    }
    /**
     * @internal
     */
    _binaryDecrement(key, delta, options, callback) {
        return this._counter(key, -delta, options, callback);
    }
    /**
     * @internal
     */
    _binaryAppend(key, value, options, callback) {
        const bufValue = Buffer.from(value);
        return this._store(binding_1.default.LCB_STORE_APPEND, key, bufValue, options, callback);
    }
    /**
     * @internal
     */
    _binaryPrepend(key, value, options, callback) {
        const bufValue = Buffer.from(value);
        return this._store(binding_1.default.LCB_STORE_PREPEND, key, bufValue, options, callback);
    }
}
exports.Collection = Collection;
