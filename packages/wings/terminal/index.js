/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Terminal runtime and UI actions for CLI applications.
 *
 * **Terminal Runtime**: Execute CLI commands through Wings routing system.
 * Transform command-line arguments into HTTP-like Context objects, route
 * through middleware pipeline, interpret results for terminal output.
 *
 * **UI Actions**: Pure functions for interactive CLI interfaces using
 * platform primitives. Input gathering, output formatting, table display.
 *
 * **Key Integration**: Same routes handle HTTP requests and CLI commands
 * through unified Context abstraction. Zero external dependencies.
 *
 * @example
 * ```javascript
 * import { Router } from '@raven-js/wings/core';
 * import { Terminal, ask, success } from '@raven-js/wings/terminal';
 *
 * const router = new Router();
 * router.cmd('/deploy', async (ctx) => {
 *   const target = await ask('Deploy target: ');
 *   // Deployment logic...
 *   success(`Deployed to ${target}`);
 * });
 *
 * const terminal = new Terminal(router);
 * await terminal.run(process.argv.slice(2));
 * ```
 */

export * from "./actions/index.js";
export { CommandRoute, ValidationError } from "./command-route.js";
export { Terminal } from "./runtime.js";
export { ArgsToUrl, UrlToArgs } from "./transform-pattern.js";
