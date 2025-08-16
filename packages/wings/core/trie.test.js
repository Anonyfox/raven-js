import { strict as assert } from "node:assert";
import { beforeEach, describe, it } from "node:test";
import { Trie } from "./trie.js";

describe("Trie", () => {
	/** @type {Trie} */
	let trie;

	beforeEach(() => {
		trie = new Trie();
	});

	describe("constructor", () => {
		it("should initialize with default values", () => {
			assert.equal(trie.id, -1);
			assert.equal(trie.name, undefined);
			assert.deepEqual(trie.fixed, {});
			assert.deepEqual(trie.dynamic, {});
			assert.equal(trie.wildcard, -1);
		});

		it("should set the name if provided", () => {
			const namedTrie = new Trie("test");
			assert.equal(namedTrie.name, "test");
		});
	});

	describe("register", () => {
		it("should register a static route", () => {
			trie.register(["home"], 1);
			assert.equal(trie.fixed.home.id, 1);
		});

		it("should register a dynamic route", () => {
			trie.register([":id"], 2);
			assert.equal(trie.dynamic.id.id, 2);
		});

		it("should register a wildcard route", () => {
			trie.register(["*"], 3);
			assert.equal(trie.wildcard, 3);
		});

		it("should throw an error if more than one wildcard is registered", () => {
			trie.register(["*"], 3);
			assert.throws(() => trie.register(["*"], 4), {
				message: "Only one wildcard per route segment is allowed",
			});
		});

		it("should handle nested routes", () => {
			trie.register(["home", "about"], 4);
			assert.equal(trie.fixed.home.fixed.about.id, 4);
		});

		it("should handle nested dynamic routes", () => {
			trie.register(["home", ":id"], 5);
			assert.equal(trie.fixed.home.dynamic.id.id, 5);
		});

		it("should handle mixed static and dynamic routes", () => {
			trie.register(["home", ":id", "details"], 6);
			assert.equal(trie.fixed.home.dynamic.id.fixed.details.id, 6);
		});
	});

	describe("match", () => {
		beforeEach(() => {
			trie.register(["home"], 1);
			trie.register([":id"], 2);
			trie.register(["another", "*"], 3);
			trie.register(["home", "about"], 4);
			trie.register(["home", ":id"], 5);
			trie.register(["home", ":id", "details"], 6);
		});

		it("should match a static route", () => {
			const result = trie.match(["home"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, {});
		});

		it("should match a dynamic route", () => {
			const result = trie.match(["123"]);
			assert.equal(result.id, 2);
			assert.deepEqual(result.params, { id: "123" });
		});

		it("should match a wildcard route", () => {
			const result = trie.match(["another", "anything"]);
			assert.equal(result.id, 3);
			assert.deepEqual(result.params, {});
		});

		it("should match a nested static route", () => {
			const result = trie.match(["home", "about"]);
			assert.equal(result.id, 4);
			assert.deepEqual(result.params, {});
		});

		it("should match a nested dynamic route", () => {
			const result = trie.match(["home", "123"]);
			assert.equal(result.id, 5);
			assert.deepEqual(result.params, { id: "123" });
		});

		it("should match a mixed static and dynamic route", () => {
			const result = trie.match(["home", "123", "details"]);
			assert.equal(result.id, 6);
			assert.deepEqual(result.params, { id: "123" });
		});

		it("should return undefined for non-matching routes", () => {
			// Create a fresh trie for this test to avoid conflicts
			const freshTrie = new Trie();
			freshTrie.register(["home"], 1);
			const result = freshTrie.match(["completely-nonexistent-route"]);
			assert.equal(result.id, undefined);
			assert.deepEqual(result.params, {});
		});

		it("should handle empty path segments", () => {
			trie.register([""], 7);
			const result = trie.match([""]);
			assert.equal(result.id, 7);
		});

		it("should handle root route", () => {
			trie.register([], 8);
			const result = trie.match([]);
			assert.equal(result.id, 8);
		});

		it("should prioritize fixed over dynamic routes", () => {
			trie.register(["users", "profile"], 9);
			trie.register(["users", ":id"], 10);

			const result = trie.match(["users", "profile"]);
			assert.equal(result.id, 9); // Fixed route should match, not dynamic
		});

		it("should handle multiple dynamic parameters", () => {
			trie.register(["users", ":id", "posts", ":postId"], 11);
			const result = trie.match(["users", "123", "posts", "456"]);
			assert.equal(result.id, 11);
			assert.deepEqual(result.params, { id: "123", postId: "456" });
		});

		it("should handle wildcard with dynamic parameters", () => {
			trie.register(["api", ":version", "*"], 12);
			const result = trie.match(["api", "v1", "users", "123"]);
			assert.equal(result.id, 12);
			assert.deepEqual(result.params, { version: "v1" });
		});

		it("should handle special characters in static segments", () => {
			trie.register(["user-profile", "settings"], 13);
			const result = trie.match(["user-profile", "settings"]);
			assert.equal(result.id, 13);
		});

		it("should handle numeric segments", () => {
			trie.register(["2024", "01", "15"], 14);
			const result = trie.match(["2024", "01", "15"]);
			assert.equal(result.id, 14);
		});

		it("should handle unicode characters", () => {
			trie.register(["café", "résumé"], 15);
			const result = trie.match(["café", "résumé"]);
			assert.equal(result.id, 15);
		});

		it("should handle very long segments", () => {
			const longSegment = "a".repeat(1000);
			trie.register([longSegment], 16);
			const result = trie.match([longSegment]);
			assert.equal(result.id, 16);
		});

		it("should handle many segments", () => {
			// Create a fresh trie for this test to avoid conflicts
			const freshTrie = new Trie();
			const manySegments = Array.from(
				{ length: 50 },
				(_, i) => `deepsegment${i}`,
			);
			freshTrie.register([...manySegments], 17); // Create a copy to avoid mutation
			const result = freshTrie.match(manySegments);
			assert.equal(result.id, 17);
		});

		it("should handle overlapping routes correctly", () => {
			trie.register(["users", "new"], 18);
			trie.register(["users", ":id"], 19);
			trie.register(["users", "new", "confirm"], 20);

			assert.equal(trie.match(["users", "new"]).id, 18);
			assert.equal(trie.match(["users", "123"]).id, 19);
			assert.equal(trie.match(["users", "new", "confirm"]).id, 20);
		});

		it("should handle empty dynamic parameter names", () => {
			trie.register([":", "test"], 21);
			const result = trie.match(["value", "test"]);
			assert.equal(result.id, 21);
			assert.deepEqual(result.params, { "": "value" });
		});

		it("should handle wildcard with empty name", () => {
			// Create a fresh trie for this test to avoid conflicts
			const wildcardTrie = new Trie();
			wildcardTrie.register(["*"], 22);
			const result = wildcardTrie.match(["anything"]);
			assert.equal(result.id, 22);
		});
	});
});
