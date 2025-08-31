# Beak JavaScript

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**JavaScript template literals with value filtering and script tag variants.** Array flattening, falsy value filtering, and automatic script wrapper generation.

## Purpose

JavaScript code generation requires consistent value processing, array handling, and proper script tag formatting. Manual string concatenation leads to inconsistent spacing and type coercion issues. Script tags need proper attributes for loading behavior.

Beak JavaScript provides intelligent value processing with automatic array flattening and falsy value filtering. Script tag variants handle defer, async, and standard loading patterns consistently. Template processing ensures reliable JavaScript output without manual formatting concerns.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import JavaScript functions and use them as tagged template literals:

```javascript
import { js, script, scriptDefer, scriptAsync } from "@raven-js/beak/js";

// Basic JavaScript template processing
const code = js`
  const ${varName} = ${count};
  const items = [${values}];
`;
// → "const userCount = 42; const items = [1,2,3];"

// Script tag wrappers with automatic type attributes
const embedded = script`
  console.log(${message});
  document.addEventListener('load', ${handler});
`;
// → '<script type="text/javascript">console.log("hello"); document.addEventListener('load', handleLoad);</script>'

// Deferred script loading
const deferred = scriptDefer`
  document.getElementById('${elementId}').focus();
`;
// → '<script type="text/javascript" defer>document.getElementById("app").focus();</script>'

// Async script loading
const async = scriptAsync`
  fetch('/api', { data: ${JSON.stringify(payload)} });
`;
// → '<script type="text/javascript" async>fetch('/api', { data: {"key":"value"} });</script>'
```

**Value processing features:**

- **Arrays**: Automatic flattening with recursive processing
- **Falsy filtering**: `null`, `undefined`, `false`, `""` become empty (except `0`)
- **Whitespace**: Leading/trailing whitespace trimmed automatically
- **Type safety**: Consistent string conversion for all value types

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's JavaScript

Like a raven that methodically processes complex materials into usable forms, Beak JavaScript transforms diverse value types into consistent code output. Automatic filtering and formatting without sacrificing flexibility or control.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
