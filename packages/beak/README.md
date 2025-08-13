# 🪶 Beak: Craft Your Web's Tale

Beak is a lightweight, zero-dependency templating toolkit for modern web development. It's designed to make your coding experience as smooth as a raven's flight, whether you're building a simple landing page or a complex web app.

## Why Beak?

- 🚀 **Zero BS**: No dependencies, no bloat. Just pure, unadulterated templating goodness.
- 🧠 **Smart Defaults**: Escapes HTML when you need it, doesn't when you don't. We trust your judgment.
- 🌓 **Isomorphic**: Use it on the server, in the browser, or both. Beak doesn't discriminate.
- 🎭 **Flexible AF**: It's just JavaScript. If you can dream it, you can template it.
- 📄 **Direct ESM Imports**: Include non-code text elements in JS files for direct import/export without having to use magical file loaders.
- 📦 **Bundler Friendly**: Works natively with bundlers like esbuild to include things like templates or styles.
- ✨ **JSX-like Syntax**: Enjoy the familiar and expressive JSX-like syntax for your templates.
- 🛠️ **VSCode Plugin**: Has a VSCode plugin for syntax highlighting to enhance your development experience.

## Quick Start

```bash
npm install @raven-js/beak
```

That's it. Welcome to the future, fledgling.

## Show Me the Code

```javascript
import { html, css } from "@raven-js/beak";

const styles = css`
  h1 {
    color: rebeccapurple;
  }
`;

const Greeting = (name) => html`
  <style>
    ${styles}
  </style>
  <h1>Hey there, ${name}!</h1>
`;

console.log(Greeting("Indie Hacker"));
// Output: <style>h1 {color:rebeccapurple;}</style><h1>Hey there, Indie Hacker!</h1>
```

## Core Features

### HTML Templating

```javascript
import { html } from "@raven-js/beak";

const user = { name: "Raven", power: 9000 };
const template = html`
  <div>
    ${user.name}'s power level: ${user.power > 9000 ? "OVER 9000!" : user.power}
  </div>
`;
```

### CSS-in-JS

```javascript
import { html, css } from "@raven-js/beak";

const styles = css`
  .danger {
    color: red;
    font-weight: bold;
    text-transform: uppercase;
  }
`;

const template = html`
  <style>
    ${styles}
  </style>
  <span class="danger">Danger, Will Robinson!</span>
`;
```

### Safe HTML (XSS Prevention)

```javascript
import { safeHtml } from "@raven-js/beak";

const userInput = '<script>alert("nice try")</script>';
const safe = safeHtml`<div>${userInput}</div>`;
// Output: <div>&lt;script&gt;alert("nice try")&lt;/script&gt;</div>
```

### JavaScript Snippets

```javascript
import { js, script } from "@raven-js/beak";

const variableName = "count";
const value = 10;
const snippet = js`
  let ${variableName} = ${value};
  console.log(${variableName});
`;

const scriptTag = script`${snippet}`;
// Output: <script type="text/javascript">let count = 10; console.log(count);</script>
```

### Markdown Parsing

```javascript
import { md } from "@raven-js/beak";

const content = md`
  # Hello World

  This is **bold** text and this is _italic_ text.
`;
// Output: <h1>Hello World</h1><p>This is <strong>bold</strong> text and this is <em>italic</em> text.</p>
```

### SQL Query Building

```javascript
import { sql } from "@raven-js/beak";

const tableName = "users";
const userId = 42;
const query = sql`
  SELECT * FROM ${tableName}
  WHERE id = ${userId};
`;
// Output: SELECT * FROM users WHERE id = 42;
```

## Advanced Usage

### Components

```javascript
import { html } from "@raven-js/beak";

const Header = (title) => html`<header><h1>${title}</h1></header>`;
const Footer = () =>
  html`<footer>© ${new Date().getFullYear()} Indie Corp</footer>`;

const Page = (content) => html`
  ${Header("Welcome to the Thunderdome")}
  <main>${content}</main>
  ${Footer()}
`;

const content = html`<p>Where two templates enter, one template leaves.</p>`;
console.log(Page(content));
```

### Loops and Conditionals

```javascript
import { html } from "@raven-js/beak";

const todos = ["Build MVP", "Get users", "Profit"];
const isGenius = true;

const template = html`
  <ul>
    ${todos.map((todo) => html`<li>${todo}</li>`)}
  </ul>
  <div>${isGenius ? "Welcome, Einstein!" : "Hello, mere mortal."}</div>
`;
```

## Why Should You Care?

1. **It's Fast**: Beak doesn't mess around with virtual DOMs or diffing algorithms. It's string interpolation on steroids.
2. **It's Tiny**: The entire library could fit in a tweet. Okay, maybe a thread of tweets, but you get the idea.
3. **It's Flexible**: Use it for full-page renders, partial updates, or even as a lightweight JSX alternative.

Now go forth and build something awesome. Your MVP awaits!

---

License: MIT, because sharing is caring, and ravens always share their shiny objects.

---

<div style="text-align: center;">
  Made with <span style="color: red;">♥</span> by <a href="https://anonyfox.com">Anonyfox e.K.</a>
</div>
