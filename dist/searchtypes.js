"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.SearchScanConsistency = exports.HighlightStyle = exports.SearchResult = exports.SearchRow = exports.SearchMetaData = void 0;
/**
 * SearchMetaData represents the meta-data available from a search query.
 * This class is currently incomplete and must be casted to `any` in
 * TypeScript to be used.
 *
 * @category Full Text Search
 */
class SearchMetaData {
}
exports.SearchMetaData = SearchMetaData;
/**
 * SearchRow represents the data available from a row of a search query.
 * This class is currently incomplete and must be casted to `any` in
 * TypeScript to be used.
 *
 * @category Full Text Search
 */
class SearchRow {
}
exports.SearchRow = SearchRow;
/**
 * Contains the results of a search query.
 *
 * @category Full Text Search
 */
class SearchResult {
    /**
     * @internal
     */
    constructor(data) {
        this.rows = data.rows;
        this.meta = data.meta;
    }
}
exports.SearchResult = SearchResult;
/**
 * Specifies the highlight style that should be used for matches in the results.
 *
 * @category Full Text Search
 */
var HighlightStyle;
(function (HighlightStyle) {
    /**
     * Indicates that matches should be highlighted using HTML tags in the result text.
     */
    HighlightStyle["HTML"] = "html";
    /**
     * Indicates that matches should be highlighted using ASCII coding in the result test.
     */
    HighlightStyle["ANSI"] = "ansi";
})(HighlightStyle = exports.HighlightStyle || (exports.HighlightStyle = {}));
/**
 * Represents the various scan consistency options that are available when
 * querying against the query service.
 *
 * @category Full Text Search
 */
var SearchScanConsistency;
(function (SearchScanConsistency) {
    /**
     * Indicates that no specific consistency is required, this is the fastest
     * options, but results may not include the most recent operations which have
     * been performed.
     */
    SearchScanConsistency["NotBounded"] = "not_bounded";
    /**
     * Indicates that the results to the query should include all operations that
     * have occurred up until the query was started.  This incurs a performance
     * penalty of waiting for the index to catch up to the most recent operations,
     * but provides the highest level of consistency.
     */
    SearchScanConsistency["RequestPlus"] = "request_plus";
})(SearchScanConsistency = exports.SearchScanConsistency || (exports.SearchScanConsistency = {}));
