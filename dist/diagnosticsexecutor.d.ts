import { Connection } from './connection';
import { DiagnosticsOptions, DiagnosticsResult, PingOptions, PingResult } from './diagnosticstypes';
/**
 * @internal
 */
export declare class DiagnoticsExecutor {
    private _conns;
    /**
     * @internal
     */
    constructor(conns: Connection[]);
    singleDiagnostics(conn: Connection): Promise<DiagnosticsResult>;
    diagnostics(options: DiagnosticsOptions): Promise<DiagnosticsResult>;
}
/**
 * @internal
 */
export declare class PingExecutor {
    private _conn;
    /**
     * @internal
     */
    constructor(conn: Connection);
    ping(options: PingOptions): Promise<PingResult>;
}
