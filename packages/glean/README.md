# 🔍 Glean

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Documentation](https://img.shields.io/badge/Documentation-docs.ravenjs.dev/glean-blue.svg)](https://docs.ravenjs.dev/glean)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)
[![ESM Only](https://img.shields.io/badge/ESM-Only-brightgreen.svg)]()
[![Node.js 22.5+](https://img.shields.io/badge/Node.js-22.5+-brightgreen.svg)]()

<div align="center">
  <img src="./media/logo.webp" alt="Glean Logo" width="200" height="200" />
</div>

Glean documentation gold from your codebase - JSDoc parsing, validation, and beautiful doc generation.

## What is Glean?

**Glean** extracts JSDoc comments scattered throughout your codebase, collecting and organizing documentation knowledge into beautiful, comprehensive documentation sites.

This is a **RavenJS Activity** - a focused CLI tool for specific documentation outcomes. Glean operates outside your application runtime, analyzing and processing your code's documentation.

## Quick Start

```bash
# Validate documentation quality
npx @raven-js/glean validate

# Validate specific directory
npx @raven-js/glean validate ./src

# Generate static documentation site
npx @raven-js/glean ssg ./src ./docs

# Start live documentation server
npx @raven-js/glean server

# Enable verbose output
npx @raven-js/glean validate --verbose
```

## Features

- 🔍 **JSDoc Parsing** - Extract documentation from JavaScript files
- ✅ **Validation** - Ensure JSDoc syntax and completeness
- 📚 **Static Generation** - Create deployable documentation sites
- 🚀 **Live Server** - Development server with hot reloading
- 🚫 **Zero Dependencies** - Pure Node.js with no external packages
- ⚡ **Fast** - Optimized for performance and minimal overhead
- 🦅 **Zero Bloat** - Surgical precision, maximum value

## CLI Commands

- `validate` - Analyze JSDoc completeness and quality
- `server` - Start live documentation development server
- `ssg` - Generate deployable static documentation site

## Requirements

- Node.js 22.5+
- Modern JavaScript (ESM) codebase with JSDoc comments

## Documentation That Tools Understand

Write JSDoc that Glean extracts into exceptional documentation. Focus on exported entities—internal helpers need minimal documentation.

**Essential patterns for optimal extraction:**

- **Package.json structure**: Use `exports` field for module organization—`{ ".": "./index.js", "./utils/*": "./lib/utils/*.js" }` creates clean import paths
- **Module README placement**: Place `README.md` in same directory as entry point files for module-specific documentation
- **Rich type expressions**: `@param {Record<string, (data: any) => boolean>} validators` creates navigable documentation
- **Cross-references**: Use `@see {@link OtherFunction}` for automatic linking between related APIs
- **Tagged template documentation**: `@param {TemplateStringsArray} strings` + `@param {...any} values` for template literals
- **Precise unions**: `@param {('json'|'xml'|'csv')} format` instead of generic strings
- **Export typedefs**: Document complex types with `@typedef` and export them for reuse across functions

```javascript
/**
 * Process user data with configurable validation pipeline
 * @param {UserData} userData - Raw user input data
 * @param {ValidationConfig} [config] - Processing configuration
 * @returns {Promise<ProcessedUser>} Validated and transformed user data
 * @throws {ValidationError} When required fields are missing
 * @see {@link validateUserData} for validation-only processing
 * @see {@link UserData} for input data structure
 */
export async function processUser(userData, config = {}) {
  // Implementation
}
```

Glean extracts precise type information, builds cross-reference navigation, and generates import statements from well-structured JSDoc.

## The Raven's Glean

Ravens glean fields after harvest, gathering valuable scattered resources others missed. Glean does the same with your documentation - collecting JSDoc treasures scattered across your codebase into organized, beautiful documentation.

## 🦅 Support RavenJS Development

If you find RavenJS helpful, consider supporting its development:

[![GitHub Sponsors](https://img.shields.io/badge/Sponsor%20on%20GitHub-%23EA4AAA?style=for-the-badge&logo=github&logoColor=white)](https://github.com/sponsors/Anonyfox)

Your sponsorship helps keep RavenJS **zero-dependency**, **modern**, and **developer-friendly**.

---

**Built with ❤️ by [Anonyfox](https://anonyfox.com)**
