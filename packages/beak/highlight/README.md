# Beak Highlight

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**Zero-dependency syntax highlighting for code documentation generation.** Bootstrap-semantic HTML output with consistent color mapping across JavaScript, HTML, CSS, SQL, XML, JSON, and Shell.

## Purpose

Syntax highlighting for documentation requires consistent theming, reliable parsing, and minimal dependencies. Existing highlighters add build complexity, require custom CSS maintenance, or introduce security vulnerabilities through complex parsing logic.

Beak Highlight provides semantic HTML output using Bootstrap color classes that inherit from user themes automatically. Fast token-based parsing without AST construction eliminates security risks while maintaining parsing accuracy. Bootstrap semantic mapping ensures consistent color meaning across all supported languages.

Clean HTML spans with semantic class names integrate seamlessly with existing documentation toolchains without custom CSS requirements.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import language-specific highlighters and process source code:

```javascript
import {
  highlightJS,
  highlightHTML,
  highlightCSS,
  highlightSQL,
} from "@raven-js/beak/highlight";

// JavaScript syntax highlighting
const jsCode = `
function greet(name) {
  console.log(\`Hello, \${name}!\`);
  return true;
}
`;
const highlighted = highlightJS(jsCode);
// → '<span class="text-primary">function</span> <span class="text-body">greet</span>(<span class="text-body">name</span>) { ... }'

// CSS highlighting with semantic color mapping
const cssCode = `
.button {
  background-color: #007bff;
  padding: 10px 20px;
}
`;
const styledCSS = highlightCSS(cssCode);

// SQL highlighting with keyword detection
const sqlCode = `
SELECT u.name, u.email FROM users u
WHERE u.active = true
ORDER BY u.created_at DESC;
`;
const styledSQL = highlightSQL(sqlCode);

// HTML highlighting with attribute processing
const htmlCode = `
<div class="container" id="main">
  <h1>Welcome</h1>
</div>
`;
const styledHTML = highlightHTML(htmlCode);
```

**Bootstrap semantic mapping:**

| Token Type | Bootstrap Class  | Purpose               | Examples                        |
| ---------- | ---------------- | --------------------- | ------------------------------- |
| Keywords   | `text-primary`   | Language control flow | `function`, `SELECT`, `<div>`   |
| Strings    | `text-success`   | Data literals         | `"hello"`, `'world'`            |
| Functions  | `text-info`      | Callable identifiers  | `console.log`, `getElementById` |
| Numbers    | `text-warning`   | Numeric literals      | `42`, `true`, `false`           |
| Comments   | `text-muted`     | Documentation         | `// comment`, `/* block */`     |
| Operators  | `text-secondary` | Syntax structure      | `{}`, `()`, `=`, `+`            |
| Variables  | `text-body`      | User-defined names    | `myVar`, `userName`             |

## Language Support

**Comprehensive coverage for web technologies:**

- **JavaScript**: ES2020+ syntax, template literals, arrow functions, async/await
- **HTML**: Elements, attributes, entities, DOCTYPE declarations
- **CSS**: Selectors, properties, values, at-rules, media queries
- **SQL**: DML/DDL keywords, functions, operators, string literals
- **XML**: Elements, attributes, CDATA sections, processing instructions
- **JSON**: Objects, arrays, primitives, proper value detection
- **Shell**: Commands, flags, variables, pipes, redirections

Each language implementation optimized for documentation use cases with semantic consistency.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's Highlight

Like a raven that identifies and categorizes distinct elements within complex environments, Beak Highlight recognizes code structures with precision. Semantic classification without the overhead of complex parsing engines.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
