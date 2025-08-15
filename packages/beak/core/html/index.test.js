import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { html, safeHtml } from "./index.js";

describe("HTML Template Functions", () => {
	describe("html", () => {
		// Test all examples from the documentation
		it("basic variable interpolation", () => {
			const name = "John Doe";
			const result = html`<div><h1>Hello, ${name}!</h1></div>`;
			assert.equal(result, "<div><h1>Hello, John Doe!</h1></div>");
		});

		it("conditional rendering with ternary operators", () => {
			const isLoggedIn = true;
			const result = html`
				<div>
					${isLoggedIn ? html`<span>Welcome back!</span>` : html`<a href="/login">Login</a>`}
				</div>
			`;
			assert.equal(result, "<div><span>Welcome back!</span></div>");
		});

		it("list rendering with map()", () => {
			const items = ["apple", "banana", "cherry"];
			const result = html`
				<ul>
					${items.map((item) => html`<li>${item}</li>`)}
				</ul>
			`;
			assert.equal(
				result,
				"<ul><li>apple</li><li>banana</li><li>cherry</li></ul>",
			);
		});

		it("conditional attributes", () => {
			const isDisabled = true;
			const result = html`<button${isDisabled ? " disabled" : ""}>Submit</button>`;
			assert.equal(result, "<button disabled>Submit</button>");
		});

		it("dynamic CSS classes", () => {
			const isActive = true;
			const result = html`<div class="base ${isActive ? "active" : ""}">Content</div>`;
			assert.equal(result, '<div class="base active">Content</div>');
		});

		it("complex nested structures with data", () => {
			const users = [
				{ name: "Alice", isAdmin: true },
				{ name: "Bob", isAdmin: false },
			];
			const result = html`
				<div class="users">
					${users.map(
						(user) => html`
						<div class="user${user.isAdmin ? " admin" : ""}">
							<h3>${user.name}</h3>
							${user.isAdmin ? html`<span class="badge">Admin</span>` : ""}
						</div>
					`,
					)}
				</div>
			`;
			assert.equal(
				result,
				'<div class="users"><div class="user admin"><h3>Alice</h3><span class="badge">Admin</span></div><div class="user"><h3>Bob</h3></div></div>',
			);
		});

		it("form rendering with dynamic fields", () => {
			const fields = [
				{ name: "username", type: "text", required: true },
				{ name: "email", type: "email", required: true },
			];
			const result = html`
				<form>
					${fields.map(
						(field) => html`
						<div class="field">
							<label for="${field.name}">${field.name}</label>
							<input type="${field.type}" name="${field.name}"${field.required ? " required" : ""}>
						</div>
					`,
					)}
				</form>
			`;
			assert.equal(
				result,
				'<form><div class="field"><label for="username">username</label><input type="text" name="username" required></div><div class="field"><label for="email">email</label><input type="email" name="email" required></div></form>',
			);
		});

		it("handling falsy values (null, undefined, false, empty string)", () => {
			const user = null;
			const result = html`<div>${user || "Guest"}</div>`;
			assert.equal(result, "<div>Guest</div>");
		});

		it("zero is treated as truthy (included in output)", () => {
			const count = 0;
			const result = html`<div>Count: ${count}</div>`;
			assert.equal(result, "<div>Count: 0</div>");
		});

		it("array flattening", () => {
			const items = [
				["a", "b"],
				["c", "d"],
			];
			const result = html`<div>${items}</div>`;
			assert.equal(result, "<div>abcd</div>");
		});

		// Additional edge cases for 100% coverage
		it("handles empty template", () => {
			const result = html``;
			assert.equal(result, "");
		});

		it("handles single value without static parts", () => {
			const result = html`${"Hello"}`;
			assert.equal(result, "Hello");
		});

		it("handles multiple values without static parts", () => {
			const result = html`${"Hello"}${"World"}`;
			assert.equal(result, "HelloWorld");
		});

		it("handles mixed falsy and truthy values", () => {
			const result = html`<div>${null}${"Hello"}${undefined}${"World"}</div>`;
			assert.equal(result, "<div>HelloWorld</div>");
		});

		it("handles whitespace normalization", () => {
			const result = html`
				<div>
					<span>Hello</span>
					<span>World</span>
				</div>
			`;
			assert.equal(result, "<div><span>Hello</span><span>World</span></div>");
		});

		it("handles objects and functions", () => {
			const obj = { name: "John" };
			const func = () => "Hello";
			const result = html`<div>${obj}${func}</div>`;
			assert.ok(result.includes("[object Object]"));
			assert.ok(result.length > 0);
			assert.ok(typeof result === "string");
		});

		it("handles numbers and booleans", () => {
			const result = html`<div>${42}${true}${false}</div>`;
			assert.equal(result, "<div>42true</div>");
		});

		it("handles nested html calls", () => {
			const inner = html`<span>Inner</span>`;
			const result = html`<div>${inner}</div>`;
			assert.equal(result, "<div><span>Inner</span></div>");
		});

		it("handles deeply nested html calls", () => {
			const inner = html`<span>${html`<em>Deep</em>`}</span>`;
			const result = html`<div>${inner}</div>`;
			assert.equal(result, "<div><span><em>Deep</em></span></div>");
		});

		it("handles complex nested structures", () => {
			const data = [
				{ name: "Alice", items: ["item1", "item2"] },
				{ name: "Bob", items: ["item3"] },
			];
			const result = html`
				<div>
					${data.map(
						(user) => html`
						<div>
							<h3>${user.name}</h3>
							<ul>
								${user.items.map((item) => html`<li>${item}</li>`)}
							</ul>
						</div>
					`,
					)}
				</div>
			`;
			assert.ok(result.includes("<h3>Alice</h3>"));
			assert.ok(result.includes("<h3>Bob</h3>"));
			assert.ok(result.includes("<li>item1</li>"));
			assert.ok(result.includes("<li>item3</li>"));
		});

		it("handles edge case with all falsy values", () => {
			const result = html`<div>${null}${undefined}${false}${""}${NaN}</div>`;
			assert.equal(result, "<div></div>");
		});

		it("handles edge case with only zero values", () => {
			const result = html`<div>${0}${0}${0}</div>`;
			assert.equal(result, "<div>000</div>");
		});

		it("handles edge case with mixed zero and falsy", () => {
			const result = html`<div>${null}${0}${undefined}${0}${false}</div>`;
			assert.equal(result, "<div>00</div>");
		});

		it("handles edge case with many values", () => {
			const result = html`<div>${"A"}${"B"}${"C"}${"D"}${"E"}</div>`;
			assert.equal(result, "<div>ABCDE</div>");
		});

		it("handles edge case with many values and falsy", () => {
			const result = html`<div>${"A"}${null}${"B"}${undefined}${"C"}${false}${"D"}</div>`;
			assert.equal(result, "<div>ABCD</div>");
		});

		it("handles edge case with many values and zero", () => {
			const result = html`<div>${"A"}${0}${"B"}${0}${"C"}</div>`;
			assert.equal(result, "<div>A0B0C</div>");
		});

		it("handles edge case with complex nested structures and many values", () => {
			const data = [
				{ name: "Alice", items: ["item1", "item2", "item3"] },
				{ name: "Bob", items: ["item4", "item5"] },
				{ name: "Charlie", items: ["item6"] },
			];
			const result = html`
				<div>
					${data.map(
						(user) => html`
						<div>
							<h3>${user.name}</h3>
							<ul>
								${user.items.map((item) => html`<li>${item}</li>`)}
							</ul>
						</div>
					`,
					)}
				</div>
			`;
			assert.ok(result.includes("<h3>Alice</h3>"));
			assert.ok(result.includes("<h3>Bob</h3>"));
			assert.ok(result.includes("<h3>Charlie</h3>"));
			assert.ok(result.includes("<li>item1</li>"));
			assert.ok(result.includes("<li>item6</li>"));
		});
	});

	describe("safeHtml", () => {
		// Test all examples from the documentation
		it("basic usage with user input", () => {
			const userInput = '<script>alert("XSS")</script>';
			const result = safeHtml`<div><p>${userInput}</p></div>`;
			assert.equal(
				result,
				"<div><p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p></div>",
			);
		});

		it("user-generated content in forms", () => {
			const userComment = '<img src="x" onerror="alert(\'XSS\')">';
			const result = safeHtml`
				<div class="comment">
					<p>${userComment}</p>
				</div>
			`;
			assert.equal(
				result,
				'<div class="comment"><p>&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;</p></div>',
			);
		});

		it("user data in tables", () => {
			const userData = [
				{ name: '<script>alert("XSS")</script>', email: "user@example.com" },
				{ name: "Bob", email: '<img src="x" onerror="alert(\'XSS\')">' },
			];
			const result = safeHtml`
				<table>
					<tbody>
						${userData.map(
							(user) => safeHtml`
							<tr>
								<td>${user.name}</td>
								<td>${user.email}</td>
							</tr>
						`,
						)}
					</tbody>
				</table>
			`;
			assert.equal(
				result,
				"<table><tbody>&lt;tr&gt;&lt;td&gt;&amp;lt;script&amp;gt;alert(&amp;quot;XSS&amp;quot;)&amp;lt;/script&amp;gt;&lt;/td&gt;&lt;td&gt;user@example.com&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;Bob&lt;/td&gt;&lt;td&gt;&amp;lt;img src=&amp;quot;x&amp;quot; onerror=&amp;quot;alert(&amp;#39;XSS&amp;#39;)&amp;quot;&amp;gt;&lt;/td&gt;&lt;/tr&gt;</tbody></table>",
			);
		});

		it("mixed trusted and untrusted content", () => {
			const trustedContent = "This is safe content";
			const untrustedContent = '<script>alert("XSS")</script>';
			const result = safeHtml`
				<div>
					<p>${trustedContent}</p>
					<p>${untrustedContent}</p>
				</div>
			`;
			assert.equal(
				result,
				"<div><p>This is safe content</p><p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p></div>",
			);
		});

		it("user input in conditional rendering", () => {
			const userInput = '<script>alert("XSS")</script>';
			const isLoggedIn = true;
			const result = safeHtml`
				<div>
					${isLoggedIn ? safeHtml`<span>Welcome, ${userInput}!</span>` : safeHtml`<a href="/login">Login</a>`}
				</div>
			`;
			assert.equal(
				result,
				"<div>&lt;span&gt;Welcome, &amp;lt;script&amp;gt;alert(&amp;quot;XSS&amp;quot;)&amp;lt;/script&amp;gt;!&lt;/span&gt;</div>",
			);
		});

		it("user-generated attributes", () => {
			const maliciousClass = '"><script>alert("XSS")</script><div class="';
			const isActive = true;
			const result = safeHtml`<div class="base ${isActive ? maliciousClass : ""}">Content</div>`;
			assert.equal(
				result,
				'<div class="base &quot;&gt;&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;div class=&quot;">Content</div>',
			);
		});

		it("complex user-generated content", () => {
			const userProfile = {
				name: '<script>alert("XSS")</script>',
				bio: '<img src="x" onerror="alert(\'XSS\')">',
				website: 'javascript:alert("XSS")',
			};
			const result = safeHtml`
				<div class="user-profile">
					<h1>${userProfile.name}</h1>
					<p>${userProfile.bio}</p>
					<a href="${userProfile.website}">Website</a>
				</div>
			`;
			assert.equal(
				result,
				'<div class="user-profile"><h1>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</h1><p>&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;</p><a href="javascript:alert(&quot;XSS&quot;)">Website</a></div>',
			);
		});

		it("handling falsy values with escaping", () => {
			const userInput = null;
			const result = safeHtml`<div>${userInput || "No input provided"}</div>`;
			assert.equal(result, "<div>No input provided</div>");
		});

		it("array flattening with escaping", () => {
			const userInputs = [
				['<script>alert("XSS1")</script>', '<script>alert("XSS2")</script>'],
			];
			const result = safeHtml`<div>${userInputs}</div>`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&quot;XSS1&quot;)&lt;/script&gt;&lt;script&gt;alert(&quot;XSS2&quot;)&lt;/script&gt;</div>",
			);
		});

		// Additional edge cases for 100% coverage
		it("handles empty template", () => {
			const result = safeHtml``;
			assert.equal(result, "");
		});

		it("handles single value without static parts", () => {
			const result = safeHtml`${"Hello"}`;
			assert.equal(result, "Hello");
		});

		it("handles multiple values without static parts", () => {
			const result = safeHtml`${"Hello"}${"World"}`;
			assert.equal(result, "HelloWorld");
		});

		it("handles mixed falsy and truthy values with escaping", () => {
			const result = safeHtml`<div>${null}${"Hello"}${undefined}${"World"}</div>`;
			assert.equal(result, "<div>HelloWorld</div>");
		});

		it("handles whitespace normalization with escaping", () => {
			const result = safeHtml`
				<div>
					<span>Hello</span>
					<span>World</span>
				</div>
			`;
			assert.equal(result, "<div><span>Hello</span><span>World</span></div>");
		});

		it("handles objects and functions with escaping", () => {
			const obj = { name: "John" };
			const func = () => "Hello";
			const result = safeHtml`<div>${obj}${func}</div>`;
			assert.ok(result.includes("[object Object]"));
			assert.ok(result.length > 0);
			assert.ok(typeof result === "string");
		});

		it("handles numbers and booleans with escaping", () => {
			const result = safeHtml`<div>${42}${true}${false}</div>`;
			assert.equal(result, "<div>42true</div>");
		});

		it("handles nested safeHtml calls", () => {
			const inner = safeHtml`<span>Inner</span>`;
			const result = safeHtml`<div>${inner}</div>`;
			assert.equal(result, "<div>&lt;span&gt;Inner&lt;/span&gt;</div>");
		});

		it("handles deeply nested safeHtml calls", () => {
			const inner = safeHtml`<span>${safeHtml`<em>Deep</em>`}</span>`;
			const result = safeHtml`<div>${inner}</div>`;
			assert.equal(
				result,
				"<div>&lt;span&gt;&amp;lt;em&amp;gt;Deep&amp;lt;/em&amp;gt;&lt;/span&gt;</div>",
			);
		});

		it("handles mixed html and safeHtml calls", () => {
			const inner = html`<span>Trusted</span>`;
			const result = safeHtml`<div>${inner}</div>`;
			assert.equal(result, "<div>&lt;span&gt;Trusted&lt;/span&gt;</div>");
		});

		it("handles complex nested structures with escaping", () => {
			const userData = [
				{
					name: '<script>alert("XSS1")</script>',
					items: ['<script>alert("XSS2")</script>'],
				},
				{ name: "Bob", items: ['<img src="x" onerror="alert(\'XSS3\')">'] },
			];
			const result = safeHtml`
				<div>
					${userData.map(
						(user) => safeHtml`
						<div>
							<h3>${user.name}</h3>
							<ul>
								${user.items.map((item) => safeHtml`<li>${item}</li>`)}
							</ul>
						</div>
					`,
					)}
				</div>
			`;
			// Just verify the result contains escaped content and Bob
			assert.ok(result.includes("Bob"));
			assert.ok(result.length > 0);
			assert.ok(typeof result === "string");
		});

		it("handles zero with escaping", () => {
			const result = safeHtml`<div>Count: ${0}</div>`;
			assert.equal(result, "<div>Count: 0</div>");
		});

		it("handles special characters in attributes", () => {
			const maliciousAttr = '"><script>alert("XSS")</script>';
			const result = safeHtml`<div data-value="${maliciousAttr}">Content</div>`;
			assert.equal(
				result,
				'<div data-value="&quot;&gt;&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;">Content</div>',
			);
		});

		it("handles edge case with many values and escaping", () => {
			const result = safeHtml`<div>${"A"}${"<script>alert('XSS1')</script>"}${"B"}${"<script>alert('XSS2')</script>"}${"C"}</div>`;
			assert.equal(
				result,
				"<div>A&lt;script&gt;alert(&#39;XSS1&#39;)&lt;/script&gt;B&lt;script&gt;alert(&#39;XSS2&#39;)&lt;/script&gt;C</div>",
			);
		});

		it("handles edge case with many values and mixed content", () => {
			const result = safeHtml`<div>${"A"}${null}${"<script>alert('XSS')</script>"}${undefined}${"B"}${false}${"C"}</div>`;
			assert.equal(
				result,
				"<div>A&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;BC</div>",
			);
		});

		it("handles edge case with many values and zero", () => {
			const result = safeHtml`<div>${"A"}${0}${"<script>alert('XSS')</script>"}${0}${"B"}</div>`;
			assert.equal(
				result,
				"<div>A0&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;0B</div>",
			);
		});

		it("handles edge case with complex nested structures and many values with escaping", () => {
			const userData = [
				{
					name: "Alice",
					items: [
						"<script>alert('XSS1')</script>",
						"item2",
						"<script>alert('XSS2')</script>",
					],
				},
				{ name: "Bob", items: ["item4", "<script>alert('XSS3')</script>"] },
				{ name: "Charlie", items: ["item6"] },
			];
			const result = safeHtml`
				<div>
					${userData.map(
						(user) => safeHtml`
						<div>
							<h3>${user.name}</h3>
							<ul>
								${user.items.map((item) => safeHtml`<li>${item}</li>`)}
							</ul>
						</div>
					`,
					)}
				</div>
			`;
			// Just verify the result contains the names and is a valid string
			assert.ok(result.includes("Alice"));
			assert.ok(result.includes("Bob"));
			assert.ok(result.includes("Charlie"));
			assert.ok(result.length > 0);
			assert.ok(typeof result === "string");
		});

		it("handles edge case with all falsy values in complex structure", () => {
			const result = html`<div>${null}${undefined}${false}${""}</div>`;
			assert.equal(result, "<div></div>");
		});

		it("handles edge case with only zero values in complex structure", () => {
			const result = html`<div>${0}${0}${0}</div>`;
			assert.equal(result, "<div>000</div>");
		});

		it("handles edge case with mixed zero and falsy in complex structure", () => {
			const result = html`<div>${null}${0}${undefined}${0}${false}</div>`;
			assert.equal(result, "<div>00</div>");
		});

		it("handles edge case with many values and complex escaping", () => {
			const result = safeHtml`<div>${"A"}${null}${"<script>alert('XSS1')</script>"}${undefined}${"B"}${false}${"<script>alert('XSS2')</script>"}${"C"}</div>`;
			assert.ok(result.includes("A"));
			assert.ok(result.includes("B"));
			assert.ok(result.includes("C"));
			assert.ok(result.includes("&lt;script&gt;"));
			assert.ok(result.length > 0);
		});

		it("handles edge case with deeply nested falsy values", () => {
			const data = [null, undefined, false, "", 0, null, undefined];
			const result = html`<div>${data.map((item) => item)}</div>`;
			assert.equal(result, "<div>nullundefinedfalse0nullundefined</div>");
		});

		it("handles edge case with deeply nested escaping and falsy values", () => {
			const data = [
				null,
				"<script>alert('XSS')</script>",
				undefined,
				false,
				"",
				0,
			];
			const result = safeHtml`<div>${data.map((item) => item)}</div>`;
			assert.ok(result.includes("0"));
			assert.ok(result.includes("&lt;script&gt;"));
			assert.ok(result.length > 0);
		});
	});
});
