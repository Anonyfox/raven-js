# Beak Shell

[![Website](https://img.shields.io/badge/ravenjs.dev-000000?style=flat&logo=firefox&logoColor=white)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/docs-ravenjs.dev%2Fbeak-blue.svg)](https://docs.ravenjs.dev/beak)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/ravenjs)
[![ESM Only](https://img.shields.io/badge/ESM-Only-purple.svg)](https://nodejs.org/api/esm.html)
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-green.svg)](https://nodejs.org/)

**Shell command assembly with array joining and whitespace normalization.** Transparent flag handling, conditional argument filtering, and template formatting cleanup.

## Purpose

Shell command construction requires tedious array joining, conditional flag handling, and whitespace management. Manual string building leads to spacing errors and complex conditional logic. Existing command builders add complexity for simple operations.

Beak Shell eliminates manual concatenation through intelligent template processing. Arrays become space-separated arguments, falsy values filter automatically, and whitespace normalizes consistently. No escaping applied - developer maintains full control over security considerations.

Template caching ensures consistent performance regardless of command complexity.

## Installation

```bash
npm install @raven-js/beak
```

## Usage

Import shell functions and use them as tagged template literals:

```javascript
import { sh } from "@raven-js/beak/sh";

// Array flag handling with automatic joining
const flags = ["-la", "--color=always"];
const files = ["src/", "test/"];
const cmd = sh`ls ${flags} ${files}`;
// → "ls -la --color=always src/ test/"

// Conditional flags with automatic filtering
const verbose = true;
const quiet = false;
const flags = ["-v", verbose && "--debug", quiet && "--quiet"];
const result = sh`npm install ${flags}`;
// → "npm install -v --debug"

// Docker command assembly
const env = ["NODE_ENV=production", "PORT=3000"];
const mounts = ["-v", "/data:/app/data", "-v", "/logs:/app/logs"];
const dockerCmd = sh`docker run ${env} ${mounts} -p 3000:3000 myapp:latest`;
// → "docker run NODE_ENV=production PORT=3000 -v /data:/app/data -v /logs:/app/logs -p 3000:3000 myapp:latest"
```

**Value processing:**

- **Arrays**: Space-separated with recursive flattening
- **Falsy filtering**: `null`, `undefined`, `false`, `""` become empty
- **Whitespace cleanup**: Multiple spaces collapse, edges trimmed
- **No escaping**: Developer responsible for security

⚠️ **Security Notice**: No escaping applied. Validate inputs before use with untrusted data.

## Requirements

- **Node.js:** 22.5+ (leverages latest platform primitives)
- **Browsers:** ES2020+ (modern baseline, no legacy compromise)
- **Dependencies:** Absolutely zero

## The Raven's Shell

Like a raven that efficiently assembles complex structures from scattered materials, Beak Shell transforms arrays and conditions into clean command strings. Automatic filtering and normalization without sacrificing developer control.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
