/// <reference types="node" />
import { Connection } from './connection';
import { HttpErrorContext } from './errorcontexts';
import { RequestSpan } from './tracing';
import * as events from 'events';
/**
 * @internal
 */
export declare enum HttpServiceType {
    Management = "MGMT",
    Views = "VIEW",
    Query = "QUERY",
    Search = "SEARCH",
    Analytics = "ANALYTICS",
    Eventing = "EVENTING"
}
/**
 * @internal
 */
export declare enum HttpMethod {
    Get = "GET",
    Post = "POST",
    Put = "PUT",
    Delete = "DELETE"
}
/**
 * @internal
 */
export interface HttpRequestOptions {
    type: HttpServiceType;
    method: HttpMethod;
    path: string;
    contentType?: string;
    body?: string | Buffer;
    parentSpan?: RequestSpan;
    timeout?: number;
}
/**
 * @internal
 */
export interface HttpResponse {
    requestOptions: HttpRequestOptions;
    statusCode: number;
    headers: {
        [key: string]: string;
    };
    body: Buffer;
}
/**
 * @internal
 */
export declare class HttpExecutor {
    private _conn;
    /**
     * @internal
     */
    constructor(conn: Connection);
    streamRequest(options: HttpRequestOptions): events.EventEmitter;
    request(options: HttpRequestOptions): Promise<HttpResponse>;
    static errorContextFromResponse(resp: HttpResponse): HttpErrorContext;
}
