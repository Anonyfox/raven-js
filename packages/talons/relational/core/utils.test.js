/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for relational database utilities
 */

import { strictEqual, deepStrictEqual, ok } from "node:assert";
import { describe, it } from "node:test";
import {
	LruCache,
	RingBuffer,
	ObjectFactory,
	encodeUtf8,
	decodeUtf8,
	timeout,
	sleep,
	escapeIdentifier,
	generateId,
} from "./utils.js";

describe("LruCache", () => {
	it("stores and retrieves values", () => {
		const cache = new LruCache(3);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.set("c", 3);

		strictEqual(cache.get("a"), 1);
		strictEqual(cache.get("b"), 2);
		strictEqual(cache.get("c"), 3);
	});

	it("evicts least recently used items", () => {
		const cache = new LruCache(2);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.set("c", 3); // Should evict 'a'

		strictEqual(cache.get("a"), undefined);
		strictEqual(cache.get("b"), 2);
		strictEqual(cache.get("c"), 3);
	});

	it("updates access order on get", () => {
		const cache = new LruCache(2);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.get("a"); // Make 'a' recently used
		cache.set("c", 3); // Should evict 'b'

		strictEqual(cache.get("a"), 1);
		strictEqual(cache.get("b"), undefined);
		strictEqual(cache.get("c"), 3);
	});

	it("handles delete operations", () => {
		const cache = new LruCache(3);
		cache.set("a", 1);
		cache.set("b", 2);

		ok(cache.delete("a"));
		strictEqual(cache.get("a"), undefined);
		strictEqual(cache.get("b"), 2);
	});

	it("clears all items", () => {
		const cache = new LruCache(3);
		cache.set("a", 1);
		cache.set("b", 2);
		cache.clear();

		strictEqual(cache.get("a"), undefined);
		strictEqual(cache.get("b"), undefined);
	});
});

describe("RingBuffer", () => {
	it("writes and reads data", () => {
		const buffer = new RingBuffer(16);
		const data = new Uint8Array([1, 2, 3, 4]);

		buffer.write(data);
		const result = buffer.read(4);

		deepStrictEqual(result, data);
	});

	it("handles wraparound", () => {
		const buffer = new RingBuffer(8);
		const data1 = new Uint8Array([1, 2, 3, 4, 5]);
		const data2 = new Uint8Array([6, 7, 8]);

		buffer.write(data1);
		buffer.read(3); // Read some data to make space
		buffer.write(data2);

		const result = buffer.read(5);
		deepStrictEqual(result, new Uint8Array([4, 5, 6, 7, 8]));
	});

	it("returns null when insufficient data", () => {
		const buffer = new RingBuffer(16);
		buffer.write(new Uint8Array([1, 2, 3]));

		const result = buffer.read(5);
		strictEqual(result, null);
	});

	it("handles peek operations", () => {
		const buffer = new RingBuffer(16);
		const data = new Uint8Array([1, 2, 3, 4]);

		buffer.write(data);
		const peeked = buffer.peek(2);
		const read = buffer.read(2);

		deepStrictEqual(peeked, new Uint8Array([1, 2]));
		deepStrictEqual(read, new Uint8Array([1, 2]));
	});
});

describe("ObjectFactory", () => {
	it("creates objects with consistent shape", () => {
		const factory = new ObjectFactory(["id", "name", "email"]);
		const obj1 = factory.create([1, "John", "john@example.com"]);
		const obj2 = factory.create([2, "Jane", "jane@example.com"]);

		deepStrictEqual(obj1, { id: 1, name: "John", email: "john@example.com" });
		deepStrictEqual(obj2, { id: 2, name: "Jane", email: "jane@example.com" });
	});

	it("handles different value counts gracefully", () => {
		const factory = new ObjectFactory(["id", "name", "email"]);
		const obj = factory.create([1, "John"]); // Missing email

		deepStrictEqual(obj, { id: 1, name: "John", email: undefined });
	});
});

describe("UTF-8 encoding/decoding", () => {
	it("encodes and decodes text correctly", () => {
		const text = "Hello, 世界! 🌍";
		const encoded = encodeUtf8(text);
		const decoded = decodeUtf8(encoded);

		strictEqual(decoded, text);
		ok(encoded instanceof Uint8Array);
	});

	it("handles empty strings", () => {
		const encoded = encodeUtf8("");
		const decoded = decodeUtf8(encoded);

		strictEqual(decoded, "");
		strictEqual(encoded.length, 0);
	});
});

describe("timeout and sleep", () => {
	it("timeout resolves with value", async () => {
		const promise = Promise.resolve("success");
		const result = await timeout(promise, 100);
		strictEqual(result, "success");
	});

	it("timeout rejects on timeout", async () => {
		const promise = new Promise(() => {}); // Never resolves
		try {
			await timeout(promise, 10);
			ok(false, "Should have timed out");
		} catch (error) {
			ok(error.message.includes("timeout"));
		}
	});

	it("sleep waits for specified duration", async () => {
		const start = Date.now();
		await sleep(50);
		const elapsed = Date.now() - start;
		ok(elapsed >= 45); // Allow some tolerance
	});
});

describe("escapeIdentifier", () => {
	it("escapes PostgreSQL identifiers", () => {
		strictEqual(escapeIdentifier("table", "pg"), '"table"');
		strictEqual(escapeIdentifier("my table", "pg"), '"my table"');
		strictEqual(escapeIdentifier('table"name', "pg"), '"table""name"');
	});

	it("escapes MySQL identifiers", () => {
		strictEqual(escapeIdentifier("table", "mysql"), "`table`");
		strictEqual(escapeIdentifier("my table", "mysql"), "`my table`");
		strictEqual(escapeIdentifier("table`name", "mysql"), "`table``name`");
	});

	it("escapes SQLite identifiers", () => {
		strictEqual(escapeIdentifier("table", "sqlite-node"), '"table"');
		strictEqual(escapeIdentifier("my table", "sqlite-wasm"), '"my table"');
	});
});

describe("generateId", () => {
	it("generates unique IDs", () => {
		const id1 = generateId();
		const id2 = generateId();

		ok(typeof id1 === "string");
		ok(typeof id2 === "string");
		ok(id1 !== id2);
		ok(id1.length > 0);
		ok(id2.length > 0);
	});

	it("generates IDs with consistent format", () => {
		const id = generateId();
		ok(/^[a-z0-9_]+$/.test(id)); // Should be lowercase alphanumeric with underscores
	});
});
