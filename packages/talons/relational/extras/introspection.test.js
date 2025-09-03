/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for introspection utilities
 */

import { deepStrictEqual, ok, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { createIntrospector, DatabaseIntrospector } from "./introspection.js";

// Mock client for testing
const createMockClient = (driver = "pg") => ({
	config: { driver },
	query: async (sql, params = []) => {
		// Mock responses based on SQL patterns
		if (sql.includes("information_schema.tables")) {
			return { rows: [["users"], ["posts"]] };
		}
		if (sql.includes("information_schema.columns")) {
			return {
				rows: [
					["id", "integer", "NO", null, null, null, null, null],
					["name", "varchar", "YES", null, 255, null, null, "User name"],
				],
			};
		}
		if (sql.includes("version")) {
			return { rows: [["PostgreSQL 15.0"]] };
		}
		return { rows: [] };
	},
});

describe("createIntrospector", () => {
	it("creates database introspector", () => {
		const client = createMockClient();
		const introspector = createIntrospector(client);

		ok(introspector instanceof DatabaseIntrospector);
		strictEqual(introspector.driver, "pg");
	});
});

describe("DatabaseIntrospector", () => {
	it("gets table list", async () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const tables = await introspector.getTables();
		deepStrictEqual(tables, ["users", "posts"]);
	});

	it("gets schema list", async () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const schemas = await introspector.getSchemas();
		ok(Array.isArray(schemas));
	});

	it("gets column information", async () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const columns = await introspector.getColumns("users");
		strictEqual(columns.length, 2);
		strictEqual(columns[0].name, "id");
		strictEqual(columns[0].type, "integer");
		strictEqual(columns[1].name, "name");
		strictEqual(columns[1].nullable, true);
	});

	it("gets database info", async () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const info = await introspector.getDatabaseInfo();
		strictEqual(info.driver, "pg");
		strictEqual(info.version, "PostgreSQL 15.0");
	});

	it("gets table info with all details", async () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const tableInfo = await introspector.getTableInfo("users");
		strictEqual(tableInfo.name, "users");
		strictEqual(tableInfo.type, "table");
		ok(Array.isArray(tableInfo.columns));
		ok(Array.isArray(tableInfo.indexes));
		ok(Array.isArray(tableInfo.constraints));
		ok(Array.isArray(tableInfo.foreignKeys));
	});

	it("generates CREATE TABLE statement", async () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const createSql = await introspector.generateCreateTable("users");
		ok(createSql.includes("CREATE TABLE"));
		ok(createSql.includes("users"));
	});

	it("compares table structures", () => {
		const client = createMockClient();
		const introspector = new DatabaseIntrospector(client);

		const table1 = {
			name: "users",
			columns: [{ name: "id", type: "integer" }],
			indexes: [],
			constraints: [],
			foreignKeys: [],
		};

		const table2 = {
			name: "users",
			columns: [{ name: "id", type: "integer" }],
			indexes: [],
			constraints: [],
			foreignKeys: [],
		};

		const comparison = introspector.compareTables(table1, table2);
		strictEqual(comparison.identical, true);
	});

	it("handles SQLite driver differences", () => {
		const client = createMockClient("sqlite-node");
		const introspector = new DatabaseIntrospector(client);

		strictEqual(introspector.driver, "sqlite-node");
		// SQLite-specific behavior would be tested with actual queries
	});
});
