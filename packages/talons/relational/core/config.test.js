/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for relational database configuration module
 */

import { strictEqual, deepStrictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { parseDsn, determineTlsMode, mergeConfig } from "./config.js";

describe("parseDsn", () => {
	it("parses PostgreSQL DSN correctly", () => {
		const result = parseDsn("postgresql://user:pass@localhost:5432/mydb");
		deepStrictEqual(result, {
			driver: "pg",
			host: "localhost",
			port: 5432,
			user: "user",
			password: "pass",
			database: "mydb",
		});
	});

	it("parses MySQL DSN correctly", () => {
		const result = parseDsn("mysql://user:pass@localhost:3306/mydb");
		deepStrictEqual(result, {
			driver: "mysql",
			host: "localhost",
			port: 3306,
			user: "user",
			password: "pass",
			database: "mydb",
		});
	});

	it("parses SQLite DSN correctly", () => {
		const result = parseDsn("sqlite:///path/to/db.sqlite");
		deepStrictEqual(result, {
			driver: "sqlite-node",
			database: "/path/to/db.sqlite",
		});
	});

	it("handles missing components gracefully", () => {
		const result = parseDsn("postgresql://localhost/mydb");
		deepStrictEqual(result, {
			driver: "pg",
			host: "localhost",
			port: 5432,
			database: "mydb",
		});
	});

	it("throws on invalid DSN", () => {
		throws(() => parseDsn("invalid-dsn"), /Invalid DSN format/);
	});
});

describe("determineTlsMode", () => {
	it("requires TLS for remote hosts", () => {
		strictEqual(determineTlsMode("example.com", "pg"), "require");
		strictEqual(determineTlsMode("192.168.1.100", "mysql"), "require");
	});

	it("disables TLS for localhost", () => {
		strictEqual(determineTlsMode("localhost", "pg"), "disable");
		strictEqual(determineTlsMode("127.0.0.1", "mysql"), "disable");
		strictEqual(determineTlsMode("::1", "pg"), "disable");
	});

	it("disables TLS for SQLite", () => {
		strictEqual(determineTlsMode("any-host", "sqlite-node"), "disable");
		strictEqual(determineTlsMode("any-host", "sqlite-wasm"), "disable");
	});
});

describe("mergeConfig", () => {
	it("merges configurations correctly", () => {
		const base = {
			driver: "pg",
			host: "localhost",
			port: 5432,
		};

		const overrides = {
			port: 5433,
			database: "test",
		};

		const result = mergeConfig(base, overrides);
		deepStrictEqual(result, {
			driver: "pg",
			host: "localhost",
			port: 5433,
			database: "test",
			tls: "disable",
			connectTimeoutMs: 10000,
			pool: {
				min: 0,
				max: 10,
				idleTimeoutMs: 30000,
				acquireTimeoutMs: 10000,
			},
		});
	});

	it("applies driver-specific defaults", () => {
		const mysql = mergeConfig({ driver: "mysql" });
		strictEqual(mysql.port, 3306);

		const pg = mergeConfig({ driver: "pg" });
		strictEqual(pg.port, 5432);

		const sqlite = mergeConfig({ driver: "sqlite-node" });
		strictEqual(sqlite.database, ":memory:");
	});

	it("determines TLS mode automatically", () => {
		const remote = mergeConfig({
			driver: "pg",
			host: "example.com",
		});
		strictEqual(remote.tls, "require");

		const local = mergeConfig({
			driver: "pg",
			host: "localhost",
		});
		strictEqual(local.tls, "disable");
	});
});
