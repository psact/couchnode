import { Connection } from './connection';
import { SearchQuery } from './searchquery';
import { SearchMetaData, SearchQueryOptions, SearchResult, SearchRow } from './searchtypes';
import { StreamableRowPromise } from './streamablepromises';
/**
 * @internal
 */
export declare class SearchExecutor {
    private _conn;
    /**
     * @internal
     */
    constructor(conn: Connection);
    query(indexName: string, query: SearchQuery, options: SearchQueryOptions): StreamableRowPromise<SearchResult, SearchRow, SearchMetaData>;
}
