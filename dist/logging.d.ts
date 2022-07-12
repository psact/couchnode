import debug from 'debug';
/**
 * Represents the various levels of severity that a log message
 * might be.
 *
 * @category Logging
 */
export declare enum LogSeverity {
    /**
     * Trace level logging, extremely detailed.
     */
    Trace = 0,
    /**
     * Debug level logging, helpful to debug some forms of issues.
     */
    Debug = 1,
    /**
     * Info level logging, this is the default log level and includes
     * general information about what is happening.
     */
    Info = 2,
    /**
     * Warn level logging, these represents issues that should be addressed,
     * but which do not prevent the full functioning of the SDK.
     */
    Warn = 3,
    /**
     * Error level logging, these represent issues that must be addressed,
     * but which do not cause the entire SDK to need to shut down.
     */
    Error = 4,
    /**
     * Fatal level logging, these represent fatal issues that require the
     * SDK to completely stop.
     */
    Fatal = 5
}
/**
 * Represents various pieces of information associated with a log message.
 *
 * @category Logging
 */
export interface LogData {
    /**
     * Indicates the severity level for this log message.
     */
    severity: LogSeverity;
    /**
     * The source file where the log message was generated, if available.
     */
    srcFile: string;
    /**
     * The source line where the log message was generated, if available.
     */
    srcLine: number;
    /**
     * The sub-system which generated the log message.
     */
    subsys: string;
    /**
     * The log message itself.
     */
    message: string;
}
/**
 * The log function interface used for handling log messages being generated
 * by the library.
 *
 * @category Logging
 */
export interface LogFunc {
    (data: LogData): void;
}
/**
 * @internal
 */
declare const libLogger: debug.Debugger;
export { libLogger };
/**
 * The default logger which is used by the SDK.  This logger uses the `debug`
 * library to write its log messages in a way that is easily accessible.
 *
 * @category Logging
 */
export declare const defaultLogger: LogFunc;
