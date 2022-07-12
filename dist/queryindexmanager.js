"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueryIndexManager = exports.QueryIndex = void 0;
const errors_1 = require("./errors");
const httpexecutor_1 = require("./httpexecutor");
const utilities_1 = require("./utilities");
/**
 * Contains a specific index configuration for the query service.
 *
 * @category Management
 */
class QueryIndex {
    /**
     * @internal
     */
    constructor(data) {
        this.name = data.name;
        this.isPrimary = data.isPrimary;
        this.type = data.type;
        this.state = data.state;
        this.keyspace = data.keyspace;
        this.indexKey = data.indexKey;
        this.condition = data.condition;
        this.partition = data.partition;
    }
}
exports.QueryIndex = QueryIndex;
/**
 * QueryIndexManager provides an interface for managing the
 * query indexes on the cluster.
 *
 * @category Management
 */
class QueryIndexManager {
    /**
     * @internal
     */
    constructor(cluster) {
        this._cluster = cluster;
    }
    get _http() {
        return new httpexecutor_1.HttpExecutor(this._cluster._getClusterConn());
    }
    async _createIndex(bucketName, options, callback) {
        let qs = '';
        if (!options.fields) {
            qs += 'CREATE PRIMARY INDEX';
        }
        else {
            qs += 'CREATE INDEX';
        }
        if (options.name) {
            qs += ' `' + options.name + '`';
        }
        qs += ' ON `' + bucketName + '`';
        if (options.fields && options.fields.length > 0) {
            qs += '(';
            for (let i = 0; i < options.fields.length; ++i) {
                if (i > 0) {
                    qs += ', ';
                }
                qs += '`' + options.fields[i] + '`';
            }
            qs += ')';
        }
        const withOpts = {};
        if (options.deferred) {
            withOpts.defer_build = true;
        }
        if (options.numReplicas) {
            withOpts.num_replica = options.numReplicas;
        }
        if (Object.keys(withOpts).length > 0) {
            qs += ' WITH ' + JSON.stringify(withOpts);
        }
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            try {
                await this._cluster.query(qs, {
                    parentSpan: options.parentSpan,
                    timeout: options.timeout,
                });
            }
            catch (err) {
                if (options.ignoreIfExists && err instanceof errors_1.IndexExistsError) {
                    // swallow the error if the user wants us to
                }
                else {
                    throw err;
                }
            }
        }, callback);
    }
    /**
     * Creates a new query index.
     *
     * @param bucketName The name of the bucket this index is for.
     * @param indexName The name of the new index.
     * @param fields The fields which this index should cover.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async createIndex(bucketName, indexName, fields, options, callback) {
        if (options instanceof Function) {
            callback = arguments[3];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        return this._createIndex(bucketName, {
            name: indexName,
            fields: fields,
            ignoreIfExists: options.ignoreIfExists,
            numReplicas: options.numReplicas,
            deferred: options.deferred,
            parentSpan: options.parentSpan,
            timeout: options.timeout,
        }, callback);
    }
    /**
     * Creates a new primary query index.
     *
     * @param bucketName The name of the bucket this index is for.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async createPrimaryIndex(bucketName, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        return this._createIndex(bucketName, {
            name: options.name,
            ignoreIfExists: options.ignoreIfExists,
            deferred: options.deferred,
            parentSpan: options.parentSpan,
            timeout: options.timeout,
        }, callback);
    }
    async _dropIndex(bucketName, options, callback) {
        const timeout = options.timeout;
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            let qs = '';
            if (!options.name) {
                qs += 'DROP PRIMARY INDEX `' + bucketName + '`';
            }
            else {
                qs += 'DROP INDEX `' + bucketName + '`.`' + options.name + '`';
            }
            try {
                await this._cluster.query(qs, {
                    parentSpan: options.parentSpan,
                    timeout: timeout,
                });
            }
            catch (err) {
                if (options.ignoreIfNotExists && err instanceof errors_1.IndexNotFoundError) {
                    // swallow the error if the user wants us to
                }
                else {
                    throw err;
                }
            }
        }, callback);
    }
    /**
     * Drops an existing query index.
     *
     * @param bucketName The name of the bucket containing the index to drop.
     * @param indexName The name of the index to drop.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async dropIndex(bucketName, indexName, options, callback) {
        if (options instanceof Function) {
            callback = arguments[2];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        return this._dropIndex(bucketName, {
            name: indexName,
            ignoreIfNotExists: options.ignoreIfNotExists,
            parentSpan: options.parentSpan,
            timeout: options.timeout,
        }, callback);
    }
    /**
     * Drops an existing primary index.
     *
     * @param bucketName The name of the bucket containing the primary index to drop.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async dropPrimaryIndex(bucketName, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        return this._dropIndex(bucketName, {
            name: options.name,
            ignoreIfNotExists: options.ignoreIfNotExists,
            parentSpan: options.parentSpan,
            timeout: options.timeout,
        }, callback);
    }
    /**
     * Returns a list of indexes for a specific bucket.
     *
     * @param bucketName The name of the bucket to fetch indexes for.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async getAllIndexes(bucketName, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const qs = `SELECT idx.* FROM system:indexes AS idx
              WHERE (
                (\`bucket_id\` IS MISSING AND \`keyspace_id\`="${bucketName}")
                OR \`bucket_id\`="${bucketName}"
              ) AND \`using\`="gsi" ORDER BY is_primary DESC, name ASC`;
        const parentSpan = options.parentSpan;
        const timeout = options.timeout;
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            const res = await this._cluster.query(qs, {
                parentSpan: parentSpan,
                timeout: timeout,
            });
            const indexes = res.rows.map((row) => new QueryIndex({
                name: row.name,
                isPrimary: row.is_primary,
                type: row.using,
                state: row.state,
                keyspace: row.keyspace_id,
                indexKey: row.index_key,
                condition: row.condition,
                partition: row.partition,
            }));
            return indexes;
        }, callback);
    }
    /**
     * Starts building any indexes which were previously created with deferred=true.
     *
     * @param bucketName The name of the bucket to perform the build on.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async buildDeferredIndexes(bucketName, options, callback) {
        if (options instanceof Function) {
            callback = arguments[1];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        const parentSpan = options.parentSpan;
        const timeout = options.timeout;
        const timer = new utilities_1.CompoundTimeout(timeout);
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            const indexes = await this.getAllIndexes(bucketName, {
                parentSpan: parentSpan,
                timeout: timer.left(),
            });
            // Filter out the index names that need to be built
            const deferredList = indexes
                .filter((index) => index.state === 'deferred' || index.state === 'pending')
                .map((index) => index.name);
            // If there are no deferred indexes, we have nothing to do.
            if (deferredList.length === 0) {
                return [];
            }
            let qs = '';
            qs += 'BUILD INDEX ON `' + bucketName + '` ';
            qs += '(';
            for (let j = 0; j < deferredList.length; ++j) {
                if (j > 0) {
                    qs += ', ';
                }
                qs += '`' + deferredList[j] + '`';
            }
            qs += ')';
            // Run our deferred build query
            await this._cluster.query(qs, {
                timeout: timer.left(),
            });
            // Return the list of indices that we built
            return deferredList;
        }, callback);
    }
    /**
     * Waits for a number of indexes to finish creation and be ready to use.
     *
     * @param bucketName The name of the bucket to watch for indexes on.
     * @param indexNames The names of the indexes to watch.
     * @param timeout The maximum time to wait for the index, expressed in milliseconds.
     * @param options Optional parameters for this operation.
     * @param callback A node-style callback to be invoked after execution.
     */
    async watchIndexes(bucketName, indexNames, timeout, options, callback) {
        if (options instanceof Function) {
            callback = arguments[3];
            options = undefined;
        }
        if (!options) {
            options = {};
        }
        if (options.watchPrimary) {
            indexNames = [...indexNames, '#primary'];
        }
        const parentSpan = options.parentSpan;
        const timer = new utilities_1.CompoundTimeout(timeout);
        return utilities_1.PromiseHelper.wrapAsync(async () => {
            let curInterval = 50;
            for (;;) {
                // Get all the indexes that are currently registered
                const foundIdxs = await this.getAllIndexes(bucketName, {
                    parentSpan: parentSpan,
                    timeout: timer.left(),
                });
                const onlineIdxs = foundIdxs.filter((idx) => idx.state === 'online');
                const onlineIdxNames = onlineIdxs.map((idx) => idx.name);
                // Check if all the indexes we want are online
                let allOnline = true;
                indexNames.forEach((indexName) => {
                    allOnline = allOnline && onlineIdxNames.indexOf(indexName) !== -1;
                });
                // If all the indexes are online, we've succeeded
                if (allOnline) {
                    break;
                }
                // Add 500 to our interval to a max of 1000
                curInterval = Math.min(1000, curInterval + 500);
                // Make sure we don't go past our user-specified duration
                const userTimeLeft = timer.left();
                if (userTimeLeft !== undefined) {
                    curInterval = Math.min(curInterval, userTimeLeft);
                }
                if (curInterval <= 0) {
                    throw new errors_1.CouchbaseError('Failed to find all indexes online within the alloted time.');
                }
                // Wait until curInterval expires
                await new Promise((resolve) => setTimeout(() => resolve(true), curInterval));
            }
        }, callback);
    }
}
exports.QueryIndexManager = QueryIndexManager;
