# Markdown Module

[![npm version](https://img.shields.io/npm/v/@raven-js/beak)](https://www.npmjs.com/package/@raven-js/beak)

**Triple-purpose markdown toolkit: intelligent composition + fast HTML rendering + surgical text extraction**

## Quick Start

```bash
npm install @raven-js/beak
```

```javascript
import { md, markdownToHTML, markdownToText } from "@raven-js/beak/md";

// Compose markdown with context-aware formatting
const doc = md`# ${title}
Features: ${features.map((f) => md`- ${f}`)}
${code("npm install", "bash")}`;

// Convert to HTML (69K+ ops/sec)
const html = markdownToHTML(doc);

// Extract clean plaintext (surgical formatting removal)
const text = markdownToText(doc);
```

## Architecture

**Clean separation of concerns:**

- `md()` tagged template → markdown composition (markdown → markdown)
- `markdownToHTML()` function → HTML rendering (markdown → HTML)
- `markdownToText()` function → text extraction (markdown → plaintext)

## Markdown Composition

### Tagged Template Literal

Context-aware markdown generation with automatic formatting:

```javascript
import { md, ref, code, table } from "@raven-js/beak/md";

const features = ["Zero deps", "Fast parsing", "100% coverage"];
const benchmark = table(
  ["Parser", "Ops/sec"],
  [
    ["Beak", "69,247"],
    ["Marked", "31,054"],
  ]
);

const readme = md`# ${projectName}

## Features
${features.map((f) => md`- **${f}**`)}

## Performance
${benchmark}

## Installation
${code("npm install @raven-js/beak", "bash")}

See ${ref("documentation", "docs")} for details.

[docs]: https://ravenjs.dev/beak
`;
```

**Output** (clean markdown):

````markdown
# My Project

## Features

- **Zero deps**
- **Fast parsing**
- **100% coverage**

## Installation

```bash
npm install @raven-js/beak
```
````

See [documentation][docs] for details.

[docs]: https://docs.ravenjs.dev/beak

````

### Helper Functions

```javascript
// Reference links
ref('text', 'ref-id')        // → [text][ref-id]

// Code blocks
code('console.log()', 'js')  // → ```js\nconsole.log()\n```

// Tables
table(['A', 'B'], [['1', '2'], ['3', '4']])
// → | A | B |\n|---|---|\n| 1 | 2 |\n| 3 | 4 |
````

### Context Intelligence

**Automatic formatting based on surrounding context:**

```javascript
// Root context → paragraph breaks
md`${title}\n\n${content}`;

// List context → newline separation
md`${items.map((i) => md`- ${i}`)}`; // Clean list formatting

// Array handling
md`Features:\n${["Fast", "Lean"].map((f) => md`- ${f}`)}`;
```

## HTML Conversion

### Fast Markdown Parser

**CommonMark-compliant, two-pass AST architecture:**

```javascript
import { markdownToHTML } from "@raven-js/beak";

const markdown = `# Heading
**Bold** and *italic* text with [links](url).

- List item 1
- List item 2

\`\`\`javascript
console.log('code');
\`\`\``;

const html = markdownToHTML(markdown);
// → <h1>Heading</h1>\n<p><strong>Bold</strong>...
```

### Supported Features

| Feature           | Support | Example                                                  |
| ----------------- | ------- | -------------------------------------------------------- |
| **Headings**      | ✅      | `# H1` → `<h1>H1</h1>`                                   |
| **Emphasis**      | ✅      | `**bold**` → `<strong>bold</strong>`                     |
| **Links**         | ✅      | `[text](url)` → `<a href="url">text</a>`                 |
| **Code**          | ✅      | `` `code` `` → `<code>code</code>`                       |
| **Fenced blocks** | ✅      | ` ```js\ncode\n``` ` → `<pre><code class="language-js">` |
| **Lists**         | ✅      | `- item` → `<ul><li>item</li></ul>`                      |
| **Tables**        | ✅      | `\| A \| B \|` → `<table><thead>...`                     |
| **Blockquotes**   | ✅      | `> quote` → `<blockquote>quote</blockquote>`             |
| **HTML blocks**   | ✅      | `<div>content</div>` (preserved)                         |
| **References**    | ✅      | `[text][ref]` + `[ref]: url`                             |
| **Escaping**      | ✅      | `\*literal\*` → `*literal*`                              |
| **Autolinks**     | ✅      | `<https://url>` → `<a href="https://url">`               |

```javascript
// Performance test
import { markdownToHTML } from "@raven-js/beak";

const iterations = 10000;
const markdown = "# Test\n**Bold** text with [link](url)\n- List item";

console.time("parse");
for (let i = 0; i < iterations; i++) {
  markdownToHTML(markdown);
}
console.timeEnd("parse"); // ~144ms for 10K iterations
```

## Text Conversion

### Surgical Plaintext Extraction

**Zero formatting artifacts, maximum content preservation:**

```javascript
import { markdownToText } from "@raven-js/beak/md";

const markdown = `# Project Overview

This is a **bold** statement with *emphasis* and [links](url).

- Feature 1: Fast parsing
- Feature 2: Zero dependencies
- Feature 3: 100% test coverage

\`\`\`javascript
console.log('code example');
\`\`\`

| Component | Status |
|-----------|--------|
| Parser | ✅ Ready |
| Renderer | ✅ Ready |

> Important: Always test your implementation.`;

const plaintext = markdownToText(markdown);
console.log(plaintext);
```

**Output** (clean plaintext):

```
Project Overview

This is a bold statement with emphasis and links.

- Feature 1: Fast parsing
- Feature 2: Zero dependencies
- Feature 3: 100% test coverage

console.log('code example');

Component: Parser, Status: Ready
Component: Renderer, Status: Ready

Important: Always test your implementation.
```

### Text Extraction Features

**Surgical formatting removal:**

- **Preserves**: Content flow, paragraph breaks, list markers (`- `), meaningful structure
- **Removes**: All emphasis markers (`**bold**`, `*italic*`), link syntax, image syntax, HTML tags
- **Converts**: Tables → key-value pairs, blockquotes → plain text, code blocks → raw content
- **Output**: Arbitrary-width reflowable text optimized for search indexing and accessibility

**Common use cases:**

- Full-text search indexing
- Content summaries and excerpts
- Screen reader optimization
- Plain text email generation
- Content analysis and processing

## Implementation Notes

**Architecture decisions:**

- **AST-first**: Build complete syntax tree, then transform to HTML
- **Reference resolution**: Two-pass allows forward reference links
- **HTML safety**: Automatic escaping prevents XSS
- **Placeholder strategy**: Protected content during inline processing
- **V8 optimization**: Monomorphic functions, minimal allocations

**CommonMark compliance:**

- Handles edge cases: nested emphasis, link precedence, table alignment
- Reference-style links with forward declarations
- Proper HTML block recognition vs autolinks
- Escaped character handling

## API Reference

```typescript
// Markdown composition
function md(template: TemplateStringsArray, ...values: any[]): string;
function ref(text: string, ref: string): RefObject;
function code(code: string, language?: string): CodeObject;
function table(headers: string[], rows: string[][]): TableObject;

// HTML conversion
function markdownToHTML(markdown: string): string;

// Text extraction
function markdownToText(markdown: string): string;
```

---

_Part of the [RavenJS](https://ravenjs.dev) toolkit_
