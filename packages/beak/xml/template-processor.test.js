/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { processXmlTemplate } from "./template-processor.js";

describe("XML template processor", () => {
	describe("optimization tiers", () => {
		it("tier 0: static-only templates", () => {
			const strings = ["<config/>"];
			assert.equal(processXmlTemplate(strings), "<config/>");

			const stringsWithWhitespace = ["  <config/>  "];
			assert.equal(processXmlTemplate(stringsWithWhitespace), "<config/>");
		});

		it("tier 1: single interpolation", () => {
			const strings = ["<host>", "</host>"];
			assert.equal(
				processXmlTemplate(strings, "localhost"),
				"<host>localhost</host>",
			);

			const stringsWithWhitespace = ["  <host>", "</host>  "];
			assert.equal(
				processXmlTemplate(stringsWithWhitespace, "localhost"),
				"<host>localhost</host>",
			);
		});

		it("tier 2: few interpolations (2-3 values)", () => {
			const strings = ['<db host="', '" port="', '"/>'];
			assert.equal(
				processXmlTemplate(strings, "localhost", "3306"),
				'<db host="localhost" port="3306"/>',
			);

			const strings3 = ['<server host="', '" port="', '" name="', '"/>'];
			assert.equal(
				processXmlTemplate(strings3, "localhost", "8080", "app-server"),
				'<server host="localhost" port="8080" name="app-server"/>',
			);
		});

		it("tier 3: many interpolations (4+ values)", () => {
			const strings = [
				'<config host="',
				'" port="',
				'" user="',
				'" db="',
				'" ssl="',
				'"/>',
			];
			assert.equal(
				processXmlTemplate(
					strings,
					"localhost",
					"3306",
					"admin",
					"myapp",
					"true",
				),
				'<config host="localhost" port="3306" user="admin" db="myapp" ssl="true"/>',
			);
		});
	});

	describe("value processing", () => {
		it("handles primitives", () => {
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], "test"),
				"<val>test</val>",
			);
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], 123),
				"<val>123</val>",
			);
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], true),
				"<val>true</val>",
			);
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], false),
				"<val></val>",
			);
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], null),
				"<val></val>",
			);
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], undefined),
				"<val></val>",
			);
		});

		it("preserves string values (trusted mode)", () => {
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], "test & value"),
				"<val>test & value</val>",
			);
			assert.equal(
				processXmlTemplate(["<val>", "</val>"], "<script>"),
				"<val><script></val>",
			);
		});

		it("processes arrays as concatenated", () => {
			assert.equal(
				processXmlTemplate(["<elements>", "</elements>"], ["<a/>", "<b/>"]),
				"<elements><a/><b/></elements>",
			);
			assert.equal(
				processXmlTemplate(["<empty>", "</empty>"], []),
				"<empty></empty>",
			);
			assert.equal(
				processXmlTemplate(
					["<filtered>", "</filtered>"],
					["keep", null, false, "this"],
				),
				"<filtered>keepthis</filtered>",
			);
		});

		it("converts objects to attributes", () => {
			const obj = { host: "localhost", port: 3306 };
			assert.equal(
				processXmlTemplate(["<server ", "/>"], obj),
				'<server host="localhost" port="3306"/>',
			);

			const camelCase = { bindHost: "0.0.0.0", maxConnections: 100 };
			assert.equal(
				processXmlTemplate(["<server ", "/>"], camelCase),
				'<server bind-host="0.0.0.0" max-connections="100"/>',
			);

			const filtered = {
				keep: "yes",
				skip: null,
				ignore: false,
				show: "visible",
			};
			assert.equal(
				processXmlTemplate(["<el ", "/>"], filtered),
				'<el keep="yes" ignore="false" show="visible"/>',
			);
		});

		it("escapes object attribute values", () => {
			const obj = {
				title: "Rock & Roll",
				content: '<script>alert("xss")</script>',
			};
			assert.equal(
				processXmlTemplate(["<item ", "/>"], obj),
				'<item title="Rock &amp; Roll" content="&lt;script&gt;alert(&quot;xss&quot;)&lt;/script&gt;"/>',
			);
		});

		it("handles empty objects", () => {
			assert.equal(processXmlTemplate(["<item ", "/>"], {}), "<item />");
		});
	});

	describe("whitespace handling", () => {
		it("trims when needed", () => {
			assert.equal(processXmlTemplate(["  <item/>  "]), "<item/>");
			assert.equal(processXmlTemplate(["\n<item/>\n"]), "<item/>");
			assert.equal(processXmlTemplate(["\t  <item/>  \t"]), "<item/>");
		});

		it("preserves when no trimming needed", () => {
			assert.equal(processXmlTemplate(["<item/>"]), "<item/>");
			assert.equal(processXmlTemplate(["middle content"]), "middle content");
		});

		it("trims results after interpolation", () => {
			assert.equal(
				processXmlTemplate(["  <host>", "</host>  "], "localhost"),
				"<host>localhost</host>",
			);
		});
	});

	describe("edge cases", () => {
		it("handles complex nested structures", () => {
			const users = [
				{ name: "John", active: true },
				{ name: "Jane", active: false },
			];
			const userXml = users
				.filter((u) => u.active)
				.map((u) => processXmlTemplate(['<user name="', '"/>'], u.name));

			assert.equal(userXml.join(""), '<user name="John"/>');
		});

		it("handles function stringification", () => {
			const fn = function testFunc() {
				return "test";
			};
			const result = processXmlTemplate(["<fn>", "</fn>"], fn);
			assert.ok(result.includes("function testFunc"));
			assert.ok(result.startsWith("<fn>"));
			assert.ok(result.endsWith("</fn>"));
		});
	});
});
