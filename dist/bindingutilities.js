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
exports.translateCppError = exports.translateCppContext = exports.LibcouchbaseError = exports.duraLevelToCppDuraMode = exports.cppReplicaModeToOpName = exports.cppStoreOpTypeToOpName = void 0;
const binding_1 = __importDefault(require("./binding"));
const errctxs = __importStar(require("./errorcontexts"));
const errs = __importStar(require("./errors"));
const generaltypes_1 = require("./generaltypes");
/**
 * @internal
 */
function cppStoreOpTypeToOpName(opType) {
    switch (opType) {
        case binding_1.default.LCB_STORE_UPSERT:
            return 'upsert';
        case binding_1.default.LCB_STORE_REPLACE:
            return 'replace';
        case binding_1.default.LCB_STORE_INSERT:
            return 'insert';
        case binding_1.default.LCB_STORE_APPEND:
            return 'append';
        case binding_1.default.LCB_STORE_PREPEND:
            return 'prepend';
    }
    throw new Error('invalid store op type');
}
exports.cppStoreOpTypeToOpName = cppStoreOpTypeToOpName;
/**
 * @internal
 */
function cppReplicaModeToOpName(replicaMode) {
    switch (replicaMode) {
        case binding_1.default.LCB_REPLICA_MODE_ANY:
            return 'getAnyReplica';
        case binding_1.default.LCB_REPLICA_MODE_ALL:
            return 'getAllReplicas';
    }
    throw new Error('invalid store op type');
}
exports.cppReplicaModeToOpName = cppReplicaModeToOpName;
/**
 * @internal
 */
function duraLevelToCppDuraMode(mode) {
    // Unspecified is allowed, and means no sync durability.
    if (mode === null || mode === undefined) {
        return undefined;
    }
    if (mode === generaltypes_1.DurabilityLevel.None) {
        return binding_1.default.LCB_DURABILITYLEVEL_NONE;
    }
    else if (mode === generaltypes_1.DurabilityLevel.Majority) {
        return binding_1.default.LCB_DURABILITYLEVEL_MAJORITY;
    }
    else if (mode === generaltypes_1.DurabilityLevel.MajorityAndPersistOnMaster) {
        return binding_1.default.LCB_DURABILITYLEVEL_MAJORITY_AND_PERSIST_TO_ACTIVE;
    }
    else if (mode === generaltypes_1.DurabilityLevel.PersistToMajority) {
        return binding_1.default.LCB_DURABILITYLEVEL_PERSIST_TO_MAJORITY;
    }
    throw new errs.InvalidDurabilityLevel();
}
exports.duraLevelToCppDuraMode = duraLevelToCppDuraMode;
/**
 * Wraps an error which has occurred within libcouchbase.
 */
class LibcouchbaseError extends Error {
    /**
     * @internal
     */
    constructor(code) {
        super('libcouchbase error ' + code);
        this.code = code;
    }
}
exports.LibcouchbaseError = LibcouchbaseError;
/**
 * @internal
 */
function translateCppContext(err) {
    if (!err) {
        return null;
    }
    let context = null;
    if (err.ctxtype === 'kv') {
        context = new errctxs.KeyValueErrorContext({
            status_code: err.status_code,
            opaque: err.opaque,
            cas: err.cas,
            key: err.key,
            bucket: err.bucket,
            collection: err.collection,
            scope: err.scope,
            context: err.context,
            ref: err.ref,
        });
    }
    else if (err.ctxtype === 'views') {
        context = new errctxs.ViewErrorContext({
            first_error_code: err.first_error_code,
            first_error_message: err.first_error_message,
            design_document: err.design_document,
            view: err.view,
            parameters: err.parameters,
            http_response_code: err.http_response_code,
            http_response_body: err.http_response_body,
        });
    }
    else if (err.ctxtype === 'query') {
        context = new errctxs.QueryErrorContext({
            first_error_code: err.first_error_code,
            first_error_message: err.first_error_message,
            statement: err.statement,
            client_context_id: err.client_context_id,
            parameters: err.parameters,
            http_response_code: err.http_response_code,
            http_response_body: err.http_response_body,
        });
    }
    else if (err.ctxtype === 'search') {
        context = new errctxs.SearchErrorContext({
            error_message: err.error_message,
            index_name: err.index_name,
            query: err.query,
            parameters: err.parameters,
            http_response_code: err.http_response_code,
            http_response_body: err.http_response_body,
        });
    }
    else if (err.ctxtype === 'analytics') {
        context = new errctxs.AnalyticsErrorContext({
            first_error_code: err.first_error_code,
            first_error_message: err.first_error_message,
            statement: err.statement,
            client_context_id: err.client_context_id,
            parameters: err.parameters,
            http_response_code: err.http_response_code,
            http_response_body: err.http_response_body,
        });
    }
    return context;
}
exports.translateCppContext = translateCppContext;
/**
 * @internal
 */
function translateCppError(err) {
    if (!err) {
        return null;
    }
    const contextOrNull = translateCppContext(err);
    const context = contextOrNull ? contextOrNull : undefined;
    const codeErr = new LibcouchbaseError(err.code);
    switch (err.code) {
        case binding_1.default.LCB_SUCCESS:
            return null;
        /* Shared Error Definitions */
        case binding_1.default.LCB_ERR_TIMEOUT:
            return new errs.TimeoutError(codeErr, context);
        case binding_1.default.LCB_ERR_REQUEST_CANCELED:
            return new errs.RequestCanceledError(codeErr, context);
        case binding_1.default.LCB_ERR_INVALID_ARGUMENT:
            return new errs.InvalidArgumentError(codeErr, context);
        case binding_1.default.LCB_ERR_SERVICE_NOT_AVAILABLE:
            return new errs.ServiceNotAvailableError(codeErr, context);
        case binding_1.default.LCB_ERR_INTERNAL_SERVER_FAILURE:
            return new errs.InternalServerFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_AUTHENTICATION_FAILURE:
            return new errs.AuthenticationFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_TEMPORARY_FAILURE:
            return new errs.TemporaryFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_PARSING_FAILURE:
            return new errs.ParsingFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_CAS_MISMATCH:
            return new errs.CasMismatchError(codeErr, context);
        case binding_1.default.LCB_ERR_BUCKET_NOT_FOUND:
            return new errs.BucketNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_COLLECTION_NOT_FOUND:
            return new errs.CollectionNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_ENCODING_FAILURE:
            return new errs.EncodingFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_DECODING_FAILURE:
            return new errs.DecodingFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_UNSUPPORTED_OPERATION:
            return new errs.UnsupportedOperationError(codeErr, context);
        case binding_1.default.LCB_ERR_AMBIGUOUS_TIMEOUT:
            return new errs.AmbiguousTimeoutError(codeErr, context);
        case binding_1.default.LCB_ERR_UNAMBIGUOUS_TIMEOUT:
            return new errs.UnambiguousTimeoutError(codeErr, context);
        case binding_1.default.LCB_ERR_SCOPE_NOT_FOUND:
            return new errs.ScopeNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_INDEX_NOT_FOUND:
            return new errs.IndexNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_INDEX_EXISTS:
            return new errs.IndexExistsError(codeErr, context);
        case binding_1.default.LCB_ERR_RATE_LIMITED:
            return new errs.RateLimitedError(codeErr, context);
        case binding_1.default.LCB_ERR_QUOTA_LIMITED:
            return new errs.QuotaLimitedError(codeErr, context);
        /* KeyValue Error Definitions */
        case binding_1.default.LCB_ERR_DOCUMENT_NOT_FOUND:
            return new errs.DocumentNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_DOCUMENT_UNRETRIEVABLE:
            return new errs.DocumentUnretrievableError(codeErr, context);
        case binding_1.default.LCB_ERR_DOCUMENT_LOCKED:
            return new errs.DocumentLockedError(codeErr, context);
        case binding_1.default.LCB_ERR_VALUE_TOO_LARGE:
            return new errs.ValueTooLargeError(codeErr, context);
        case binding_1.default.LCB_ERR_DOCUMENT_EXISTS:
            return new errs.DocumentExistsError(codeErr, context);
        case binding_1.default.LCB_ERR_VALUE_NOT_JSON:
            return new errs.ValueNotJsonError(codeErr, context);
        case binding_1.default.LCB_ERR_DURABILITY_LEVEL_NOT_AVAILABLE:
            return new errs.DurabilityLevelNotAvailableError(codeErr, context);
        case binding_1.default.LCB_ERR_DURABILITY_IMPOSSIBLE:
            return new errs.DurabilityImpossibleError(codeErr, context);
        case binding_1.default.LCB_ERR_DURABILITY_AMBIGUOUS:
            return new errs.DurabilityAmbiguousError(codeErr, context);
        case binding_1.default.LCB_ERR_DURABLE_WRITE_IN_PROGRESS:
            return new errs.DurableWriteInProgressError(codeErr, context);
        case binding_1.default.LCB_ERR_DURABLE_WRITE_RE_COMMIT_IN_PROGRESS:
            return new errs.DurableWriteReCommitInProgressError(codeErr, context);
        case binding_1.default.LCB_ERR_MUTATION_LOST:
            return new errs.MutationLostError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_PATH_NOT_FOUND:
            return new errs.PathNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_PATH_MISMATCH:
            return new errs.PathMismatchError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_PATH_INVALID:
            return new errs.PathInvalidError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_PATH_TOO_BIG:
            return new errs.PathTooBigError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_PATH_TOO_DEEP:
            return new errs.PathTooDeepError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_VALUE_TOO_DEEP:
            return new errs.ValueTooDeepError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_VALUE_INVALID:
            return new errs.ValueInvalidError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_DOCUMENT_NOT_JSON:
            return new errs.DocumentNotJsonError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_NUMBER_TOO_BIG:
            return new errs.NumberTooBigError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_DELTA_INVALID:
            return new errs.DeltaInvalidError(codeErr, context);
        case binding_1.default.LCB_ERR_SUBDOC_PATH_EXISTS:
            return new errs.PathExistsError(codeErr, context);
        /* Query Error Definitions */
        case binding_1.default.LCB_ERR_PLANNING_FAILURE:
            return new errs.PlanningFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_INDEX_FAILURE:
            return new errs.IndexFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_PREPARED_STATEMENT_FAILURE:
            return new errs.PreparedStatementFailureError(codeErr, context);
        /* Analytics Error Definitions */
        case binding_1.default.LCB_ERR_COMPILATION_FAILED:
            return new errs.CompilationFailureError(codeErr, context);
        case binding_1.default.LCB_ERR_JOB_QUEUE_FULL:
            return new errs.JobQueueFullError(codeErr, context);
        case binding_1.default.LCB_ERR_DATASET_NOT_FOUND:
            return new errs.DatasetNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_DATAVERSE_NOT_FOUND:
            return new errs.DataverseNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_DATASET_EXISTS:
            return new errs.DatasetExistsError(codeErr, context);
        case binding_1.default.LCB_ERR_DATAVERSE_EXISTS:
            return new errs.DataverseExistsError(codeErr, context);
        case binding_1.default.LCB_ERR_ANALYTICS_LINK_NOT_FOUND:
            return new errs.LinkNotFoundError(codeErr, context);
        /* Search Error Definitions */
        // There are none
        /* View Error Definitions */
        case binding_1.default.LCB_ERR_VIEW_NOT_FOUND:
            return new errs.ViewNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_DESIGN_DOCUMENT_NOT_FOUND:
            return new errs.DesignDocumentNotFoundError(codeErr, context);
        /* Management API Error Definitions */
        case binding_1.default.LCB_ERR_COLLECTION_ALREADY_EXISTS:
            return new errs.CollectionExistsError(codeErr, context);
        case binding_1.default.LCB_ERR_SCOPE_EXISTS:
            return new errs.ScopeExistsError(codeErr, context);
        case binding_1.default.LCB_ERR_USER_NOT_FOUND:
            return new errs.UserNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_GROUP_NOT_FOUND:
            return new errs.GroupNotFoundError(codeErr, context);
        case binding_1.default.LCB_ERR_BUCKET_ALREADY_EXISTS:
            return new errs.BucketExistsError(codeErr, context);
    }
    return err;
}
exports.translateCppError = translateCppError;
