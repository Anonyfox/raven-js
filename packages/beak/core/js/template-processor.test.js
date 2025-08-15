import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { processJSTemplate } from "./template-processor.js";

describe("processJSTemplate", () => {
	describe("basic template processing", () => {
		it("should handle empty template", () => {
			const result = processJSTemplate``;
			assert.equal(result, "");
		});

		it("should handle template with no values", () => {
			const result = processJSTemplate`console.log("hello");`;
			assert.equal(result, 'console.log("hello");');
		});

		it("should handle single value interpolation", () => {
			const variableName = "count";
			const result = processJSTemplate`let ${variableName} = 10;`;
			assert.equal(result, "let count = 10;");
		});

		it("should handle multiple value interpolation", () => {
			const var1 = "x";
			const var2 = "y";
			const result = processJSTemplate`let ${var1} = 1, ${var2} = 2;`;
			assert.equal(result, "let x = 1, y = 2;");
		});

		it("should handle value at the beginning", () => {
			const value = "const";
			const result = processJSTemplate`${value} PI = 3.14;`;
			assert.equal(result, "const PI = 3.14;");
		});

		it("should handle value at the end", () => {
			const value = "world";
			const result = processJSTemplate`console.log("hello ${value}");`;
			assert.equal(result, 'console.log("hello world");');
		});
	});

	describe("value validation", () => {
		it("should include zero as valid value", () => {
			const result = processJSTemplate`count: ${0}`;
			assert.equal(result, "count: 0");
		});

		it("should include truthy values", () => {
			const result = processJSTemplate`${1} ${"hello"} ${true}`;
			assert.equal(result, "1 hello true");
		});

		it("should filter out null values", () => {
			const result = processJSTemplate`${null}valid${null}`;
			assert.equal(result, "valid");
		});

		it("should filter out undefined values", () => {
			const result = processJSTemplate`${undefined}valid${undefined}`;
			assert.equal(result, "valid");
		});

		it("should filter out false values", () => {
			const result = processJSTemplate`${false}valid${false}`;
			assert.equal(result, "valid");
		});

		it("should filter out empty strings", () => {
			const result = processJSTemplate`${""}valid${""}`;
			assert.equal(result, "valid");
		});

		it("should handle mixed valid and invalid values", () => {
			const result = processJSTemplate`${null}${"hello"}${undefined}${0}${false}`;
			assert.equal(result, "hello0");
		});
	});

	describe("array handling", () => {
		it("should join array values with empty string", () => {
			const array = ["a", "b", "c"];
			const result = processJSTemplate`${array}`;
			assert.equal(result, "abc");
		});

		it("should handle empty arrays", () => {
			const emptyArray = [];
			const result = processJSTemplate`${emptyArray}`;
			assert.equal(result, "");
		});

		it("should handle arrays with single element", () => {
			const singleElement = ["hello"];
			const result = processJSTemplate`${singleElement}`;
			assert.equal(result, "hello");
		});

		it("should handle mixed arrays and strings", () => {
			const array = ["a", "b"];
			const string = "hello";
			const result = processJSTemplate`${array}${string}`;
			assert.equal(result, "abhello");
		});

		it("should handle nested arrays", () => {
			const nestedArray = [
				["a", "b"],
				["c", "d"],
			];
			const result = processJSTemplate`${nestedArray}`;
			assert.equal(result, "a,bc,d");
		});

		it("should handle arrays with null/undefined elements", () => {
			const array = ["a", null, "b", undefined, "c"];
			const result = processJSTemplate`${array}`;
			assert.equal(result, "abc");
		});
	});

	describe("complex JavaScript structures", () => {
		it("should handle variable declarations", () => {
			const varName = "user";
			const varValue = "John";
			const result = processJSTemplate`let ${varName} = "${varValue}";`;
			assert.equal(result, 'let user = "John";');
		});

		it("should handle function calls", () => {
			const funcName = "calculate";
			const arg1 = "x";
			const arg2 = "y";
			const result = processJSTemplate`${funcName}(${arg1}, ${arg2});`;
			assert.equal(result, "calculate(x, y);");
		});

		it("should handle object properties", () => {
			const objName = "config";
			const propName = "apiUrl";
			const propValue = "https://api.example.com";
			const result = processJSTemplate`${objName}.${propName} = "${propValue}";`;
			assert.equal(result, 'config.apiUrl = "https://api.example.com";');
		});

		it("should handle conditional expressions", () => {
			const condition = "isLoggedIn";
			const trueValue = "user";
			const falseValue = "guest";
			const result = processJSTemplate`const role = ${condition} ? "${trueValue}" : "${falseValue}";`;
			assert.equal(result, 'const role = isLoggedIn ? "user" : "guest";');
		});

		it("should handle template literals within template literals", () => {
			const innerVar = "name";
			const outerVar = "greeting";
			const result = processJSTemplate`const ${outerVar} = \`Hello ${innerVar}!\`;`;
			assert.equal(result, "const greeting = `Hello name!`;");
		});
	});

	describe("edge cases", () => {
		it("should handle numbers", () => {
			const result = processJSTemplate`const num = ${42}; const float = ${3.14};`;
			assert.equal(result, "const num = 42; const float = 3.14;");
		});

		it("should handle booleans", () => {
			const result = processJSTemplate`const flag = ${true}; const disabled = ${false};`;
			assert.equal(result, "const flag = true; const disabled = ;");
		});

		it("should handle objects (converted to string)", () => {
			const obj = { key: "value" };
			const result = processJSTemplate`const data = ${obj};`;
			assert.equal(result, "const data = [object Object];");
		});

		it("should handle functions (converted to string)", () => {
			const func = () => "test";
			const result = processJSTemplate`const handler = ${func};`;
			assert.equal(result, 'const handler = () => "test";');
		});

		it("should handle symbols", () => {
			const sym = Symbol("test");
			const result = processJSTemplate`const symbol = ${sym};`;
			assert.equal(result, "const symbol = Symbol(test);");
		});

		it("should handle bigints", () => {
			const bigInt = 123n;
			const result = processJSTemplate`const big = ${bigInt};`;
			assert.equal(result, "const big = 123;");
		});
	});

	describe("whitespace handling", () => {
		it("should trim leading and trailing whitespace", () => {
			const result = processJSTemplate`
				const message = "hello";
			`;
			assert.equal(result, 'const message = "hello";');
		});

		it("should preserve internal whitespace", () => {
			const result = processJSTemplate`const obj = { name: "John", age: 30 };`;
			assert.equal(result, 'const obj = { name: "John", age: 30 };');
		});

		it("should handle multiple lines", () => {
			const result = processJSTemplate`
				function greet(name) {
					return \`Hello \${name}!\`;
				}
			`;
			assert.equal(
				result,
				`function greet(name) {\n\t\t\t\t\treturn \`Hello \${name}!\`;\n\t\t\t\t}`,
			);
		});
	});

	describe("advanced scenarios", () => {
		it("should handle dynamic property access", () => {
			const objName = "user";
			const propName = "name";
			const result = processJSTemplate`const value = ${objName}[${propName}];`;
			assert.equal(result, "const value = user[name];");
		});

		it("should handle array methods", () => {
			const arrayName = "items";
			const methodName = "map";
			const result = processJSTemplate`const result = ${arrayName}.${methodName}(item => item.id);`;
			assert.equal(result, "const result = items.map(item => item.id);");
		});

		it("should handle mathematical expressions", () => {
			const a = 10;
			const b = 5;
			const result = processJSTemplate`const sum = ${a} + ${b}; const product = ${a} * ${b};`;
			assert.equal(result, "const sum = 10 + 5; const product = 10 * 5;");
		});

		it("should handle logical operators", () => {
			const condition1 = "isAdmin";
			const condition2 = "hasPermission";
			const result = processJSTemplate`const canEdit = ${condition1} && ${condition2};`;
			assert.equal(result, "const canEdit = isAdmin && hasPermission;");
		});

		it("should handle ternary operators", () => {
			const condition = "isDark";
			const trueValue = "dark";
			const falseValue = "light";
			const result = processJSTemplate`const theme = ${condition} ? "${trueValue}" : "${falseValue}";`;
			assert.equal(result, 'const theme = isDark ? "dark" : "light";');
		});
	});

	describe("performance edge cases", () => {
		it("should handle very long strings", () => {
			const longString = "x".repeat(1000);
			const result = processJSTemplate`const data = "${longString}";`;
			assert.equal(result, `const data = "${longString}";`);
		});

		it("should handle many values", () => {
			const values = Array(100).fill("value");
			const result = processJSTemplate`${values.join("; ")};`;
			assert.equal(result, `${values.join("; ")};`);
		});

		it("should handle large arrays", () => {
			const largeArray = Array(100).fill("item");
			const result = processJSTemplate`const items = [${largeArray}];`;
			assert.equal(result, `const items = [${largeArray.join("")}];`);
		});

		it("should handle very deep nested arrays", () => {
			let deepArray = ["deepest"];
			for (let i = 0; i < 100; i++) {
				deepArray = [deepArray];
			}
			const result = processJSTemplate`const depth = ${deepArray};`;
			assert.equal(result, "const depth = deepest;");
		});
	});

	describe("real-world scenarios", () => {
		it("should handle API configuration", () => {
			const baseUrl = "https://api.example.com";
			const version = "v1";
			const endpoint = "users";
			const result = processJSTemplate`
				const apiConfig = {
					baseUrl: "${baseUrl}",
					version: "${version}",
					endpoints: {
						users: "${endpoint}"
					}
				};
			`;
			assert.equal(
				result,
				'const apiConfig = {\n\t\t\t\t\tbaseUrl: "https://api.example.com",\n\t\t\t\t\tversion: "v1",\n\t\t\t\t\tendpoints: {\n\t\t\t\t\t\tusers: "users"\n\t\t\t\t\t}\n\t\t\t\t};',
			);
		});

		it("should handle dynamic imports", () => {
			const moduleName = "lodash";
			const methodName = "debounce";
			const result = processJSTemplate`import { ${methodName} } from "${moduleName}";`;
			assert.equal(result, 'import { debounce } from "lodash";');
		});

		it("should handle event handlers", () => {
			const eventName = "click";
			const handlerName = "handleClick";
			const result = processJSTemplate`element.addEventListener("${eventName}", ${handlerName});`;
			assert.equal(result, 'element.addEventListener("click", handleClick);');
		});

		it("should handle class definitions", () => {
			const className = "User";
			const propName = "name";
			const result = processJSTemplate`
				class ${className} {
					constructor(${propName}) {
						this.${propName} = ${propName};
					}
				}
			`;
			assert.equal(
				result,
				"class User {\n\t\t\t\t\tconstructor(name) {\n\t\t\t\t\t\tthis.name = name;\n\t\t\t\t\t}\n\t\t\t\t}",
			);
		});

		it("should handle async/await patterns", () => {
			const funcName = "fetchData";
			const url = "https://api.example.com/data";
			const result = processJSTemplate`
				async function ${funcName}() {
					const response = await fetch("${url}");
					return response.json();
				}
			`;
			assert.equal(
				result,
				'async function fetchData() {\n\t\t\t\t\tconst response = await fetch("https://api.example.com/data");\n\t\t\t\t\treturn response.json();\n\t\t\t\t}',
			);
		});
	});
});
