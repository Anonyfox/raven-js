# Beak CSS

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**CSS template literals with intelligent value processing and minification.** Automatic camelCase-to-kebab-case conversion, array flattening, and single-line output optimization.

## Purpose

Writing CSS programmatically requires tedious string concatenation, manual property conversion, and whitespace management. Existing CSS-in-JS solutions add runtime overhead, require transpilation, or force architectural decisions.

Beak CSS eliminates preprocessing complexity through native template literals. Write CSS naturally with JavaScript values, get automatic property conversion and minification, deploy without build tools. Arrays become space-separated values, objects become CSS properties, and camelCase converts to kebab-case automatically.

Templates compile to optimized functions for consistent performance, regardless of dynamic content complexity.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import CSS functions and use them as tagged template literals:

```javascript
import { css, style } from "@raven-js/beak/css";

// Basic CSS generation with value interpolation
const theme = css`
  .button {
    color: ${isPrimary ? "#007bff" : "#6c757d"};
    margin: ${[10, 20]}px;
    ${isLarge && { fontSize: "18px", padding: "12px 24px" }}
  }
`;
// → ".button{ color:#007bff; margin:10 20px; font-size:18px; padding:12px 24px; }"

// Object-to-CSS transformation
const styles = css`
  .card {
    ${{
      backgroundColor: "#ffffff",
      borderRadius: [4, 8],
      WebkitTransform: "scale(1.02)",
    }}
  }
`;
// → ".card{ background-color:#ffffff; border-radius:4 8; -webkit-transform:scale(1.02); }"

// Style tag wrapper for HTML insertion
const inlineCSS = style`
  .theme { color: ${darkMode ? "#fff" : "#000"}; }
`;
// → "<style>.theme{ color:#fff; }</style>"
```

**Value processing features:**

- **Arrays**: Space-separated values with recursive flattening
- **Objects**: CSS properties with camelCase→kebab-case conversion
- **Conditionals**: Boolean values filter naturally
- **Vendor prefixes**: WebkitTransform → -webkit-transform

## Performance

Template processing optimized for real-world usage patterns:

- **300KB+ bundles**: Process in ~7ms
- **Single-pass normalization**: Pre-compiled regex patterns
- **V8 optimized**: Monomorphic value processing paths
- **Memory efficient**: Minimal object allocation

Template caching eliminates redundant compilation for repeated usage.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's CSS

Like a raven that efficiently transforms scattered materials into structured constructions, Beak CSS converts diverse JavaScript values into optimized CSS output. Surgical precision in property conversion, automatic cleanup of formatting artifacts.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
