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
			assert.deepEqual(trie.fixed, Object.create(null));
			assert.deepEqual(trie.dynamic, Object.create(null));
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

		// Edge cases and potential issues
		it("should not mutate the input array", () => {
			const segments = ["home", "about"];
			const originalSegments = [...segments];
			trie.register(segments, 1);
			assert.deepEqual(segments, originalSegments);
		});

		it("should handle wildcard in middle of route (should be invalid)", () => {
			assert.throws(() => trie.register(["home", "*", "about"], 1), {
				message: "Wildcard must be the last segment in a route",
			});
		});

		it("should handle wildcard followed by more segments (should be invalid)", () => {
			assert.throws(() => trie.register(["*", "more"], 1), {
				message: "Wildcard must be the last segment in a route",
			});
		});

		it("should handle duplicate parameter names in same route", () => {
			trie.register([":id", ":id"], 1);
			const result = trie.match(["123", "456"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { id: "456" }); // Last one wins
		});

		it("should handle very deep nesting", () => {
			const deepSegments = Array.from({ length: 100 }, (_, i) => `level${i}`);
			trie.register(deepSegments, 1);
			const result = trie.match(deepSegments);
			assert.equal(result.id, 1);
		});

		it("should handle many routes efficiently", () => {
			// Register 1000 routes
			for (let i = 0; i < 1000; i++) {
				trie.register([`route${i}`, `sub${i}`], i);
			}

			// Test a few random routes
			assert.equal(trie.match(["route0", "sub0"]).id, 0);
			assert.equal(trie.match(["route500", "sub500"]).id, 500);
			assert.equal(trie.match(["route999", "sub999"]).id, 999);
		});

		it("should handle routes with same prefix but different endings", () => {
			trie.register(["api", "v1", "users"], 1);
			trie.register(["api", "v1", "posts"], 2);
			trie.register(["api", "v2", "users"], 3);

			assert.equal(trie.match(["api", "v1", "users"]).id, 1);
			assert.equal(trie.match(["api", "v1", "posts"]).id, 2);
			assert.equal(trie.match(["api", "v2", "users"]).id, 3);
		});

		it("should handle empty segments", () => {
			trie.register(["", "empty"], 1);
			const result = trie.match(["", "empty"]);
			assert.equal(result.id, 1);
		});

		it("should handle segments with only whitespace", () => {
			trie.register(["   ", "whitespace"], 1);
			const result = trie.match(["   ", "whitespace"]);
			assert.equal(result.id, 1);
		});

		it("should handle segments with special regex characters", () => {
			const specialChars = ".*+?^$\\{\\}()|[\\\\]";
			trie.register([specialChars, "regex"], 1);
			const result = trie.match([specialChars, "regex"]);
			assert.equal(result.id, 1);
		});

		it("should handle segments with null bytes", () => {
			trie.register(["\0", "null"], 1);
			const result = trie.match(["\0", "null"]);
			assert.equal(result.id, 1);
		});

		it("should handle segments with unicode surrogate pairs", () => {
			trie.register(["🚀", "rocket"], 1);
			const result = trie.match(["🚀", "rocket"]);
			assert.equal(result.id, 1);
		});

		it("should handle segments with control characters", () => {
			trie.register(["\t\n\r", "control"], 1);
			const result = trie.match(["\t\n\r", "control"]);
			assert.equal(result.id, 1);
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

		// Additional edge cases for match
		it("should handle partial matches correctly", () => {
			trie.register(["api", "v1", "users"], 1);
			trie.register(["api", "v1"], 2);

			// Should match the exact route, not the partial one
			const result = trie.match(["api", "v1", "users"]);
			assert.equal(result.id, 1);
		});

		it("should handle wildcard with multiple path segments", () => {
			trie.register(["api", "*"], 1);
			const result = trie.match(["api", "v1", "users", "123", "posts"]);
			assert.equal(result.id, 1);
		});

		it("should handle multiple dynamic parameters with same name", () => {
			trie.register([":id", ":id"], 1);
			const result = trie.match(["123", "456"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { id: "456" }); // Last one wins
		});

		it("should handle case sensitivity correctly", () => {
			trie.register(["Home"], 1);
			trie.register(["home"], 2);

			assert.equal(trie.match(["Home"]).id, 1);
			assert.equal(trie.match(["home"]).id, 2);
		});

		it("should handle trailing slashes correctly", () => {
			trie.register(["home", ""], 1);
			trie.register(["home"], 2);

			assert.equal(trie.match(["home", ""]).id, 1);
			assert.equal(trie.match(["home"]).id, 2);
		});

		it("should handle params object mutation", () => {
			const params = { existing: "value" };
			trie.register([":id"], 1);
			const result = trie.match(["123"], params);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { existing: "value", id: "123" });
		});

		it("should handle very deep dynamic parameter nesting", () => {
			const deepDynamic = Array.from({ length: 50 }, (_, i) => `:param${i}`);
			trie.register(deepDynamic, 1);
			const deepValues = Array.from({ length: 50 }, (_, i) => `value${i}`);
			const result = trie.match(deepValues);
			assert.equal(result.id, 1);

			// Check that all parameters are captured
			for (let i = 0; i < 50; i++) {
				assert.equal(result.params[`param${i}`], `value${i}`);
			}
		});

		it("should handle performance with many dynamic routes", () => {
			// Create a fresh trie for this test to avoid conflicts
			const freshTrie = new Trie();

			// Register many dynamic routes
			for (let i = 0; i < 100; i++) {
				freshTrie.register([`:param${i}`], i);
			}

			// Test matching
			const result = freshTrie.match(["testvalue"]);
			assert.equal(result.id, 0); // Should match the first dynamic route
			assert.deepEqual(result.params, { param0: "testvalue" });
		});

		it("should handle mixed priority correctly", () => {
			trie.register(["users", "profile"], 1); // Fixed
			trie.register(["users", ":id"], 2); // Dynamic
			trie.register(["users", "*"], 3); // Wildcard

			// Fixed should take priority
			assert.equal(trie.match(["users", "profile"]).id, 1);
			// Dynamic should match when fixed doesn't
			assert.equal(trie.match(["users", "123"]).id, 2);
			// Wildcard should match multiple segments
			assert.equal(trie.match(["users", "123", "posts"]).id, 3);
		});
	});

	describe("optional parameters", () => {
		let trie;

		beforeEach(() => {
			trie = new Trie();
		});

		it("should match route with missing optional parameter", () => {
			trie.register(["static", ":config?"], 1);

			const result = trie.match(["static"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, {});
		});

		it("should match route with provided optional parameter", () => {
			trie.register(["static", ":config?"], 1);

			const result = trie.match(["static", "myconfig.js"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { config: "myconfig.js" });
		});

		it("should handle multiple optional parameters", () => {
			trie.register(["deploy", ":env?", ":version?"], 1);

			// No parameters
			let result = trie.match(["deploy"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, {});

			// One parameter
			result = trie.match(["deploy", "prod"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { env: "prod" });

			// Two parameters
			result = trie.match(["deploy", "prod", "v1.0"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { env: "prod", version: "v1.0" });
		});

		it("should not match routes with too many segments", () => {
			trie.register(["static", ":config?"], 1);

			const result = trie.match(["static", "config.js", "extra"]);
			assert.equal(result.id, undefined);
		});

		it("should handle mixed optional and required parameters", () => {
			trie.register(["api", ":version", ":resource?"], 1);

			// Required parameter provided, optional missing
			let result = trie.match(["api", "v1"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { version: "v1" });

			// Both parameters provided
			result = trie.match(["api", "v1", "users"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { version: "v1", resource: "users" });

			// Required parameter missing - should not match
			result = trie.match(["api"]);
			assert.equal(result.id, undefined);
		});

		it("should maintain priority with optional parameters", () => {
			trie.register(["users", ":id?"], 1); // Optional parameter
			trie.register(["users", "profile"], 2); // Fixed segment

			// Fixed segment should take priority over optional parameter
			const result = trie.match(["users", "profile"]);
			assert.equal(result.id, 2);
		});

		it("should handle optional parameters with URL encoding", () => {
			trie.register(["files", ":path?"], 1);

			const result = trie.match(["files", "my%20file.txt"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { path: "my file.txt" });
		});

		it("should handle complex optional parameter patterns", () => {
			// Simulate fledge CLI pattern: /static/:config?
			trie.register(["static", ":config?"], 1);
			trie.register(["script", ":config?"], 2);
			trie.register(["binary", ":config?"], 3);

			// Test all commands without config
			assert.equal(trie.match(["static"]).id, 1);
			assert.equal(trie.match(["script"]).id, 2);
			assert.equal(trie.match(["binary"]).id, 3);

			// Test all commands with config
			let result = trie.match(["static", "config.js"]);
			assert.equal(result.id, 1);
			assert.deepEqual(result.params, { config: "config.js" });

			result = trie.match(["script", "build.config.js"]);
			assert.equal(result.id, 2);
			assert.deepEqual(result.params, { config: "build.config.js" });

			result = trie.match(["binary", "dist.config.js"]);
			assert.equal(result.id, 3);
			assert.deepEqual(result.params, { config: "dist.config.js" });
		});

		it("should handle nested optional parameters", () => {
			trie.register(["api", ":version?", "users", ":id?"], 1);

			// No optional parameters
			let result = trie.match(["api", "users"]);
			assert.equal(result.id, undefined); // Should not match - missing required segment structure

			// Test the actual pattern that would work
			trie.register(["api", "users", ":id?"], 2);

			result = trie.match(["api", "users"]);
			assert.equal(result.id, 2);
			assert.deepEqual(result.params, {});

			result = trie.match(["api", "users", "123"]);
			assert.equal(result.id, 2);
			assert.deepEqual(result.params, { id: "123" });
		});
	});
});
