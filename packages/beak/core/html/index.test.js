import { strict as assert } from "node:assert";
import { describe, it } from "node:test";
import { html, safeHtml } from "./index.js";

describe("HTML Template Functions", () => {
	describe("html", () => {
		it("renders static HTML correctly", () => {
			const result = html`<div>Hello, World!</div>`;
			assert.equal(result, "<div>Hello, World!</div>");
		});

		it("interpolates dynamic values correctly", () => {
			const name = "Quoth";
			const result = html`<div>Hello, ${name}!</div>`;
			assert.equal(result, "<div>Hello, Quoth!</div>");
		});

		it("joins array values correctly", () => {
			const items = ["one", "two", "three"];
			const result = html`<div>${items}</div>`;
			assert.equal(result, "<div>onetwothree</div>");
		});

		it("handles nested arrays correctly", () => {
			const nestedItems = ["one", ["two", "three"], "four"];
			const result = html`<div>${nestedItems}</div>`;
			assert.equal(result, "<div>onetwothreefour</div>");
		});

		it("handles falsy values correctly", () => {
			const result = html`<div>${null}${undefined}${false}${0}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("trims the result correctly", () => {
			const result = html`  <div>Trimmed</div>  `;
			assert.equal(result, "<div>Trimmed</div>");
		});

		it("handles conditional rendering with ternary operators", () => {
			const isLoggedIn = true;
			const result = html`
				<div>
					${isLoggedIn ? html`<span>Welcome back!</span>` : html`<a href="/login">Login</a>`}
				</div>
			`;
			assert.equal(result, "<div><span>Welcome back!</span></div>");
		});

		it("handles conditional rendering with falsy values", () => {
			const showHeader = false;
			const result = html`
				<div>
					${showHeader ? html`<header>Title</header>` : ""}
					<main>Content</main>
				</div>
			`;
			assert.equal(result, "<div><main>Content</main></div>");
		});

		it("handles list rendering with map", () => {
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

		it("handles nested list rendering", () => {
			const categories = [
				{ name: "Fruits", items: ["apple", "banana"] },
				{ name: "Vegetables", items: ["carrot", "lettuce"] },
			];
			const result = html`
				<div>
					${categories.map(
						(category) => html`
						<div>
							<h3>${category.name}</h3>
							<ul>
								${category.items.map((item) => html`<li>${item}</li>`)}
							</ul>
						</div>
					`,
					)}
				</div>
			`;
			assert.equal(
				result,
				"<div><div><h3>Fruits</h3><ul><li>apple</li><li>banana</li></ul></div><div><h3>Vegetables</h3><ul><li>carrot</li><li>lettuce</li></ul></div></div>",
			);
		});

		it("handles conditional attributes", () => {
			const isDisabled = true;
			const result = html`<button${isDisabled ? " disabled" : ""}>Submit</button>`;
			assert.equal(result, "<button disabled>Submit</button>");
		});

		it("handles multiple conditional attributes", () => {
			const isDisabled = true;
			const isLoading = false;
			const result = html`<button${isDisabled ? " disabled" : ""}${isLoading ? ' class="loading"' : ""}>Submit</button>`;
			assert.equal(result, "<button disabled>Submit</button>");
		});

		it("handles dynamic class names", () => {
			const isActive = true;
			const isHighlighted = false;
			const result = html`<div class="base ${isActive ? "active" : ""} ${isHighlighted ? "highlighted" : ""}">Content</div>`;
			assert.equal(result, '<div class="base active ">Content</div>');
		});

		it("handles complex conditional rendering", () => {
			const user = { name: "John", isAdmin: true, isOnline: false };
			const result = html`
				<div class="user-card">
					<h2>${user.name}</h2>
					${user.isAdmin ? html`<span class="badge admin">Admin</span>` : ""}
					${user.isOnline ? html`<span class="status online">Online</span>` : html`<span class="status offline">Offline</span>`}
				</div>
			`;
			assert.equal(
				result,
				'<div class="user-card"><h2>John</h2><span class="badge admin">Admin</span><span class="status offline">Offline</span></div>',
			);
		});

		it("handles form rendering with dynamic fields", () => {
			const fields = [
				{ name: "username", type: "text", required: true },
				{ name: "email", type: "email", required: true },
				{ name: "bio", type: "textarea", required: false },
			];
			const result = html`
				<form>
					${fields.map(
						(field) => html`
						<div class="field">
							<label for="${field.name}">${field.name}</label>
							${
								field.type === "textarea"
									? html`<textarea name="${field.name}"${field.required ? " required" : ""}></textarea>`
									: html`<input type="${field.type}" name="${field.name}"${field.required ? " required" : ""}>`
							}
						</div>
					`,
					)}
				</form>
			`;
			assert.equal(
				result,
				'<form><div class="field"><label for="username">username</label><input type="text" name="username" required></div><div class="field"><label for="email">email</label><input type="email" name="email" required></div><div class="field"><label for="bio">bio</label><textarea name="bio"></textarea></div></form>',
			);
		});

		it("handles table rendering with data", () => {
			const users = [
				{ id: 1, name: "Alice", email: "alice@example.com" },
				{ id: 2, name: "Bob", email: "bob@example.com" },
			];
			const result = html`
				<table>
					<thead>
						<tr>
							<th>ID</th>
							<th>Name</th>
							<th>Email</th>
						</tr>
					</thead>
					<tbody>
						${users.map(
							(user) => html`
							<tr>
								<td>${user.id}</td>
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
				"<table><thead><tr><th>ID</th><th>Name</th><th>Email</th></tr></thead><tbody><tr><td>1</td><td>Alice</td><td>alice@example.com</td></tr><tr><td>2</td><td>Bob</td><td>bob@example.com</td></tr></tbody></table>",
			);
		});

		it("handles empty arrays gracefully", () => {
			const items = [];
			const result = html`
				<ul>
					${items.map((item) => html`<li>${item}</li>`)}
				</ul>
			`;
			assert.equal(result, "<ul></ul>");
		});

		it("handles mixed content with arrays and conditionals", () => {
			const posts = [
				{ title: "Post 1", published: true },
				{ title: "Post 2", published: false },
				{ title: "Post 3", published: true },
			];
			const result = html`
				<div class="blog">
					<h1>Blog Posts</h1>
					${
						posts.length === 0
							? html`<p>No posts yet.</p>`
							: html`
							<div class="posts">
								${posts.map(
									(post) => html`
									<article class="post${post.published ? " published" : " draft"}">
										<h2>${post.title}</h2>
										${post.published ? html`<span class="status">Published</span>` : html`<span class="status">Draft</span>`}
									</article>
								`,
								)}
							</div>
						`
					}
				</div>
			`;
			assert.equal(
				result,
				'<div class="blog"><h1>Blog Posts</h1><div class="posts"><article class="post published"><h2>Post 1</h2><span class="status">Published</span></article><article class="post draft"><h2>Post 2</h2><span class="status">Draft</span></article><article class="post published"><h2>Post 3</h2><span class="status">Published</span></article></div></div>',
			);
		});

		it("handles all falsy values correctly", () => {
			const result = html`<div>${null}${undefined}${false}${0}${""}${NaN}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("handles empty values array", () => {
			const result = html`<div>Static content</div>`;
			assert.equal(result, "<div>Static content</div>");
		});

		it("handles single value with no static parts after", () => {
			const result = html`<div>${"content"}`;
			assert.equal(result, "<div>content");
		});

		it("handles single value with no static parts before", () => {
			const result = html`${"content"}</div>`;
			assert.equal(result, "content</div>");
		});

		it("handles multiple consecutive falsy values", () => {
			const result = html`<div>${null}${undefined}${false}${0}${""}${"valid"}${null}${undefined}</div>`;
			assert.equal(result, "<div>0valid</div>");
		});

		it("handles whitespace normalization with complex structure", () => {
			const result = html`
				<div>
					<span>Hello</span>
					<span>World</span>
				</div>
			`;
			assert.equal(result, "<div><span>Hello</span><span>World</span></div>");
		});

		it("handles whitespace normalization with newlines and tabs", () => {
			const result = html`
				<div>
					<p>Paragraph 1</p>
					<p>Paragraph 2</p>
				</div>
			`;
			assert.equal(result, "<div><p>Paragraph 1</p><p>Paragraph 2</p></div>");
		});
	});

	describe("safeHtml", () => {
		it("escapes HTML special characters in dynamic values", () => {
			const unsafeString = `<script>alert("XSS")</script>`;
			const result = safeHtml`<div>${unsafeString}</div>`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</div>",
			);
		});

		it("renders static HTML correctly", () => {
			const result = safeHtml`<div>Hello, World!</div>`;
			assert.equal(result, "<div>Hello, World!</div>");
		});

		it("interpolates dynamic values correctly", () => {
			const name = "Quoth";
			const result = safeHtml`<div>Hello, ${name}!</div>`;
			assert.equal(result, "<div>Hello, Quoth!</div>");
		});

		it("joins array values correctly", () => {
			const items = ["one", "two", "three"];
			const result = safeHtml`<div>${items}</div>`;
			assert.equal(result, "<div>onetwothree</div>");
		});

		it("handles nested arrays correctly", () => {
			const nestedItems = ["one", ["two", "three"], "four"];
			const result = safeHtml`<div>${nestedItems}</div>`;
			assert.equal(result, "<div>onetwothreefour</div>");
		});

		it("handles falsy values correctly", () => {
			const result = safeHtml`<div>${null}${undefined}${false}${0}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("trims the result correctly", () => {
			const result = safeHtml`  <div>Trimmed</div>  `;
			assert.equal(result, "<div>Trimmed</div>");
		});

		it("escapes user input in conditional rendering", () => {
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

		it("escapes user input in list rendering", () => {
			const userItems = [
				'<script>alert("XSS1")</script>',
				'<img src="x" onerror="alert(\'XSS2\')">',
				"<a href=\"javascript:alert('XSS3')\">Click me</a>",
			];
			const result = safeHtml`
				<ul>
					${userItems.map((item) => safeHtml`<li>${item}</li>`)}
				</ul>
			`;
			assert.equal(
				result,
				"<ul>&lt;li&gt;&amp;lt;script&amp;gt;alert(&amp;quot;XSS1&amp;quot;)&amp;lt;/script&amp;gt;&lt;/li&gt;&lt;li&gt;&amp;lt;img src=&amp;quot;x&amp;quot; onerror=&amp;quot;alert(&amp;#39;XSS2&amp;#39;)&amp;quot;&amp;gt;&lt;/li&gt;&lt;li&gt;&amp;lt;a href=&amp;quot;javascript:alert(&amp;#39;XSS3&amp;#39;)&amp;quot;&amp;gt;Click me&amp;lt;/a&amp;gt;&lt;/li&gt;</ul>",
			);
		});

		it("escapes user input in form fields", () => {
			const maliciousInput = '<script>alert("XSS")</script>';
			const result = safeHtml`
				<form>
					<input type="text" value="${maliciousInput}">
					<textarea>${maliciousInput}</textarea>
				</form>
			`;
			assert.equal(
				result,
				'<form><input type="text" value="&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;"><textarea>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</textarea></form>',
			);
		});

		it("escapes user input in table data", () => {
			const maliciousData = [
				{
					id: 1,
					name: '<script>alert("XSS")</script>',
					email: "user@example.com",
				},
				{ id: 2, name: "Bob", email: '<img src="x" onerror="alert(\'XSS\')">' },
			];
			const result = safeHtml`
				<table>
					<tbody>
						${maliciousData.map(
							(user) => safeHtml`
							<tr>
								<td>${user.id}</td>
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
				"<table><tbody>&lt;tr&gt;&lt;td&gt;1&lt;/td&gt;&lt;td&gt;&amp;lt;script&amp;gt;alert(&amp;quot;XSS&amp;quot;)&amp;lt;/script&amp;gt;&lt;/td&gt;&lt;td&gt;user@example.com&lt;/td&gt;&lt;/tr&gt;&lt;tr&gt;&lt;td&gt;2&lt;/td&gt;&lt;td&gt;Bob&lt;/td&gt;&lt;td&gt;&amp;lt;img src=&amp;quot;x&amp;quot; onerror=&amp;quot;alert(&amp;#39;XSS&amp;#39;)&amp;quot;&amp;gt;&lt;/td&gt;&lt;/tr&gt;</tbody></table>",
			);
		});

		it("escapes user input in conditional attributes", () => {
			const maliciousClass = '"><script>alert("XSS")</script><div class="';
			const isActive = true;
			const result = safeHtml`<div class="base ${isActive ? maliciousClass : ""}">Content</div>`;
			assert.equal(
				result,
				'<div class="base &quot;&gt;&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;&lt;div class=&quot;">Content</div>',
			);
		});

		it("escapes user input in complex nested structures", () => {
			const maliciousUser = {
				name: '<script>alert("XSS")</script>',
				bio: '<img src="x" onerror="alert(\'XSS\')">',
				website: 'javascript:alert("XSS")',
			};
			const result = safeHtml`
				<div class="user-profile">
					<h1>${maliciousUser.name}</h1>
					<p>${maliciousUser.bio}</p>
					<a href="${maliciousUser.website}">Website</a>
				</div>
			`;
			assert.equal(
				result,
				'<div class="user-profile"><h1>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</h1><p>&lt;img src=&quot;x&quot; onerror=&quot;alert(&#39;XSS&#39;)&quot;&gt;</p><a href="javascript:alert(&quot;XSS&quot;)">Website</a></div>',
			);
		});

		it("handles safe content mixed with unsafe content", () => {
			const safeContent = "This is safe content";
			const unsafeContent = '<script>alert("XSS")</script>';
			const result = safeHtml`
				<div>
					<p>${safeContent}</p>
					<p>${unsafeContent}</p>
					<p>${safeContent} mixed with ${unsafeContent}</p>
				</div>
			`;
			assert.equal(
				result,
				"<div><p>This is safe content</p><p>&lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p><p>This is safe content mixed with &lt;script&gt;alert(&quot;XSS&quot;)&lt;/script&gt;</p></div>",
			);
		});

		it("handles all falsy values correctly with escaping", () => {
			const result = safeHtml`<div>${null}${undefined}${false}${0}${""}${NaN}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("handles empty values array with escaping", () => {
			const result = safeHtml`<div>Static content</div>`;
			assert.equal(result, "<div>Static content</div>");
		});

		it("handles single value with no static parts after with escaping", () => {
			const result = safeHtml`<div>${"<script>alert('XSS')</script>"}`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;",
			);
		});

		it("handles single value with no static parts before with escaping", () => {
			const result = safeHtml`${"<script>alert('XSS')</script>"}</div>`;
			assert.equal(
				result,
				"&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>",
			);
		});

		it("handles multiple consecutive falsy values with escaping", () => {
			const result = safeHtml`<div>${null}${undefined}${false}${0}${""}${"<script>alert('XSS')</script>"}${null}${undefined}</div>`;
			assert.equal(
				result,
				"<div>0&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</div>",
			);
		});

		it("handles whitespace normalization with complex structure and escaping", () => {
			const result = safeHtml`
				<div>
					<span>${"<script>alert('XSS')</script>"}</span>
					<span>Safe content</span>
				</div>
			`;
			assert.equal(
				result,
				"<div><span>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</span><span>Safe content</span></div>",
			);
		});

		it("handles whitespace normalization with newlines and tabs and escaping", () => {
			const result = safeHtml`
				<div>
					<p>${"<script>alert('XSS')</script>"}</p>
					<p>Safe paragraph</p>
				</div>
			`;
			assert.equal(
				result,
				"<div><p>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</p><p>Safe paragraph</p></div>",
			);
		});

		it("handles mixed falsy and truthy values with escaping", () => {
			const result = safeHtml`<div>${null}${"<script>alert('XSS')</script>"}${undefined}${"Safe"}${false}${"<img src=x onerror=alert('XSS')>"}</div>`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;Safe&lt;img src=x onerror=alert(&#39;XSS&#39;)&gt;</div>",
			);
		});

		it("handles edge case with only falsy values and escaping", () => {
			const result = safeHtml`<div>${null}${undefined}${false}${""}${NaN}</div>`;
			assert.equal(result, "<div></div>");
		});

		it("handles edge case with only truthy values and escaping", () => {
			const result = safeHtml`<div>${"<script>alert('XSS1')</script>"}${"<script>alert('XSS2')</script>"}${"<script>alert('XSS3')</script>"}</div>`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&#39;XSS1&#39;)&lt;/script&gt;&lt;script&gt;alert(&#39;XSS2&#39;)&lt;/script&gt;&lt;script&gt;alert(&#39;XSS3&#39;)&lt;/script&gt;</div>",
			);
		});

		it("handles edge case with no values at all", () => {
			const result = html`<div>Static content only</div>`;
			assert.equal(result, "<div>Static content only</div>");
		});

		it("handles edge case with no values at all with escaping", () => {
			const result = safeHtml`<div>Static content only</div>`;
			assert.equal(result, "<div>Static content only</div>");
		});

		it("handles edge case with single value only", () => {
			const result = html`${"content"}`;
			assert.equal(result, "content");
		});

		it("handles edge case with single value only with escaping", () => {
			const result = safeHtml`${"<script>alert('XSS')</script>"}`;
			assert.equal(result, "&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;");
		});

		it("handles edge case with multiple values but no static parts", () => {
			const result = html`${"first"}${"second"}${"third"}`;
			assert.equal(result, "firstsecondthird");
		});

		it("handles edge case with multiple values but no static parts with escaping", () => {
			const result = safeHtml`${"<script>alert('XSS1')</script>"}${"<script>alert('XSS2')</script>"}${"<script>alert('XSS3')</script>"}`;
			assert.equal(
				result,
				"&lt;script&gt;alert(&#39;XSS1&#39;)&lt;/script&gt;&lt;script&gt;alert(&#39;XSS2&#39;)&lt;/script&gt;&lt;script&gt;alert(&#39;XSS3&#39;)&lt;/script&gt;",
			);
		});

		it("handles edge case with alternating static and dynamic content", () => {
			const result = html`<div>${"dynamic"}<span>static</span>${"more"}</div>`;
			assert.equal(result, "<div>dynamic<span>static</span>more</div>");
		});

		it("handles edge case with alternating static and dynamic content with escaping", () => {
			const result = safeHtml`<div>${"<script>alert('XSS')</script>"}<span>static</span>${"<img src=x onerror=alert('XSS')>"}</div>`;
			assert.equal(
				result,
				"<div>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;<span>static</span>&lt;img src=x onerror=alert(&#39;XSS&#39;)&gt;</div>",
			);
		});

		it("handles edge case with complex nested falsy values", () => {
			const result = html`<div>${null}${undefined}${false}${0}${""}${NaN}${null}${undefined}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("handles edge case with complex nested falsy values with escaping", () => {
			const result = safeHtml`<div>${null}${undefined}${false}${0}${""}${NaN}${null}${undefined}</div>`;
			assert.equal(result, "<div>0</div>");
		});

		it("handles edge case with mixed truthy and falsy values in complex structure", () => {
			const result = html`<div>${null}<span>${"content"}</span>${undefined}<p>${"more"}</p>${false}</div>`;
			assert.equal(result, "<div><span>content</span><p>more</p></div>");
		});

		it("handles edge case with mixed truthy and falsy values in complex structure with escaping", () => {
			const result = safeHtml`<div>${null}<span>${"<script>alert('XSS')</script>"}</span>${undefined}<p>${"<img src=x onerror=alert('XSS')>"}</p>${false}</div>`;
			assert.equal(
				result,
				"<div><span>&lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;</span><p>&lt;img src=x onerror=alert(&#39;XSS&#39;)&gt;</p></div>",
			);
		});

		it("handles edge case with whitespace-only content", () => {
			const result = html`<div>${"   "}${"content"}${"   "}</div>`;
			assert.equal(result, "<div>   content   </div>");
		});

		it("handles edge case with whitespace-only content with escaping", () => {
			const result = safeHtml`<div>${"   "}${"<script>alert('XSS')</script>"}${"   "}</div>`;
			assert.equal(
				result,
				"<div>   &lt;script&gt;alert(&#39;XSS&#39;)&lt;/script&gt;   </div>",
			);
		});
	});
});
