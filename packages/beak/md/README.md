# Beak Markdown

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**Markdown template literals with intelligent composition and CommonMark-compliant HTML conversion.** Context-aware formatting, GitHub Flavored Markdown support, and surgical text extraction.

## Purpose

Markdown generation requires context-aware formatting, proper whitespace handling, and reliable HTML conversion. Manual string concatenation leads to formatting inconsistencies and structural errors. Existing markdown libraries add complexity for simple composition tasks.

Beak Markdown provides intelligent template composition with automatic context detection, GitHub Flavored Markdown parsing, and clean text extraction. Template literals handle indentation, reference links, and structural elements automatically. Single-pass HTML conversion optimizes for performance without sacrificing CommonMark compliance.

Clean separation of concerns: markdown composition, HTML rendering, and text extraction as distinct operations.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import markdown functions and use them for composition and conversion:

```javascript
import {
  md,
  markdownToHTML,
  markdownToText,
  code,
  ref,
  table,
} from "@raven-js/beak/md";

// Intelligent markdown composition
const document = md`
  # ${title}

  ${description}

  ## Features
  ${features.map((feature) => md`- ${feature}`)}

  ## Code Example
  ${code("npm install @raven-js/beak", "bash")}

  ${table({
    headers: ["Feature", "Support"],
    rows: features.map((f) => [f.name, f.supported ? "✅" : "❌"]),
  })}
`;

// Convert to HTML (GitHub Flavored Markdown)
const htmlOutput = markdownToHTML(document);
// → '<h1>Title</h1><p>Description</p><h2>Features</h2>...'

// Extract clean plaintext (formatting removal)
const textOutput = markdownToText(document);
// → 'Title\n\nDescription\n\nFeatures\n- Feature 1...'

// Reference links with automatic numbering
const withRefs = md`
  See ${ref("RavenJS", "https://ravenjs.dev")} for more info.
  Also check ${ref("GitHub", "https://github.com/Anonyfox/ravenjs")}.
`;
// → 'See [RavenJS][1] for more info.\nAlso check [GitHub][2].\n\n[1]: https://ravenjs.dev\n[2]: https://github.com/Anonyfox/ravenjs'
```

**Features:**

- **Context-aware composition**: Automatic indentation and formatting
- **GitHub Flavored Markdown**: Full CommonMark compliance with extensions
- **Template caching**: WeakMap-cached compilation for performance
- **Reference management**: Automatic link numbering and collection
- **Table generation**: Clean table syntax with automatic alignment

## Performance

Optimized processing paths for real-world usage:

- **Template composition**: Context-aware with intelligent formatting
- **HTML conversion**: Single-pass AST construction (69K+ ops/sec)
- **Text extraction**: Surgical formatting removal without parsing overhead
- **Memory efficient**: Minimal object allocation, streaming-friendly design

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's Markdown

Like a raven that weaves complex narrative structures from scattered information, Beak Markdown intelligently assembles content with contextual awareness. Automatic formatting and reference management without sacrificing compositional flexibility.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
