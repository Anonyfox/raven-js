/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://ravenjs.dev}
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Fledge - Build & bundle tool for modern JavaScript applications.
 *
 * From nestling to flight-ready. Transforms source code into deployable artifacts
 * across three hunting modes: standalone binary, script blob, and static folder.
 */

import binary from "./src/binary/index.js";
import script from "./src/script/index.js";
import staticGen from "./src/static/index.js";

export { binary, script, staticGen as static };
export default { binary, script, static: staticGen };
