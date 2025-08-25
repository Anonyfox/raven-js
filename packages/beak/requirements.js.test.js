/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { js, script, scriptAsync, scriptDefer } from "./js/index.js";

/**
 * @file Comprehensive integration tests for JavaScript template literals.
 *
 * These tests express the expected behavior and edge cases from a seasoned
 * senior JavaScript developer perspective, covering real-world usage patterns,
 * performance optimization paths, and security considerations.
 */

describe("JavaScript Template Literal Integration Tests", () => {
	describe("Core js() Template Processing", () => {
		describe("Value Filtering and Truthiness", () => {
			it("preserves zero as valid value", () => {
				assert.equal(js`count: ${0}`, "count: 0");
				assert.equal(js`${0}${0}${0}`, "000");
			});

			it("filters out all falsy values except zero", () => {
				assert.equal(js`${null}`, "");
				assert.equal(js`${undefined}`, "");
				assert.equal(js`${false}`, "");
				assert.equal(js`${""}`, "");
				assert.equal(js`${NaN}`, ""); // NaN is falsy
			});

			it("preserves all truthy values", () => {
				assert.equal(js`${1}`, "1");
				assert.equal(js`${"text"}`, "text");
				assert.equal(js`${true}`, "true");
				assert.equal(js`${[]}`, ""); // empty array stringifies to ""
				assert.equal(js`${{}}`, "[object Object]");
				assert.equal(js`${() => {}}`, "() => {}");
			});

			it("handles mixed truthy and falsy values correctly", () => {
				assert.equal(js`${null}${0}${false}${1}${undefined}${"ok"}`, "01ok");
				assert.equal(js`start${null}middle${0}end`, "startmiddle0end");
			});
		});

		describe("Array Handling and Flattening", () => {
			it("flattens arrays to concatenated strings", () => {
				assert.equal(js`${[1, 2, 3]}`, "123");
				assert.equal(js`${["a", "b", "c"]}`, "abc");
				assert.equal(js`${[]}`, "");
			});

			it("flattens nested arrays correctly", () => {
				assert.equal(js`${[[1, 2], [3, 4]]}`, "1,23,4");
				assert.equal(js`${[[[1]], [[2]]]}`, "12");
			});

			it("handles arrays with mixed types", () => {
				assert.equal(js`${[1, "text", true, null]}`, "1texttrue");
				assert.equal(js`${[0, false, "", undefined]}`, "0false");
			});

			it("processes arrays with objects and functions", () => {
				assert.equal(js`${[{}, () => {}]}`, "[object Object]() => {}");
			});
		});

		describe("String Processing and Whitespace", () => {
			it("trims leading and trailing whitespace", () => {
				assert.equal(js`   content   `, "content");
				assert.equal(js`\t\n  text  \n\t`, "text");
			});

			it("preserves internal whitespace", () => {
				assert.equal(js`word   another    word`, "word   another    word");
				assert.equal(js`${1}  ${2}  ${3}`, "1  2  3");
			});

			it("handles whitespace with filtered values", () => {
				assert.equal(js`  ${null}  content  ${false}  `, "content");
				assert.equal(js`\n${undefined}\tcontent\r\n`, "content");
			});
		});

		describe("Performance Path Optimization", () => {
			it("handles zero values (fast path)", () => {
				assert.equal(js`static only content`, "static only content");
				assert.equal(js`  static with whitespace  `, "static with whitespace");
			});

			it("handles single value (optimized path)", () => {
				assert.equal(js`prefix ${42} suffix`, "prefix 42 suffix");
				assert.equal(js`${null}static`, "static");
				assert.equal(js`static${undefined}`, "static");
			});

			it("handles 2-3 values (StringBuilder pattern)", () => {
				assert.equal(js`${1} ${2}`, "1 2");
				assert.equal(js`${1} ${2} ${3}`, "1 2 3");
				assert.equal(
					js`prefix ${1} middle ${2} suffix`,
					"prefix 1 middle 2 suffix",
				);
			});

			it("handles 4+ values (pre-allocated array)", () => {
				assert.equal(js`${1} ${2} ${3} ${4}`, "1 2 3 4");
				assert.equal(js`${1} ${2} ${3} ${4} ${5} ${6}`, "1 2 3 4 5 6");
			});

			it("optimizes filtered values in pre-allocation", () => {
				// Should only allocate space for valid values
				assert.equal(js`${1}${null}${2}${false}${3}${undefined}${4}`, "1234");
			});
		});

		describe("Real-World JavaScript Generation Scenarios", () => {
			it("generates variable declarations", () => {
				const varName = "userCount";
				const value = 42;
				assert.equal(js`const ${varName} = ${value};`, "const userCount = 42;");
				assert.equal(js`let ${varName};`, "let userCount;");
			});

			it("generates function calls", () => {
				const fnName = "getData";
				const args = ["'users'", 100, true];
				assert.equal(js`${fnName}(${args});`, "getData('users'100true);");
			});

			it("generates object literals", () => {
				const key = "userId";
				const value = 123;
				assert.equal(js`{ ${key}: ${value} }`, "{ userId: 123 }");
			});

			it("generates conditional logic", () => {
				const condition = "user.isActive";
				const trueValue = "'enabled'";
				const falseValue = "'disabled'";
				assert.equal(
					js`const status = ${condition} ? ${trueValue} : ${falseValue};`,
					"const status = user.isActive ? 'enabled' : 'disabled';",
				);
			});

			it("generates configuration objects", () => {
				const config = { apiUrl: "https://api.example.com", timeout: 5000 };
				assert.equal(
					js`window.config = ${config};`,
					"window.config = [object Object];",
				);
			});

			it("generates event handlers", () => {
				const elementId = "'submitBtn'";
				const handler = "handleSubmit";
				assert.equal(
					js`document.getElementById(${elementId}).onclick = ${handler};`,
					"document.getElementById('submitBtn').onclick = handleSubmit;",
				);
			});
		});

		describe("Edge Cases and Error Conditions", () => {
			it("handles empty template", () => {
				assert.equal(js``, "");
			});

			it("handles template with only whitespace", () => {
				assert.equal(js`   \t\n   `, "");
			});

			it("handles special JavaScript characters", () => {
				assert.equal(js`"quotes"`, '"quotes"');
				assert.equal(js`'single quotes'`, "'single quotes'");
				assert.equal(js`\`backticks\``, "`backticks`");
				assert.equal(js`${"`template literal`"}`, "`template literal`");
			});

			it("handles numeric edge cases", () => {
				assert.equal(js`${Infinity}`, "Infinity");
				assert.equal(js`${-Infinity}`, "-Infinity");
				assert.equal(js`${Number.MAX_SAFE_INTEGER}`, "9007199254740991");
				assert.equal(js`${Number.MIN_SAFE_INTEGER}`, "-9007199254740991");
			});

			it("handles symbol values", () => {
				const sym = Symbol("test");
				assert.equal(js`${sym}`, "Symbol(test)");
			});

			it("handles bigint values", () => {
				const bigNum = 123n;
				assert.equal(js`${bigNum}`, "123");
			});

			it("handles date objects", () => {
				const date = new Date("2024-01-01");
				assert.equal(js`${date}`, date.toString());
			});

			it("handles regex objects", () => {
				const regex = /test/gi;
				assert.equal(js`${regex}`, "/test/gi");
			});
		});

		describe("Complex Integration Scenarios", () => {
			it("generates complex JavaScript modules", () => {
				const moduleName = "UserService";
				const dependencies = ["'./api.js'", "'./utils.js'"];
				const methods = ["init", "getUserById", "updateUser"];

				const result = js`
					import { ${dependencies} } from './deps.js';

					class ${moduleName} {
						${methods.map((m) => `${m}() {}`)}
					}

					export default ${moduleName};
				`;

				const expected = `import { './api.js''./utils.js' } from './deps.js';

					class UserService {
						init() {}getUserById() {}updateUser() {}
					}

					export default UserService;`;

				assert.equal(result, expected);
			});

			it("generates dynamic API client", () => {
				const baseUrl = "'https://api.example.com'";
				const endpoints = ["users", "posts", "comments"];
				const apiKey = "'abc123'";

				const result = js`
					const API_BASE = ${baseUrl};
					const ENDPOINTS = [${endpoints}];
					const API_KEY = ${apiKey};

					const client = {
						${endpoints}: (id) => fetch(\`\${API_BASE}/${endpoints[0]}/\${id}?key=\${API_KEY}\`)
					};
				`;

				// Should handle complex nesting and array flattening
				assert.ok(result.includes("API_BASE = 'https://api.example.com'"));
				assert.ok(result.includes("ENDPOINTS = [userspostscomments]"));
				assert.ok(result.includes("API_KEY = 'abc123'"));
			});

			it("generates event listener setup", () => {
				const events = ["click", "mouseover", "keydown"];
				const element = "document";

				const result = js`
					${events}.forEach(event => {
						${element}.addEventListener(event, (e) => {
							console.log(\`Event: \${event}\`, e);
						});
					});
				`;

				assert.ok(result.includes("clickmouseoverkeydown"));
				assert.ok(result.includes("document.addEventListener"));
			});
		});

		describe("Security and Injection Prevention", () => {
			it("does not provide XSS protection by default", () => {
				const userInput = "<script>alert('xss')</script>";
				const result = js`const content = "${userInput}";`;
				// js() template does not escape - this is expected behavior
				assert.equal(
					result,
					`const content = "<script>alert('xss')</script>";`,
				);
			});

			it("handles potentially dangerous input", () => {
				const malicious = "'; DROP TABLE users; --";
				assert.equal(
					js`const query = '${malicious}'`,
					`const query = ''; DROP TABLE users; --'`,
				);
			});

			it("preserves JavaScript syntax characters", () => {
				const code = "() => { return 'test'; }";
				assert.equal(
					js`const fn = ${code}`,
					`const fn = () => { return 'test'; }`,
				);
			});
		});
	});

	describe("Script Tag Variants", () => {
		describe("script() - Basic Script Tags", () => {
			it("wraps simple JavaScript in script tags", () => {
				const result = script`console.log('Hello World');`;
				assert.equal(
					result,
					`<script type="text/javascript">console.log('Hello World');</script>`,
				);
			});

			it("handles dynamic content in script tags", () => {
				const config = { debug: true };
				const result = script`window.config = ${config};`;
				assert.equal(
					result,
					`<script type="text/javascript">window.config = [object Object];</script>`,
				);
			});

			it("filters falsy values in script content", () => {
				const result = script`${null}console.log('test');${false}`;
				assert.equal(
					result,
					`<script type="text/javascript">console.log('test');</script>`,
				);
			});

			it("handles empty script tags", () => {
				const result = script``;
				assert.equal(result, `<script type="text/javascript"></script>`);
			});

			it("handles whitespace in script content", () => {
				const result = script`   console.log('test');   `;
				assert.equal(
					result,
					`<script type="text/javascript">console.log('test');</script>`,
				);
			});
		});

		describe("scriptDefer() - Deferred Script Tags", () => {
			it("wraps JavaScript with defer attribute", () => {
				const result = scriptDefer`document.getElementById('app').focus();`;
				assert.equal(
					result,
					`<script type="text/javascript" defer>document.getElementById('app').focus();</script>`,
				);
			});

			it("handles DOM manipulation code with defer", () => {
				const elementId = "'main'";
				const result = scriptDefer`document.getElementById(${elementId}).classList.add('loaded');`;
				assert.equal(
					result,
					`<script type="text/javascript" defer>document.getElementById('main').classList.add('loaded');</script>`,
				);
			});

			it("filters values in deferred scripts", () => {
				const result = scriptDefer`${null}setupUI();${false}`;
				assert.equal(
					result,
					`<script type="text/javascript" defer>setupUI();</script>`,
				);
			});

			it("handles complex DOM operations", () => {
				const selectors = ["'.btn'", "'.modal'", "'.nav'"];
				const result = scriptDefer`
					[${selectors}].forEach(sel => {
						document.querySelector(sel).style.display = 'block';
					});
				`;

				assert.ok(result.includes("defer>"));
				assert.ok(result.includes("'.btn''.modal''.nav'"));
			});
		});

		describe("scriptAsync() - Async Script Tags", () => {
			it("wraps JavaScript with async attribute", () => {
				const result = scriptAsync`fetch('/analytics', { method: 'POST' });`;
				assert.equal(
					result,
					`<script type="text/javascript" async>fetch('/analytics', { method: 'POST' });</script>`,
				);
			});

			it("handles tracking and analytics code", () => {
				const trackingId = "'GA-123456'";
				const result = scriptAsync`
					gtag('config', ${trackingId}, {
						page_title: document.title
					});
				`;

				assert.ok(result.includes("async>"));
				assert.ok(result.includes("'GA-123456'"));
			});

			it("handles dynamic API calls", () => {
				const endpoint = "'https://api.example.com/track'";
				const data = { userId: 123, action: "click" };
				const result = scriptAsync`
					fetch(${endpoint}, {
						method: 'POST',
						body: JSON.stringify(${data})
					});
				`;

				assert.ok(result.includes("async>"));
				assert.ok(result.includes("'https://api.example.com/track'"));
				assert.ok(result.includes("[object Object]"));
			});

			it("filters values in async scripts", () => {
				const result = scriptAsync`${null}sendAnalytics();${false}`;
				assert.equal(
					result,
					`<script type="text/javascript" async>sendAnalytics();</script>`,
				);
			});
		});

		describe("Script Tag Integration Scenarios", () => {
			it("generates initialization script", () => {
				const appName = "'MyApp'";
				const version = "'1.0.0'";
				const result = script`
					window.${appName} = {
						version: ${version},
						init: function() {
							console.log('App initialized');
						}
					};
					window.${appName}.init();
				`;

				assert.ok(result.includes('<script type="text/javascript">'));
				assert.ok(result.includes("window.'MyApp'"));
				assert.ok(result.includes("version: '1.0.0'"));
			});

			it("generates progressive enhancement script", () => {
				const features = ["'touch'", "'geolocation'", "'localStorage'"];
				const result = scriptDefer`
					const supported = [${features}].filter(feature =>
						feature in window || feature in navigator
					);
					document.body.className += ' ' + supported.join(' ');
				`;

				assert.ok(result.includes("defer>"));
				assert.ok(result.includes("'touch''geolocation''localStorage'"));
			});

			it("generates analytics tracking script", () => {
				const events = ["'pageview'", "'click'", "'scroll'"];
				const result = scriptAsync`
					${events}.forEach(eventType => {
						document.addEventListener(eventType.slice(1, -1), (e) => {
							fetch('/analytics', {
								method: 'POST',
								body: JSON.stringify({
									event: eventType,
									timestamp: Date.now()
								})
							});
						});
					});
				`;

				assert.ok(result.includes("async>"));
				assert.ok(result.includes("'pageview''click''scroll'"));
			});
		});

		describe("Script Tag Edge Cases", () => {
			it("handles special characters in script content", () => {
				const result = script`alert("Hello 'World' & Universe");`;
				assert.equal(
					result,
					'<script type="text/javascript">alert("Hello \'World\' & Universe");</script>',
				);
			});

			it("handles template literals within script content", () => {
				const name = "'World'";
				const result = script`console.log(\`Hello \${${name}}\`);`;
				assert.equal(
					result,
					`<script type="text/javascript">console.log(\`Hello \${'World'}\`);</script>`,
				);
			});

			it("handles multiline script content", () => {
				const result = script`
					function init() {
						console.log('Starting app...');
						return true;
					}
					init();
				`;

				assert.ok(result.includes('<script type="text/javascript">'));
				assert.ok(result.includes("function init()"));
				assert.ok(result.includes("</script>"));
			});

			it("handles nested script-like content", () => {
				const htmlContent = "'<script>alert(\"nested\")</script>'";
				const result = script`document.innerHTML = ${htmlContent};`;
				assert.ok(result.includes('<script type="text/javascript">'));
				assert.ok(result.includes("'<script>alert(\"nested\")</script>'"));
				assert.ok(result.includes("</script>"));
			});
		});
	});

	describe("Performance and Memory Characteristics", () => {
		it("handles large number of values efficiently", () => {
			const values = Array.from({ length: 100 }, (_, i) => i);
			const template = js`prefix ${values[0]} ${values[1]} ${values[2]} ${values[3]} ${values[4]} suffix`;
			assert.equal(template, "prefix 0 1 2 3 4 suffix");
		});

		it("processes complex arrays without excessive memory allocation", () => {
			const largeArray = Array.from({ length: 1000 }, (_, i) => i);
			const result = js`data: ${largeArray}`;
			assert.ok(result.startsWith("data: 01234"));
			assert.ok(result.endsWith("999"));
		});

		it("handles deeply nested template calls", () => {
			const inner = js`inner${1}`;
			const middle = js`middle${inner}${2}`;
			const outer = js`outer${middle}${3}`;
			assert.equal(outer, "outermiddleinner123");
		});
	});

	describe("Type Safety and Developer Experience", () => {
		it("maintains consistent return types", () => {
			assert.equal(typeof js``, "string");
			assert.equal(typeof js`${123}`, "string");
			assert.equal(typeof script``, "string");
			assert.equal(typeof scriptDefer``, "string");
			assert.equal(typeof scriptAsync``, "string");
		});

		it("handles undefined behavior consistently", () => {
			// All should filter undefined to empty string
			assert.equal(js`${undefined}`, "");
			assert.equal(
				script`${undefined}`,
				'<script type="text/javascript"></script>',
			);
			assert.equal(
				scriptDefer`${undefined}`,
				'<script type="text/javascript" defer></script>',
			);
			assert.equal(
				scriptAsync`${undefined}`,
				'<script type="text/javascript" async></script>',
			);
		});
	});
});
