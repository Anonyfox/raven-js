/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see https://github.com/Anonyfox/ravenjs
 * @see https://ravenjs.dev
 * @see https://anonyfox.com
 */

import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { cdata, xml } from "./index.js";

describe("XML tagged template engine", () => {
	describe("xml template literal", () => {
		it("generates basic XML", () => {
			const result = xml`<user>John</user>`;
			assert.equal(result, "<user>John</user>");
		});

		it("handles interpolated values (trusted mode)", () => {
			const name = "John & Jane";
			const id = 123;
			const result = xml`<user id="${id}">${name}</user>`;
			assert.equal(result, '<user id="123">John & Jane</user>');
		});

		it("converts objects to attributes", () => {
			const config = { bindHost: "0.0.0.0", maxConnections: 100, secure: true };
			const result = xml`<server ${config}/>`;
			assert.equal(
				result,
				'<server bind-host="0.0.0.0" max-connections="100" secure="true"/>',
			);
		});

		it("processes arrays as concatenated", () => {
			const elements = ["<span>A</span>", "<span>B</span>"];
			const result = xml`<container>${elements}</container>`;
			assert.equal(
				result,
				"<container><span>A</span><span>B</span></container>",
			);
		});

		it("handles nested XML composition", () => {
			const users = [
				{ id: 1, name: "John" },
				{ id: 2, name: "Jane" },
			];
			const userElements = users.map(
				(u) => xml`<user id="${u.id}">${u.name}</user>`,
			);
			const result = xml`<users>${userElements}</users>`;
			assert.equal(
				result,
				'<users><user id="1">John</user><user id="2">Jane</user></users>',
			);
		});

		it("filters null/undefined/false values", () => {
			const result = xml`<item>${null}${undefined}${false}${true}${""}</item>`;
			assert.equal(result, "<item>true</item>");
		});

		it("caches templates for performance", () => {
			const template = ["<user>", "</user>"];
			const result1 = xml(template, "John");
			const result2 = xml(template, "Jane");

			assert.equal(result1, "<user>John</user>");
			assert.equal(result2, "<user>Jane</user>");
		});

		it("handles self-closing tags", () => {
			const result = xml`<input type="text" name="${"username"}"/>`;
			assert.equal(result, '<input type="text" name="username"/>');
		});

		it("preserves trusted content (no auto-escaping)", () => {
			const xmlContent = "<inner>Valid XML</inner>";
			const result = xml`<content>${xmlContent}</content>`;
			assert.equal(result, "<content><inner>Valid XML</inner></content>");
		});

		it("handles complex real-world examples", () => {
			// RSS feed item
			const item = {
				title: "Breaking News & Updates",
				link: "https://example.com/news?id=123&type=alert",
				pubDate: "2024-01-01T10:00:00Z",
			};

			const result = xml`
				<item>
					<title>${item.title}</title>
					<link>${item.link}</link>
					<pubDate>${item.pubDate}</pubDate>
				</item>
			`;

			assert.ok(result.includes("Breaking News & Updates"));
			assert.ok(result.includes("https://example.com/news?id=123&type=alert"));
			assert.ok(result.includes("2024-01-01T10:00:00Z"));
		});
	});

	describe("cdata helper", () => {
		it("wraps content in CDATA section", () => {
			const result = cdata("Hello World");
			assert.equal(result, "<![CDATA[Hello World]]>");
		});

		it("preserves HTML content without escaping", () => {
			const html = "<p>Test & <strong>Bold</strong></p>";
			const result = cdata(html);
			assert.equal(result, "<![CDATA[<p>Test & <strong>Bold</strong></p>]]>");
		});

		it("escapes CDATA termination sequence", () => {
			const dangerous = "Content with ]]> terminator";
			const result = cdata(dangerous);
			assert.equal(
				result,
				"<![CDATA[Content with ]]]]><![CDATA[> terminator]]>",
			);
		});

		it("handles multiple CDATA terminators", () => {
			const dangerous = "]]>middle]]>";
			const result = cdata(dangerous);
			assert.equal(result, "<![CDATA[]]]]><![CDATA[>middle]]]]><![CDATA[>]]>");
		});

		it("handles null/undefined", () => {
			assert.equal(cdata(null), "<![CDATA[]]>");
			assert.equal(cdata(undefined), "<![CDATA[]]>");
			assert.equal(cdata(""), "<![CDATA[]]>");
		});

		it("converts non-strings", () => {
			assert.equal(cdata(123), "<![CDATA[123]]>");
			assert.equal(cdata(true), "<![CDATA[true]]>");
			assert.equal(cdata({ toString: () => "object" }), "<![CDATA[object]]>");
		});

		it("integrates with xml templates", () => {
			const htmlContent = '<script>alert("Hello & goodbye");</script>';
			const title = "JavaScript Example";

			const result = xml`
				<item>
					<title>${title}</title>
					<description>${cdata(htmlContent)}</description>
				</item>
			`;

			assert.ok(result.includes("JavaScript Example"));
			assert.ok(
				result.includes(
					'<![CDATA[<script>alert("Hello & goodbye");</script>]]>',
				),
			);
		});

		it("handles edge case with only terminator", () => {
			const result = cdata("]]>");
			assert.equal(result, "<![CDATA[]]]]><![CDATA[>]]>");
		});
	});

	describe("advanced use cases", () => {
		it("generates SVG with dynamic attributes", () => {
			const props = { width: 100, height: 50, viewBox: "0 0 100 50" };
			const color = "red";

			const result = xml`
				<svg ${props}>
					<rect x="10" y="10" width="30" height="20" fill="${color}"/>
				</svg>
			`;

			assert.ok(result.includes('width="100"'));
			assert.ok(result.includes('height="50"'));
			assert.ok(result.includes('view-box="0 0 100 50"'));
			assert.ok(result.includes('fill="red"'));
		});

		it("generates configuration XML", () => {
			const database = {
				host: "localhost",
				port: 3306,
				ssl: false,
				maxConnections: 100,
			};

			const result = xml`
				<configuration>
					<database ${database}/>
					<features>
						${["caching", "logging"].map((f) => xml`<feature name="${f}" enabled="true"/>`)}
					</features>
				</configuration>
			`;

			assert.ok(result.includes('host="localhost"'));
			assert.ok(result.includes('max-connections="100"'));
			assert.ok(result.includes('ssl="false"'));
			assert.ok(result.includes('name="caching" enabled="true"'));
			assert.ok(result.includes('name="logging" enabled="true"'));
		});

		it("generates RSS feed", () => {
			const channel = {
				title: "Tech News & Updates",
				description: "Latest technology news",
				link: "https://example.com",
			};

			const items = [
				{ title: "Breaking: AI Advances", link: "https://example.com/ai" },
				{ title: "Web Development Tips", link: "https://example.com/webdev" },
			];

			const result = xml`
				<rss version="2.0">
					<channel>
						<title>${channel.title}</title>
						<description>${channel.description}</description>
						<link>${channel.link}</link>
						${items.map(
							(item) => xml`
							<item>
								<title>${item.title}</title>
								<link>${item.link}</link>
							</item>
						`,
						)}
					</channel>
				</rss>
			`;

			assert.ok(result.includes("Tech News & Updates"));
			assert.ok(result.includes("Breaking: AI Advances"));
			assert.ok(result.includes("Web Development Tips"));
		});
	});
});
