import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { error, info, print, success, warning } from "./output.js";

describe("print", () => {
	it("should be a function", () => {
		assert.equal(typeof print, "function");
	});

	it("should throw TypeError for non-string message", () => {
		assert.throws(() => print(null), {
			name: "TypeError",
			message: "Message must be a string",
		});

		assert.throws(() => print(123), {
			name: "TypeError",
			message: "Message must be a string",
		});

		assert.throws(() => print({}), {
			name: "TypeError",
			message: "Message must be a string",
		});
	});

	it("should not throw for string messages", () => {
		assert.doesNotThrow(() => print("test message"));
		assert.doesNotThrow(() => print(""));
	});
});

describe("success", () => {
	it("should be a function", () => {
		assert.equal(typeof success, "function");
	});

	it("should throw TypeError for non-string message", () => {
		assert.throws(() => success(null), {
			name: "TypeError",
			message: "Message must be a string",
		});

		assert.throws(() => success(123), {
			name: "TypeError",
			message: "Message must be a string",
		});
	});

	it("should not throw for string messages", () => {
		assert.doesNotThrow(() => success("success message"));
		assert.doesNotThrow(() => success(""));
	});
});

describe("error", () => {
	it("should be a function", () => {
		assert.equal(typeof error, "function");
	});

	it("should throw TypeError for non-string message", () => {
		assert.throws(() => error(null), {
			name: "TypeError",
			message: "Message must be a string",
		});

		assert.throws(() => error(123), {
			name: "TypeError",
			message: "Message must be a string",
		});
	});

	it("should not throw for string messages", () => {
		assert.doesNotThrow(() => error("error message"));
		assert.doesNotThrow(() => error(""));
	});
});

describe("warning", () => {
	it("should be a function", () => {
		assert.equal(typeof warning, "function");
	});

	it("should throw TypeError for non-string message", () => {
		assert.throws(() => warning(null), {
			name: "TypeError",
			message: "Message must be a string",
		});

		assert.throws(() => warning(123), {
			name: "TypeError",
			message: "Message must be a string",
		});
	});

	it("should not throw for string messages", () => {
		assert.doesNotThrow(() => warning("warning message"));
		assert.doesNotThrow(() => warning(""));
	});
});

describe("info", () => {
	it("should be a function", () => {
		assert.equal(typeof info, "function");
	});

	it("should throw TypeError for non-string message", () => {
		assert.throws(() => info(null), {
			name: "TypeError",
			message: "Message must be a string",
		});

		assert.throws(() => info(123), {
			name: "TypeError",
			message: "Message must be a string",
		});
	});

	it("should not throw for string messages", () => {
		assert.doesNotThrow(() => info("info message"));
		assert.doesNotThrow(() => info(""));
	});
});
