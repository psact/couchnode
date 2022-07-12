import { AnalyticsQueryOptions, AnalyticsResult, AnalyticsMetaData } from './analyticstypes';
import { Connection } from './connection';
import { StreamableRowPromise } from './streamablepromises';
/**
 * @internal
 */
export declare class AnalyticsExecutor {
    private _conn;
    /**
     * @internal
     */
    constructor(conn: Connection);
    query<TRow = any>(query: string, options: AnalyticsQueryOptions): StreamableRowPromise<AnalyticsResult<TRow>, TRow, AnalyticsMetaData>;
}
