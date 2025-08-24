/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Test suite for compile function - surgical precision optimization testing
 *
 * Follows TEST DOCTRINE: Article I Surgical Architecture Mandate
 * 3 major test groups, maximum coverage through minimal assertions
 */

import { strict as assert } from "node:assert";
import { describe, test } from "node:test";
import { html } from "../../index.js";
import { compile } from "./index.js";

describe("compile - Core Optimization Engine", () => {
	test("should optimize templates through inline compilation with mathematical precision", () => {
		// MULTI-TARGET STRIKE: All successful compilation scenarios
		const optimizationPatterns = [
			// Static template
			{
				func: () => html`<div>static content</div>`,
				name: "static-template",
			},
			// Dynamic interpolation
			{
				func: (data) => html`<span>${data.value}</span>`,
				testData: { value: "test" },
				name: "dynamic-interpolation",
			},
			// Complex nested structure
			{
				func: (data) =>
					html`<article class="${data.active ? "active" : "inactive"}">${data.items
						.map((item) => html`<li>${item.name}</li>`)
						.join("")}</article>`,
				testData: {
					active: true,
					items: [{ name: "item1" }, { name: "item2" }],
				},
				name: "complex-nested",
			},
		];

		optimizationPatterns.forEach(({ func, testData, name }) => {
			const optimized = compile(func);

			// Verify function returned (optimization succeeded or graceful fallback)
			assert.strictEqual(
				typeof optimized,
				"function",
				`${name} should return function`,
			);

			// Verify output correctness
			const result = testData ? optimized(testData) : optimized();
			const expected = testData ? func(testData) : func();
			assert.strictEqual(
				result,
				expected,
				`${name} output must match original`,
			);
		});

		// Performance verification (< 1 second per Article V)
		const perfFunc = (data) =>
			html`<div class="${data.cls}">${data.text}</div>`;
		const start = performance.now();
		const perfOptimized = compile(perfFunc);

		// Multiple executions to ensure optimization stability
		for (let i = 0; i < 50; i++) {
			perfOptimized({ cls: "test", text: "content" });
		}
		const elapsed = performance.now() - start;
		assert.ok(
			elapsed < 1000,
			"Optimization performance must be under 1 second",
		);
	});
});

describe("compile - Error Resilience and Fallback", () => {
	test("should delegate to inline function for graceful error handling", () => {
		// SURGICAL ERROR VALIDATION: Verify compile delegates properly to inline's robust error handling

		// Error scenario #1: Function with malformed syntax - inline handles internally
		const malformedFunc = () => html`test`;
		malformedFunc.toString = () => "malformed_syntax_that_breaks_parsing";
		const malformedResult = compile(malformedFunc);
		assert.strictEqual(
			malformedResult,
			malformedFunc,
			"Should return original function via inline's fallback",
		);

		// Error scenario #2: Function with complex closure dependencies - inline detects and handles
		const closureVar = "closure_dependency";
		const closureFunc = (data) => html`<div>${data.value}-${closureVar}</div>`;
		const closureResult = compile(closureFunc);
		// Should return a function (inline's closure detection returns original)
		assert.strictEqual(
			closureResult,
			closureFunc,
			"Should return original for closure functions",
		);

		// Verify fallback functionality still works
		const testData = { value: "test" };
		const closureOutput = closureResult(testData);
		const expectedOutput = closureFunc(testData);
		assert.strictEqual(
			closureOutput,
			expectedOutput,
			"Original function must work correctly",
		);

		// Error scenario #3: Function that throws during toString() - inline handles gracefully
		const toStringErrorFunc = () => html`<span>test</span>`;
		toStringErrorFunc.toString = () => {
			throw new Error("toString() failure");
		};
		const toStringResult = compile(toStringErrorFunc);
		assert.strictEqual(
			toStringResult,
			toStringErrorFunc,
			"Should return original via inline's error handling",
		);

		// Error scenario #4: Optimization failures - inline provides fallback internally
		const complexFunc = (data) =>
			html`<div class="${data.complexLogic()}">${data.render()}</div>`;
		const complexResult = compile(complexFunc);
		assert.strictEqual(
			typeof complexResult,
			"function",
			"Should always return a function",
		);
		// inline() handles optimization failure internally and returns original or optimized version
		assert.ok(
			complexResult === complexFunc || typeof complexResult === "function",
			"Result must be valid function",
		);
	});
});

describe("compile - Edge Cases and Integration Scenarios", () => {
	test("should handle all boundary conditions and integration patterns with predatory precision", () => {
		// COMPREHENSIVE EDGE CASE BATTERY: All boundary conditions in minimal assertions

		// Edge case #1: Empty/minimal functions
		const emptyFunc = () => html``;
		const emptyResult = compile(emptyFunc);
		assert.strictEqual(
			typeof emptyResult,
			"function",
			"Should handle empty templates",
		);
		assert.strictEqual(
			emptyResult(),
			emptyFunc(),
			"Empty template output must match",
		);

		// Edge case #2: Functions without tagged templates
		const noTemplateFunc = (data) => data.value;
		const noTemplateResult = compile(noTemplateFunc);
		assert.strictEqual(
			noTemplateResult,
			noTemplateFunc,
			"Should return original for non-template functions",
		);

		// Edge case #3: Anonymous functions
		// biome-ignore lint/complexity/useArrowFunction: Need regular function to test anonymous function handling
		const anonFunc = function (data) {
			return html`<p>${data.text}</p>`;
		};
		Object.defineProperty(anonFunc, "name", { value: "" });
		const anonResult = compile(anonFunc);
		assert.strictEqual(
			typeof anonResult,
			"function",
			"Should handle anonymous functions",
		);
		const anonOutput = anonResult({ text: "test" });
		const anonExpected = anonFunc({ text: "test" });
		assert.strictEqual(
			anonOutput,
			anonExpected,
			"Anonymous function output must match",
		);

		// Edge case #4: Complex parameter scenarios
		const complexParamsFunc = (data, options = {}, ...rest) => {
			const { prefix = "" } = options;
			return html`<div>${prefix}${data.value}${rest.join("")}</div>`;
		};
		const complexParamsResult = compile(complexParamsFunc);
		const complexOutput = complexParamsResult(
			{ value: "test" },
			{ prefix: "[" },
			"suffix",
		);
		const complexExpected = complexParamsFunc(
			{ value: "test" },
			{ prefix: "[" },
			"suffix",
		);
		assert.strictEqual(
			complexOutput,
			complexExpected,
			"Complex parameters must be handled correctly",
		);

		// Edge case #5: Integration with real HTML structures
		const integrationFunc = (post) => html`
			<article class="post ${post.featured ? "featured" : ""}" data-id="${post.id}">
				<header>
					<h1>${post.title}</h1>
					<time>${post.date}</time>
				</header>
				<div class="content">${post.content}</div>
				<footer>
					${post.tags.map((tag) => html`<span class="tag">${tag}</span>`).join("")}
				</footer>
			</article>
		`;
		const integrationResult = compile(integrationFunc);
		const testPost = {
			id: "123",
			title: "Test Post",
			date: "2024-01-01",
			content: "Post content",
			featured: true,
			tags: ["javascript", "testing"],
		};
		const integrationOutput = integrationResult(testPost);
		const integrationExpected = integrationFunc(testPost);
		assert.strictEqual(
			integrationOutput,
			integrationExpected,
			"Real-world integration must work perfectly",
		);

		// Final performance validation for entire edge case suite
		const edgeStart = performance.now();

		// Execute all edge cases multiple times to ensure stability
		for (let i = 0; i < 10; i++) {
			emptyResult();
			noTemplateResult({ value: "test" });
			anonResult({ text: "test" });
			complexParamsResult({ value: "test" }, {}, "extra");
			integrationResult(testPost);
		}

		const edgeElapsed = performance.now() - edgeStart;
		assert.ok(edgeElapsed < 1000, "Edge case execution must be under 1 second");
	});
});
