/**
 * @file CLI command execution through HTTP router architecture
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 *
 * # Wings Terminal - CLI Pattern Transformation
 *
 * **Blazing-fast router logic. CLI command patterns. Zero external dependencies.**
 *
 * If you've survived enough framework migrations, you know the pattern: build separate
 * HTTP APIs and CLI tools, duplicate route logic, maintain two codebases. Wings Terminal
 * eliminates this waste through surgical insight—transform CLI args into URL patterns,
 * then leverage the existing blazing-fast router logic built for HTTP matching.
 *
 * ## The Transform
 *
 * ```bash
 * # CLI command
 * myapp users list --active --format=json
 *
 * # Transforms to URL pattern
 * /users/list?active=true&format=json
 *
 * # Matches against COMMAND routes (not GET routes)
 * ```
 *
 * Separate CLI routes leverage same fast matching engine:
 *
 * ```javascript
 * import { Router, Terminal } from '@raven-js/wings';
 *
 * const router = new Router();
 *
 * // HTTP route (GET method)
 * router.get('/api/users', async (ctx) => {
 *   const users = await getUsers();
 *   ctx.json(users);
 * });
 *
 * // CLI route (COMMAND method - separate but uses same fast router)
 * router.cmd('/users/list', async (ctx) => {
 *   const active = ctx.queryParams.get('active') === 'true';
 *   const format = ctx.queryParams.get('format') || 'table';
 *
 *   const users = await getUsers({ active });
 *
 *   if (format === 'json') {
 *     ctx.json(users);
 *   } else {
 *     table(users); // Built-in terminal table renderer
 *   }
 * });
 *
 * // CLI execution transforms args → URL → fast router matching
 * const terminal = new Terminal(router);
 * await terminal.run(process.argv.slice(2));
 * ```
 *
 * ## Territory Captured
 *
 * **From framework complexity:**
 * - Commander.js + Express.js: 847KB dependencies, duplicate logic
 * - **To raven efficiency:** Zero dependencies, unified codebase
 *
 * **From slow CLI routing:**
 * - Commander.js tree traversal, yargs parsing overhead, custom matching logic
 * - **To adaptive speed:** Transform to URL patterns, leverage blazing-fast HTTP router
 *
 * **From duplicate routing engines:**
 * - Separate CLI parsing + HTTP routing, different pattern syntaxes
 * - **To surgical reuse:** CLI patterns → URL patterns → same fast Trie matching
 *
 * ## Complete Arsenal
 *
 * ```javascript
 * import {
 *   // Core runtime
 *   Terminal, ArgsToUrl, UrlToArgs,
 *
 *   // Interactive input (async)
 *   ask, confirm,
 *
 *   // Colored output (sync)
 *   success, error, warning, info, print,
 *
 *   // Text formatting (sync)
 *   bold, italic, dim, underline,
 *
 *   // Structured display (sync)
 *   table
 * } from '@raven-js/wings/terminal';
 *
 * // Full CLI application
 * router.cmd('/deploy/:env', async (ctx) => {
 *   const env = ctx.pathParams.env;
 *   const force = ctx.queryParams.get('force') === 'true';
 *
 *   if (!force) {
 *     const confirmed = await confirm(`Deploy to ${bold(env)}?`);
 *     if (!confirmed) return ctx.text('Deployment cancelled');
 *   }
 *
 *   info(`Deploying to ${env}...`);
 *   await deployToEnvironment(env);
 *   success(`Deployed to ${env}`);
 * });
 * ```
 *
 * ## Platform Mastery
 *
 * **Node.js built-ins only:** `readline`, ANSI escape codes, `process` streams—
 * battle-tested by millions of servers. No external attack vectors.
 *
 * **Pattern transformation:** `ArgsToUrl()` converts CLI args to URL patterns,
 * leverages existing router's O(1) Trie matching for blazing-fast command dispatch.
 *
 * **Context adaptation:** HTTP Context object repurposed for CLI semantics.
 * `responseBody` → stdout, `responseStatusCode` → exit code, same async model.
 *
 * **Bidirectional debug:** Perfect round-trip between CLI args and URLs.
 * Debug CLI commands by inspecting their transformed URL patterns.
 *
 * ## Survival Advantage
 *
 * When you need CLI tooling, you don't build a separate routing engine.
 * When CLI gets complex, you don't suffer through slow parsing libraries.
 * When routing patterns change, you leverage proven fast HTTP router logic.
 *
 * Transform patterns. Reuse speed. Zero routing duplication.
 */

export * from "./actions/index.js";
export * from "./runtime.js";
export * from "./transform-pattern.js";
