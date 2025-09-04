/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Reserved names that cannot be used as resource identifiers.
 *
 * These names conflict with common infrastructure patterns and DNS conventions.
 */

/**
 * Reserved names that cannot be used as resource identifiers.
 * These conflict with common infrastructure patterns.
 *
 * @type {ReadonlyArray<string>}
 */
export const RESERVED_NAMES = Object.freeze([
	"api",
	"www",
	"admin",
	"root",
	"mail",
	"ftp",
	"ssh",
	"http",
	"https",
	"dns",
	"mx",
	"ns",
	"cname",
	"txt",
	"srv",
	"ptr",
	"soa",
	"aaaa",
	"localhost",
	"example",
	"test",
	"staging",
	"prod",
	"production",
	"dev",
	"development",
	"beta",
	"alpha",
	"demo",
	"preview",
	"cdn",
	"assets",
	"static",
	"media",
	"images",
	"js",
	"css",
	"blog",
	"shop",
	"store",
	"app",
	"mobile",
	"web",
	"site",
]);
