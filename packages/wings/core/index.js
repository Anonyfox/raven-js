/**
 * @packageDocumentation
 *
 * Basic abstractions used of the wings package.
 *
 * - `Current` class for abstracting away http request/response data/state
 * - `Feather` class for defining an individual "Route" that works on a `Current`
 * - `Wings` class for routing and middleware processing before/after feathers
 *
 * Additional Features are opt-in with dedicated exports (to minimize bundle size):
 *
 * - `@raven-js/wings/coverts` contains prebuilt middlewares (especially asset handling)
 * - `@raven-js/wings/feathers` contains prebuilt feathers for common tasks
 * - `@raven-js/wings/plumage` contains the runtime options to choose from (like: node http, ...)
 *
 * The goal is ultimately to have a lean yet comprehensive kitchen sink developers
 * can opt into as desired, so that the idea-to-mvp cycle is as short as possible,
 * and common scenarios are covered out of the box.
 */

export * from "./context.js";
export * from "./mime-utils.js";
export * from "./route.js";
export * from "./router.js";
