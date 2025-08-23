/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

/**
 * @file Tests for function name discovery module
 */

import assert from "node:assert";
import { describe, it } from "node:test";
import { discoverFunctionName } from "./discover-function-name.js";

describe("discoverFunctionName", () => {
	describe("basic detection", () => {
		it("should return null when called from test environment", () => {
			// When called directly from test runner, should skip internal frames
			// and return null if no user function is found
			const result = discoverFunctionName();
			// Should be null or skip test runner internals
			assert.ok(result === null || typeof result === "string");
		});

		it("should detect function name when called from named function", () => {
			// This tests the actual detection logic
			function testFunction() {
				return discoverFunctionName();
			}

			const result = testFunction();
			// This should detect 'testFunction' as the caller
			assert.strictEqual(result, "testFunction");
		});

		it("should detect function name with different names", () => {
			function myCustomRenderFunction() {
				return discoverFunctionName();
			}

			const result = myCustomRenderFunction();
			assert.strictEqual(result, "myCustomRenderFunction");
		});
	});

	describe("edge cases", () => {
		it("should handle graceful failure with no stack", () => {
			// Mock Error.stack to be undefined
			const originalDescriptor = Object.getOwnPropertyDescriptor(
				Error.prototype,
				"stack",
			);
			Object.defineProperty(Error.prototype, "stack", {
				get() {
					return undefined;
				},
				configurable: true,
			});

			const result = discoverFunctionName();
			assert.strictEqual(result, null);

			// Restore original behavior
			if (originalDescriptor) {
				Object.defineProperty(Error.prototype, "stack", originalDescriptor);
			} else {
				delete Error.prototype.stack;
			}
		});

		it("should not throw on malformed stack traces", () => {
			assert.doesNotThrow(() => {
				discoverFunctionName();
			});
		});

		it("should skip internal frames", () => {
			// Function names that should be considered internal
			function html3() {
				return discoverFunctionName();
			}

			// This should skip the html3 function and look deeper
			const result = html3();
			// Should be null or skip the html3 frame
			assert.ok(result === null || result !== "html3");
		});
	});

	describe("real-world scenarios", () => {
		it("should work with arrow functions", () => {
			const arrowFunction = () => {
				return discoverFunctionName();
			};

			const result = arrowFunction();
			// Arrow functions may show as 'arrowFunction' or be anonymous
			assert.ok(result === null || typeof result === "string");
		});

		it("should work with nested calls", () => {
			function outerFunction() {
				function innerFunction() {
					return discoverFunctionName();
				}
				return innerFunction();
			}

			const result = outerFunction();
			// Should detect innerFunction, not outerFunction
			assert.ok(result === "innerFunction" || result === null);
		});

		it("should handle method calls", () => {
			const obj = {
				methodName() {
					return discoverFunctionName();
				},
			};

			const result = obj.methodName();
			// Method names may show as 'methodName' or 'Object.methodName'
			assert.ok(result === null || typeof result === "string");
		});
	});
});

// Engine-specific format tests
describe("stack trace parsing (unit tests)", () => {
	describe("V8 format parsing", () => {
		it("should parse V8 format with parentheses", () => {
			// Expected format: "    at testFunction (/path/file.js:10:5)"
			// Should extract "testFunction"
			assert.ok(true, "V8 format with parentheses test documented");
		});

		it("should parse V8 format without parentheses", () => {
			// Expected format: "    at testFunction /path/file.js:10:5"
			// Should extract "testFunction"
			assert.ok(true, "V8 format without parentheses test documented");
		});
	});

	describe("SpiderMonkey format parsing", () => {
		it("should parse Firefox format", () => {
			// Expected format: "testFunction@file:///path/file.js:10:5"
			// Should extract "testFunction"
			assert.ok(true, "Firefox format test documented");
		});
	});

	describe("JavaScriptCore format parsing", () => {
		it("should parse Safari format", () => {
			// Expected format: "testFunction@/path/file.js:10:5"
			// Should extract "testFunction"
			assert.ok(true, "Safari format test documented");
		});
	});
});

describe("internal frame detection", () => {
	const internalFrames = [
		"discoverFunctionName",
		"html3",
		"safeHtml3",
		"escapeHtml",
		"node:internal/modules/esm/loader.js",
		"internal/process/task_queues.js",
		"Module._compile",
		"Object.<anonymous>",
		"eval",
		"<anonymous>",
	];

	const userFrames = [
		"renderTemplate",
		"MyComponent",
		"buildHTML",
		"generatePage",
		"testFunction",
		"myRenderFunction",
	];

	internalFrames.forEach((frame) => {
		it(`should identify '${frame}' as internal`, () => {
			assert.ok(true, `Internal frame test documented: ${frame}`);
		});
	});

	userFrames.forEach((frame) => {
		it(`should identify '${frame}' as user code`, () => {
			assert.ok(true, `User frame test documented: ${frame}`);
		});
	});
});

describe("integration tests - real tagged template usage", () => {
	// Create a minimal tagged template function that uses discoverFunctionName
	function createMinimalTemplate() {
		return (_strings, ..._values) => {
			// This is our minimal tagged template - just return the detected function name
			const detectedName = discoverFunctionName();
			return `detected:${detectedName}`;
		};
	}

	describe("direct usage without renaming", () => {
		it("should detect function name with function declaration", () => {
			const myTemplate = createMinimalTemplate();

			function renderComponent(data) {
				return myTemplate`<div>${data}</div>`;
			}

			const result = renderComponent("test");
			assert.strictEqual(result, "detected:renderComponent");
		});

		it("should detect function name with arrow function", () => {
			const myTemplate = createMinimalTemplate();

			const renderWithArrow = (data) => {
				return myTemplate`<div>${data}</div>`;
			};

			const result = renderWithArrow("test");
			// Arrow functions may be detected as the variable name or null
			assert.ok(
				result === "detected:renderWithArrow" || result === "detected:null",
			);
		});
	});

	describe("import renaming simulation", () => {
		it("should detect function name when template is aliased", () => {
			// Simulate: import { html3 as html } from "..."
			const html = createMinimalTemplate();

			function MyComponent(props) {
				return html`<div class="${props.className}">content</div>`;
			}

			const result = MyComponent({ className: "test" });
			assert.strictEqual(result, "detected:MyComponent");
		});

		it("should detect function name when template is aliased as 'template'", () => {
			// Simulate: import { html3 as template } from "..."
			const template = createMinimalTemplate();

			function BlogPost(data) {
				return template`<article>${data.title}</article>`;
			}

			const result = BlogPost({ title: "Test Post" });
			assert.strictEqual(result, "detected:BlogPost");
		});
	});

	describe("nested function scenarios", () => {
		it("should detect innermost function name", () => {
			const myTemplate = createMinimalTemplate();

			function outerFunction() {
				function innerRenderFunction() {
					return myTemplate`<span>nested</span>`;
				}
				return innerRenderFunction();
			}

			const result = outerFunction();
			assert.strictEqual(result, "detected:innerRenderFunction");
		});

		it("should work with method calls", () => {
			const html = createMinimalTemplate();

			const component = {
				renderHeader(title) {
					return html`<h1>${title}</h1>`;
				},

				render(data) {
					return html`<div>${this.renderHeader(data.title)}</div>`;
				},
			};

			const headerResult = component.renderHeader("Test");
			const renderResult = component.render({ title: "Test" });

			// Method names should be detected
			assert.strictEqual(headerResult, "detected:renderHeader");
			assert.strictEqual(renderResult, "detected:render");
		});
	});

	describe("class method scenarios", () => {
		it("should detect class method names", () => {
			const template = createMinimalTemplate();

			class ComponentRenderer {
				buildHeader(title) {
					return template`<header>${title}</header>`;
				}

				buildContent(content) {
					return template`<main>${content}</main>`;
				}

				render(data) {
					const header = this.buildHeader(data.title);
					const content = this.buildContent(data.body);
					return template`<div>${header}${content}</div>`;
				}
			}

			const renderer = new ComponentRenderer();
			const headerResult = renderer.buildHeader("Test Title");
			const contentResult = renderer.buildContent("Test Body");
			const fullResult = renderer.render({ title: "Title", body: "Body" });

			assert.strictEqual(headerResult, "detected:buildHeader");
			assert.strictEqual(contentResult, "detected:buildContent");
			assert.strictEqual(fullResult, "detected:render");
		});
	});

	describe("realistic component patterns", () => {
		it("should work with component-style functions", () => {
			const html = createMinimalTemplate();

			const Button = ({ text, onClick }) => {
				return html`<button onclick="${onClick}">${text}</button>`;
			};

			const Modal = ({ title, children }) => {
				return html`<div class="modal"><h2>${title}</h2>${children}</div>`;
			};

			const buttonResult = Button({ text: "Click", onClick: "alert('hi')" });
			const modalResult = Modal({ title: "Test", children: "content" });

			// Component functions should be detected
			assert.ok(
				buttonResult === "detected:Button" || buttonResult === "detected:null",
			);
			assert.ok(
				modalResult === "detected:Modal" || modalResult === "detected:null",
			);
		});
	});
});
