import { Connection } from './connection';
import { StreamableRowPromise } from './streamablepromises';
import { ViewMetaData, ViewQueryOptions, ViewResult, ViewRow } from './viewtypes';
/**
 * @internal
 */
export declare class ViewExecutor {
    private _conn;
    /**
     * @internal
     */
    constructor(conn: Connection);
    query<TValue = any, TKey = any>(designDoc: string, viewName: string, options: ViewQueryOptions): StreamableRowPromise<ViewResult<TValue, TKey>, ViewRow<TValue, TKey>, ViewMetaData>;
}
