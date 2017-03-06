/* -*- Mode: C; tab-width: 4; c-basic-offset: 4; indent-tabs-mode: nil -*- */
/*
 *     Copyright 2014 Couchbase, Inc.
 *
 *   Licensed under the Apache License, Version 2.0 (the "License");
 *   you may not use this file except in compliance with the License.
 *   You may obtain a copy of the License at
 *
 *       http://www.apache.org/licenses/LICENSE-2.0
 *
 *   Unless required by applicable law or agreed to in writing, software
 *   distributed under the License is distributed on an "AS IS" BASIS,
 *   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *   See the License for the specific language governing permissions and
 *   limitations under the License.
 */

#ifndef LCB_MCSERVER_H
#define LCB_MCSERVER_H
#include <libcouchbase/couchbase.h>
#include <lcbio/lcbio.h>
#include <lcbio/timer-ng.h>
#include <mc/mcreq.h>
#include <netbuf/netbuf.h>

#ifdef __cplusplus
namespace lcb {

class RetryQueue;
struct RetryOp;

/**
 * The structure representing each couchbase server
 */
class Server : public mc_PIPELINE {
public:
    /**
     * Allocate and initialize a new server object. The object will not be
     * connected
     * @param instance the instance to which the server belongs
     * @param ix the server index in the configuration
     */
    Server(lcb_t, int);

    /**
     * Close the server. The resources of the server may still continue to persist
     * internally for a bit until all callbacks have been delivered and all buffers
     * flushed and/or failed.
     */
    void close();

    /**
     * Schedule a flush and potentially flush some immediate data on the server.
     * This is safe to call multiple times, however performance considerations
     * should be taken into account
     */
    void flush();

    /**
     * Wrapper around mcreq_pipeline_timeout() and/or mcreq_pipeline_fail(). This
     * function will purge all pending requests within the server and invoke
     * their callbacks with the given error code passed as `err`. Depending on
     * the error code, some operations may be retried.
     *
     * @param err the error code by which to fail the commands
     *
     * @note This function does not modify the server's socket or state in itself,
     * but rather simply wipes the commands from its queue
     */
    void purge(lcb_error_t err) {
        purge(err, 0, NULL, Server::REFRESH_NEVER);
    }

    /** Callback for mc_pipeline_fail_chain */
    inline void purge_single(mc_PACKET*, lcb_error_t);

    /**
     * Returns true or false depending on whether there are pending commands on
     * this server
     */
    bool has_pending() const {
        return !SLLIST_IS_EMPTY(&requests);
    }

    int get_index() const {
        return mc_PIPELINE::index;
    }

    lcb_t get_instance() const {
        return instance;
    }

    const lcb_settings* get_settings() const {
        return settings;
    }

    void set_new_index(int new_index) {
        mc_PIPELINE::index = new_index;
    }

    const lcb_host_t& get_host() const {
        return *curhost;
    }

    bool supports_mutation_tokens() const {
        return mutation_tokens;
    }

    bool supports_compression() const {
        return compsupport;
    }

    bool is_connected() const {
        return connctx != NULL;
    }

    /** "Temporary" constructor. Only for use in retry queue */
    Server();
    ~Server();

    enum State {
        /* There are no known errored commands on this server */
        S_CLEAN,

        /* In the process of draining remaining commands to be flushed. The commands
         * being drained may have already been rescheduled to another server or
         * placed inside the error queue, but are pending being flushed. This will
         * only happen in completion-style I/O plugins. When this state is in effect,
         * subsequent attempts to connect will be blocked until all commands have
         * been properly drained.
         */
        S_ERRDRAIN,

        /* The server object has been closed, either because it has been removed
         * from the cluster or because the related lcb_t has been destroyed.
         */
        S_CLOSED,

        /*
         * Server has been temporarily constructed.
         */
        S_TEMPORARY
    };

    static Server* get(lcbio_CTX *ctx) {
        return reinterpret_cast<Server*>(lcbio_ctx_data(ctx));
    }

    uint32_t default_timeout() const {
        return settings->operation_timeout;
    }

    uint32_t next_timeout() const;

    bool check_closed();
    void start_errored_ctx(State next_state);
    void finalize_errored_ctx();
    void socket_failed(lcb_error_t);
    void io_timeout();

    enum RefreshPolicy {
        REFRESH_ALWAYS,
        REFRESH_ONFAILED,
        REFRESH_NEVER
    };

    int purge(lcb_error_t error, hrtime_t thresh, hrtime_t *next,
              RefreshPolicy policy);

    void connect();

    void handle_connected(lcbio_SOCKET *socket, lcb_error_t err, lcbio_OSERR syserr);

    enum ReadState {
        PKT_READ_COMPLETE,
        PKT_READ_PARTIAL
    };

    ReadState try_read(lcbio_CTX *ctx, rdb_IOROPE *ior);
    bool handle_nmv(MemcachedResponse& resinfo, mc_PACKET *oldpkt);
    bool maybe_retry_packet(mc_PACKET *pkt, lcb_error_t err);
    bool maybe_reconnect_on_fake_timeout(lcb_error_t received_error);

    /** Disable */
    Server(const Server&);

    State state;

    /** IO/Operation timer */
    lcbio_pTIMER io_timer;

    /** Pointer back to the instance */
    lcb_t instance;

    lcb_settings *settings;

    /** Whether compression is supported */
    short compsupport;

    /** Whether extended 'UUID' and 'seqno' are available for each mutation */
    short mutation_tokens;

    lcbio_CTX *connctx;
    lcbio_CONNREQ connreq;

    /** Request for current connection */
    lcb_host_t *curhost;
};
}
#endif /* __cplusplus */
#endif /* LCB_MCSERVER_H */
