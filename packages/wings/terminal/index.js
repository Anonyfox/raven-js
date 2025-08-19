/**
 * @file Module exports and main entry point
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 *
 * @packageDocumentation
 *
 * # Wings Terminal - CLI-to-URL Transformation Library
 *
 * _Transform command-line arguments into URLs and vice versa with zero dependencies._
 *
 * Built with the Raven philosophy: elegant abstractions that map real-world patterns.
 * Command-line interfaces and URLs share striking structural similarities - both are
 * hierarchical strings with parameters. This module provides bidirectional transformation
 * between these formats.
 *
 * ## Core Concepts
 *
 * **Subcommands map to path segments**
 * - `git branch list` → `/git/branch/list`
 * - `docker container stop` → `/docker/container/stop`
 *
 * **Positional arguments map to dynamic path segments**
 * - `git checkout main` → `/git/checkout/:branch` where `branch=main`
 * - `npm install express` → `/npm/install/:package` where `package=express`
 *
 * **Flags map to query parameters**
 * - `git commit --message="hello" --amend` → `/git/commit?message=hello&amend=true`
 * - `npm install --save-dev --verbose` → `/npm/install?save-dev=true&verbose=true`
 *
 * ## Pattern Transformation
 *
 * ```javascript
 * import { ArgsToUrl, UrlToArgs } from '@raven-js/wings/terminal';
 *
 * // CLI to URL
 * const args = ['git', 'commit', '--message', 'Initial commit', '--amend'];
 * const url = ArgsToUrl(args);
 * // Result: '/git/commit?message=Initial%20commit&amend=true'
 *
 * // URL to CLI
 * const cliArgs = UrlToArgs('/npm/install/express?save-dev=true&verbose=true');
 * // Result: ['npm', 'install', 'express', '--save-dev', '--verbose']
 * ```
 *
 * ## Design Philosophy
 *
 * Wings Terminal is designed to be:
 * - **Bidirectional**: Perfect round-trip conversion between CLI and URL formats
 * - **Standards-compliant**: Follows CLI conventions and URL specifications
 * - **Zero-dependency**: Pure JavaScript with no external dependencies
 * - **Type-aware**: Intelligent detection of boolean vs string flags
 */

export * from "./runtime.js";
export * from "./transform-pattern.js";
