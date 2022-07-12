"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.NoopTracer = exports.ThresholdLoggingTracer = void 0;
/**
 * This implements a basic default tracer which keeps track of operations
 * which falls outside a specified threshold.  Note that to reduce the
 * performance impact of using this tracer, this class is not actually
 * used by the SDK, and simply acts as a placeholder which triggers a
 * native implementation to be used instead.
 */
class ThresholdLoggingTracer {
    constructor(options) {
        this._options = options;
    }
    /**
     * @internal
     */
    requestSpan(name, parent) {
        name;
        parent;
        throw new Error('invalid usage');
    }
}
exports.ThresholdLoggingTracer = ThresholdLoggingTracer;
/**
 * Implements a no-op tracer which performs no work.  Note that to reduce the
 * performance impact of using this tracer, this class is not actually
 * used by the SDK, and simply acts as a placeholder which triggers a
 * native implementation to be used instead.
 */
class NoopTracer {
    /**
     * @internal
     */
    requestSpan(name, parent) {
        name;
        parent;
        throw new Error('invalid usage');
    }
}
exports.NoopTracer = NoopTracer;
