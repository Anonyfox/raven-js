# 🦜 Beak: Zero-Dependency Templating for Modern JavaScript

_The raven's beak speaks in many tongues - HTML, CSS, SQL, and more. No dependencies, no bloat, just pure templating power._

[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM](https://img.shields.io/badge/ESM-Only-blue.svg)](https://nodejs.org/api/esm.html)
[![Node.js](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

## What is Beak?

Beak is a **zero-dependency templating toolkit** that leverages JavaScript's tagged template literals to provide powerful, flexible templating for modern web development. It's designed for developers who want the expressiveness of JSX without the framework overhead.

**No dependencies. No transpilation. No bullshit.**

## Quick Start

```bash
npm install @raven-js/beak
```

```javascript
import { html, css } from "@raven-js/beak";

const styles = css`
  .greeting {
    color: rebeccapurple;
    font-weight: bold;
  }
`;

const Greeting = (name) => html`
  <style>
    ${styles}
  </style>
  <h1 class="greeting">Hello, ${name}!</h1>
`;

console.log(Greeting("Raven"));
// Output: <style>.greeting{color:rebeccapurple;font-weight:bold}</style><h1 class="greeting">Hello, Raven!</h1>
```

## Core Features

### 🎨 HTML Templating

```javascript
import { html, safeHtml } from "@raven-js/beak";

// Basic HTML templating
const user = { name: "Raven", power: 9000 };
const template = html`
  <div>
    ${user.name}'s power level: ${user.power > 9000 ? "OVER 9000!" : user.power}
  </div>
`;

// XSS-safe HTML for untrusted input
const userInput = '<script>alert("nice try")</script>';
const safe = safeHtml`<div>${userInput}</div>`;
// Output: <div>&lt;script&gt;alert("nice try")&lt;/script&gt;</div>
```

### 🎭 CSS-in-JS

```javascript
import { html, css, style } from "@raven-js/beak";

// CSS templating
const buttonStyles = css`
  .btn {
    padding: 12px 24px;
    border: none;
    border-radius: 6px;
    background: linear-gradient(45deg, #667eea, #764ba2);
    color: white;
    cursor: pointer;
  }
`;

// Inline styles with style tag
const component = html`
  ${style`${buttonStyles}`}
  <button class="btn">Click me</button>
`;
```

### 💻 JavaScript Snippets

```javascript
import { js, script, scriptDefer, scriptAsync } from "@raven-js/beak";

// JavaScript code generation
const variableName = "count";
const value = 10;
const snippet = js`
  let ${variableName} = ${value};
  console.log(${variableName});
`;

// Script tags with different loading strategies
const normalScript = script`${snippet}`;
const deferredScript = scriptDefer`${snippet}`;
const asyncScript = scriptAsync`${snippet}`;
```

### 📝 Markdown Parsing

```javascript
import { md } from "@raven-js/beak";

const content = md`
  # Welcome to RavenJS

  This is **bold** text and this is _italic_ text.

  - Feature 1
  - Feature 2
  - Feature 3
`;

// Output: <h1>Welcome to RavenJS</h1><p>This is <strong>bold</strong> text...</p>
```

### 🗄️ SQL Query Building

```javascript
import { sql } from "@raven-js/beak";

const tableName = "users";
const userId = 42;
const query = sql`
  SELECT * FROM ${tableName}
  WHERE id = ${userId}
  AND active = true;
`;
```

## Advanced Patterns

### Component Architecture

```javascript
import { html } from "@raven-js/beak";

// Reusable components
const Header = (title) => html`
  <header>
    <h1>${title}</h1>
    <nav>
      <a href="/">Home</a>
      <a href="/about">About</a>
    </nav>
  </header>
`;

const Footer = () => html`
  <footer>© ${new Date().getFullYear()} RavenJS</footer>
`;

// Page composition
const Page = (content) => html`
  ${Header("Welcome to the Nest")}
  <main>${content}</main>
  ${Footer()}
`;
```

### Conditional Rendering & Loops

```javascript
import { html } from "@raven-js/beak";

const todos = ["Build MVP", "Get users", "Profit"];
const isLoggedIn = true;

const template = html`
  <div>
    ${isLoggedIn ? html`<p>Welcome back!</p>` : html`<p>Please log in.</p>`}

    <ul>
      ${todos.map((todo) => html`<li>${todo}</li>`)}
    </ul>
  </div>
`;
```

## Package Structure

Beak is organized into three main modules:

### Core (`@raven-js/beak`)

The main templating functions:

- `html` / `safeHtml` - HTML templating with optional XSS protection
- `css` / `style` - CSS-in-JS templating
- `js` / `script` / `scriptDefer` / `scriptAsync` - JavaScript code generation
- `md` - Markdown to HTML conversion
- `sql` - SQL query building

### Caws (`@raven-js/beak/caws`)

Pre-built components for common use cases:

- `SeoMetatags` - Social media meta tag generation

### Bootstrap (`@raven-js/beak/bootstrap`)

Ready-to-use Bootstrap 5 components:

- `Hero`, `Intro`, `FeatureGrid`, `FeatureShowcase`
- `Testimonials`, `LogoCloud`, `PricingSinglePlan`, `PricingTable`
- `CTA`, `FAQs`, `CodeExample`

## Why Choose Beak?

### For Developers Who Are Tired Of:

- **Framework bloat** - Importing entire libraries for simple templating
- **Build complexity** - Transpilation layers that hide what your code does
- **Dependency hell** - Security vulnerabilities from transitive dependencies
- **Lock-in** - Being forced into specific paradigms and toolchains

### Beak Offers:

- **Zero dependencies** - No external packages to maintain or secure
- **Modern JavaScript** - Uses ESNext features without transpilation
- **Perfect tree-shaking** - Import only what you need
- **Type safety** - Full IntelliSense support via JSDoc
- **Performance** - Nearly as fast as string concatenation
- **Flexibility** - Use anywhere: server, client, or both

## Performance

Beak is designed for speed:

- **No virtual DOM** - Direct string interpolation
- **No runtime overhead** - Functions are just template literal processors
- **Minimal memory footprint** - No complex data structures
- **Bundle-friendly** - Works seamlessly with esbuild, webpack, and other bundlers

## Browser Support

Beak requires modern JavaScript environments:

- **Node.js**: 22.5+
- **Browsers**: All modern browsers with ES2020+ support
- **No polyfills needed** - Uses native template literals and modern JS features

## TypeScript Support

Full IntelliSense support without TypeScript compilation:

```javascript
import { html } from '@raven-js/beak';

// Full autocomplete and type checking in IDEs
const template = html`<div>${/* TypeScript knows this should be a string */}</div>`;
```

## Contributing

Beak follows the RavenJS philosophy:

- Keep it simple and focused
- Zero dependencies
- Modern JavaScript only
- Self-documenting APIs
- Comprehensive test coverage

## License

MIT License - see [LICENSE](LICENSE.txt) for details.

---

_Beak: Because sometimes the best way to speak is to keep it simple._

<div align="center">
  <sub>Built with ❤️ by <a href="https://anonyfox.com">Anonyfox</a></sub>
</div>
