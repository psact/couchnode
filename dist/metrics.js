"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.LoggingMeter = exports.NoopMeter = void 0;
/**
 * Implements a no-op meter which performs no metrics instrumentation.  Note that
 * to reduce the performance impact of using this neter, this class is not
 * actually used by the SDK, and simply acts as a placeholder which triggers a
 * native implementation to be used instead.
 */
class NoopMeter {
    /**
     * @internal
     */
    valueRecorder(name, tags) {
        name;
        tags;
        throw new Error('invalid usage');
    }
}
exports.NoopMeter = NoopMeter;
/**
 * Implements a default meter which logs metrics on a regular basis.  Note that
 * to reduce the performance impact of using this neter, this class is not
 * actually used by the SDK, and simply acts as a placeholder which triggers a
 * native implementation to be used instead.
 */
class LoggingMeter {
    constructor(options) {
        this._options = options;
    }
    /**
     * @internal
     */
    valueRecorder(name, tags) {
        name;
        tags;
        throw new Error('invalid usage');
    }
}
exports.LoggingMeter = LoggingMeter;
