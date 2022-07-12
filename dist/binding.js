"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.CppAnalyticsQueryRespFlags = exports.CppSearchQueryRespFlags = exports.CppQueryRespFlags = exports.CppViewQueryRespFlags = exports.CppAnalyticsQueryFlags = exports.CppSearchQueryFlags = exports.CppQueryFlags = exports.CppViewQueryFlags = exports.CppConnType = exports.CppSdSpecFlag = exports.CppSdOpFlag = exports.CppSdCmdType = exports.CppLogSeverity = exports.CppErrType = exports.CppServiceType = exports.CppStoreOpType = exports.CppHttpMethod = exports.CppHttpType = exports.CppDurabilityMode = exports.CppReplicaMode = void 0;
/* eslint jsdoc/require-jsdoc: off */
const bindings_1 = __importDefault(require("bindings"));
var CppReplicaMode;
(function (CppReplicaMode) {
})(CppReplicaMode = exports.CppReplicaMode || (exports.CppReplicaMode = {}));
var CppDurabilityMode;
(function (CppDurabilityMode) {
})(CppDurabilityMode = exports.CppDurabilityMode || (exports.CppDurabilityMode = {}));
var CppHttpType;
(function (CppHttpType) {
})(CppHttpType = exports.CppHttpType || (exports.CppHttpType = {}));
var CppHttpMethod;
(function (CppHttpMethod) {
})(CppHttpMethod = exports.CppHttpMethod || (exports.CppHttpMethod = {}));
var CppStoreOpType;
(function (CppStoreOpType) {
})(CppStoreOpType = exports.CppStoreOpType || (exports.CppStoreOpType = {}));
var CppServiceType;
(function (CppServiceType) {
})(CppServiceType = exports.CppServiceType || (exports.CppServiceType = {}));
var CppErrType;
(function (CppErrType) {
})(CppErrType = exports.CppErrType || (exports.CppErrType = {}));
var CppLogSeverity;
(function (CppLogSeverity) {
})(CppLogSeverity = exports.CppLogSeverity || (exports.CppLogSeverity = {}));
var CppSdCmdType;
(function (CppSdCmdType) {
})(CppSdCmdType = exports.CppSdCmdType || (exports.CppSdCmdType = {}));
var CppSdOpFlag;
(function (CppSdOpFlag) {
})(CppSdOpFlag = exports.CppSdOpFlag || (exports.CppSdOpFlag = {}));
var CppSdSpecFlag;
(function (CppSdSpecFlag) {
})(CppSdSpecFlag = exports.CppSdSpecFlag || (exports.CppSdSpecFlag = {}));
var CppConnType;
(function (CppConnType) {
})(CppConnType = exports.CppConnType || (exports.CppConnType = {}));
var CppViewQueryFlags;
(function (CppViewQueryFlags) {
})(CppViewQueryFlags = exports.CppViewQueryFlags || (exports.CppViewQueryFlags = {}));
var CppQueryFlags;
(function (CppQueryFlags) {
})(CppQueryFlags = exports.CppQueryFlags || (exports.CppQueryFlags = {}));
var CppSearchQueryFlags;
(function (CppSearchQueryFlags) {
})(CppSearchQueryFlags = exports.CppSearchQueryFlags || (exports.CppSearchQueryFlags = {}));
var CppAnalyticsQueryFlags;
(function (CppAnalyticsQueryFlags) {
})(CppAnalyticsQueryFlags = exports.CppAnalyticsQueryFlags || (exports.CppAnalyticsQueryFlags = {}));
var CppViewQueryRespFlags;
(function (CppViewQueryRespFlags) {
})(CppViewQueryRespFlags = exports.CppViewQueryRespFlags || (exports.CppViewQueryRespFlags = {}));
var CppQueryRespFlags;
(function (CppQueryRespFlags) {
})(CppQueryRespFlags = exports.CppQueryRespFlags || (exports.CppQueryRespFlags = {}));
var CppSearchQueryRespFlags;
(function (CppSearchQueryRespFlags) {
})(CppSearchQueryRespFlags = exports.CppSearchQueryRespFlags || (exports.CppSearchQueryRespFlags = {}));
var CppAnalyticsQueryRespFlags;
(function (CppAnalyticsQueryRespFlags) {
})(CppAnalyticsQueryRespFlags = exports.CppAnalyticsQueryRespFlags || (exports.CppAnalyticsQueryRespFlags = {}));
// Load it with require
const binding = (0, bindings_1.default)('couchbase_impl');
exports.default = binding;
