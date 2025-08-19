/**
 * @file Module exports and main entry point
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *

 * **Wings Core** - Essential HTTP abstractions for the Wings framework.
 *
 * This module provides the fundamental building blocks for creating HTTP applications
 * in the Wings framework. It includes core abstractions for request/response handling,
 * routing, middleware, and HTTP utilities.
 *
 * ## Core Components
 *
 * ### **Context** - HTTP Request/Response Lifecycle
 * The `Context` class abstracts the HTTP request/response lifecycle, providing
 * a unified interface for handling requests and building responses. It supports
 * middleware execution, automatic body parsing, and convenient response helpers.
 *
 * ### **Router** - High-Performance HTTP Router
 * The `Router` class provides fast route matching using a Trie data structure.
 * It supports all standard HTTP methods, path parameters, middleware, and
 * method chaining for building complex routing configurations.
 *
 * ### **Route** - Individual Route Definition
 * The `Route` class represents a single HTTP route with its handler, middleware,
 * constraints, and metadata. It provides factory methods for creating routes
 * with specific HTTP methods.
 *
 * ### **Middleware** - Request Processing Pipeline
 * The `Middleware` class encapsulates functions that can be executed during
 * the request processing pipeline. It supports both synchronous and asynchronous
 * handlers with optional identifiers for duplicate prevention.
 *
 * ### **HTTP Utilities**
 * - **HTTP Methods**: Constants and validation for standard HTTP methods
 * - **MIME Utils**: File extension to MIME type mapping utilities
 *
 * ## Design Philosophy
 *
 * Wings Core is designed to be:
 * - **Lean**: Minimal bundle size with zero external dependencies
 * - **Fast**: Optimized for performance with O(1) route matching
 * - **Flexible**: Works in any JavaScript environment (Node.js, browser, serverless)
 * - **Composable**: Modular design allows mixing and matching components
 *
 * ## Usage Examples
 *
 * ```javascript
 * import { Router, Context } from '@raven-js/wings/core';
 *
 * // Create a router
 * const router = new Router();
 *
 * // Add routes
 * router
 *   .get('/users', (ctx) => {
 *     ctx.json({ users: [] });
 *   })
 *   .get('/users/:id', (ctx) => {
 *     const userId = ctx.pathParams.id;
 *     ctx.json({ id: userId, name: 'John Doe' });
 *   })
 *   .post('/users', async (ctx) => {
 *     const userData = ctx.requestBody();
 *     const newUser = await createUser(userData);
 *     ctx.json(newUser);
 *   });
 *
 * // Handle requests
 * const url = new URL('http://localhost/users/123');
 * const ctx = new Context('GET', url, new Headers());
 * await router.handleRequest(ctx);
 * ```
 *
 * ## Additional Features
 *
 * For more advanced functionality, consider these optional modules:
 *
 * - **`@raven-js/wings/coverts`**: Pre-built middleware for common tasks
 * - **`@raven-js/wings/feathers`**: Pre-built route handlers for common scenarios
 * - **`@raven-js/wings/plumage`**: Runtime adapters for different environments
 *
 * ## Performance Characteristics
 *
 * - **Route Registration**: O(n) where n is path segments
 * - **Route Matching**: O(m) where m is request path segments
 * - **Memory Usage**: ~1KB overhead for typical applications
 * - **Bundle Size**: Minimal with tree-shaking support
 *
 */

export * from "./context.js";
export * from "./http-methods.js";
export * from "./mime-utils.js";
export * from "./route.js";
export * from "./router.js";
