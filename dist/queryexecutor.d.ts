import { Connection } from './connection';
import { QueryMetaData, QueryOptions, QueryResult } from './querytypes';
import { StreamableRowPromise } from './streamablepromises';
/**
 * @internal
 */
export declare class QueryExecutor {
    private _conn;
    /**
     * @internal
     */
    constructor(conn: Connection);
    query<TRow = any>(query: string, options: QueryOptions): StreamableRowPromise<QueryResult<TRow>, TRow, QueryMetaData>;
}
