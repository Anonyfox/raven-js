/**
 * @packageDocumentation
 *
 * Since Wings itself is isomorphic and can run in any JavaScript environment,
 * it needs to be wrapped in a runtime to handle requests and responses. We call
 * this runtime "Plumage" since it defines the overall behavior of the app from
 * from the outside, and there can be only one per app.
 *
 * This explicit separation allows Wings to be used in different environments
 * without any changes to the core framework or dirty hacks to adapt to new
 * environments.
 *
 * The "normal" mode is usually a flavor of NodeJS `http` server, but it could
 * be anything else that can handle HTTP requests and responses. For example
 * different "serverless" environments to not actually boot a server, but rather
 * map http event objects of certain shapes to the router functions directly. Or
 * the browser where some URL pushstate handling is used to simulate
 * request/response cycles.
 *
 * The USP of Wings itself is to make any kind of runtime possible, and Plumage
 * is the glue that makes it happen. Switching deployment providers or even
 * cloud architecture operations should not require any changes to the actual
 * application code. This is what unlocks true independence without the hassle.
 */

export * from "./node-http.js";
