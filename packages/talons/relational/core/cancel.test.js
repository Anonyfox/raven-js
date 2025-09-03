/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Test suite for cancellation utilities
 */

import { ok, rejects, strictEqual } from "node:assert";
import { describe, it } from "node:test";
import {
	createCancellationToken,
	createTimeoutController,
	isCancellationError,
	isTimeoutError,
	raceWithCancellation,
} from "./cancel.js";

describe("createCancellationToken", () => {
	it("creates token with signal and cancel function", () => {
		const { signal, cancel } = createCancellationToken();

		ok(signal instanceof AbortSignal);
		strictEqual(typeof cancel, "function");
		strictEqual(signal.aborted, false);

		cancel();
		strictEqual(signal.aborted, true);
	});
});

describe("raceWithCancellation", () => {
	it("resolves when promise completes first", async () => {
		const promise = Promise.resolve("success");
		const { signal } = createCancellationToken();

		const result = await raceWithCancellation(promise, signal);
		strictEqual(result, "success");
	});

	it("rejects when cancelled", async () => {
		const promise = new Promise(() => {}); // Never resolves
		const { signal, cancel } = createCancellationToken();

		setTimeout(() => cancel(), 10);

		await rejects(
			() => raceWithCancellation(promise, signal),
			(error) => isCancellationError(error),
		);
	});
});

describe("createTimeoutController", () => {
	it("creates timeout with specified duration", () => {
		const { signal, clear } = createTimeoutController(100);

		ok(signal instanceof AbortSignal);
		strictEqual(typeof clear, "function");
		strictEqual(signal.aborted, false);

		clear();
	});

	it("times out after specified duration", async () => {
		const { signal } = createTimeoutController(10);

		await new Promise((resolve) => setTimeout(resolve, 15));
		strictEqual(signal.aborted, true);
	});
});

describe("error detection", () => {
	it("identifies cancellation errors", () => {
		const { signal, cancel } = createCancellationToken();
		cancel();

		const error = new Error("Operation was cancelled");
		error.name = "AbortError";

		ok(isCancellationError(error));
		strictEqual(isTimeoutError(error), false);
	});

	it("identifies timeout errors", () => {
		const error = new Error("Operation timed out");
		error.name = "TimeoutError";

		ok(isTimeoutError(error));
		strictEqual(isCancellationError(error), false);
	});
});
