"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultLogger = exports.libLogger = exports.LogSeverity = void 0;
const debug_1 = __importDefault(require("debug"));
/**
 * Represents the various levels of severity that a log message
 * might be.
 *
 * @category Logging
 */
var LogSeverity;
(function (LogSeverity) {
    /**
     * Trace level logging, extremely detailed.
     */
    LogSeverity[LogSeverity["Trace"] = 0] = "Trace";
    /**
     * Debug level logging, helpful to debug some forms of issues.
     */
    LogSeverity[LogSeverity["Debug"] = 1] = "Debug";
    /**
     * Info level logging, this is the default log level and includes
     * general information about what is happening.
     */
    LogSeverity[LogSeverity["Info"] = 2] = "Info";
    /**
     * Warn level logging, these represents issues that should be addressed,
     * but which do not prevent the full functioning of the SDK.
     */
    LogSeverity[LogSeverity["Warn"] = 3] = "Warn";
    /**
     * Error level logging, these represent issues that must be addressed,
     * but which do not cause the entire SDK to need to shut down.
     */
    LogSeverity[LogSeverity["Error"] = 4] = "Error";
    /**
     * Fatal level logging, these represent fatal issues that require the
     * SDK to completely stop.
     */
    LogSeverity[LogSeverity["Fatal"] = 5] = "Fatal";
})(LogSeverity = exports.LogSeverity || (exports.LogSeverity = {}));
/**
 * @internal
 */
const libLogger = (0, debug_1.default)('couchnode');
exports.libLogger = libLogger;
const lcbLogger = libLogger.extend('lcb');
const severityLoggers = {
    [LogSeverity.Trace]: lcbLogger.extend('trace'),
    [LogSeverity.Debug]: lcbLogger.extend('debug'),
    [LogSeverity.Info]: lcbLogger.extend('info'),
    [LogSeverity.Warn]: lcbLogger.extend('warn'),
    [LogSeverity.Error]: lcbLogger.extend('error'),
    [LogSeverity.Fatal]: lcbLogger.extend('fatal'),
};
/**
 * @internal
 */
function _logSevToLogger(severity) {
    // We cache our loggers above since some versions of the debug library
    // incur an disproportional cost (or leak memory) for calling extend.
    const logger = severityLoggers[severity];
    if (logger) {
        return logger;
    }
    // We still call extend if there is an unexpected severity, this shouldn't
    // really happen though...
    return lcbLogger.extend('sev' + severity);
}
/**
 * @internal
 */
function logToDebug(data) {
    const logger = _logSevToLogger(data.severity);
    const location = data.srcFile + ':' + data.srcLine;
    logger('(' + data.subsys + ' @ ' + location + ') ' + data.message);
}
/**
 * The default logger which is used by the SDK.  This logger uses the `debug`
 * library to write its log messages in a way that is easily accessible.
 *
 * @category Logging
 */
exports.defaultLogger = logToDebug;
