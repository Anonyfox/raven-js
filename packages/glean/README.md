# 🔍 Glean

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)

Glean documentation gold from your codebase - JSDoc parsing, validation, and beautiful doc generation.

## What is Glean?

Ravens glean fields after harvest, gathering valuable scattered resources others missed. **Glean** does the same with JSDoc comments scattered throughout your codebase - collecting, organizing, and transforming documentation knowledge into something beautiful and comprehensive.

This is a **RavenJS Activity** - a focused CLI tool you run with your projects to achieve specific outcomes. Glean operates outside your application runtime, analyzing and processing your code's documentation with surgical precision.

## Quick Start

```bash
# Analyze documentation quality
npx @raven-js/glean analyze

# Analyze specific directory
npx @raven-js/glean analyze ./src

# Generate documentation site
npx @raven-js/glean build ./src ./docs

# Enable verbose output
npx @raven-js/glean analyze --verbose
```

## Features

- 🔍 **JSDoc Parsing** - Extract documentation from JavaScript files
- ✅ **Validation** - Ensure JSDoc syntax and completeness
- 📚 **Beautiful Docs** - Generate clean, readable documentation
- 🚫 **Zero Dependencies** - Pure Node.js with no external packages
- ⚡ **Fast** - Optimized for performance and minimal overhead
- 🦅 **Raven Philosophy** - Surgical precision, zero bloat, maximum value

## Usage

Glean provides two core commands: **analyze** for validation and **build** for documentation generation. Both work directly with your codebase using an in-memory class tree for maximum performance.

```bash
# Analyze documentation quality
npx @raven-js/glean analyze ./src

# Build documentation site
npx @raven-js/glean build ./src ./docs

# Enable detailed logging
npx @raven-js/glean analyze --verbose
npx @raven-js/glean build ./src ./docs --verbose
```

## Status

🚧 **In Development** - Core architecture complete, feature implementation in progress.

## Requirements

- Node.js 22.5+
- Modern JavaScript (ESM) codebase

## Philosophy

Glean embodies the RavenJS principle of surgical intelligence - gathering scattered documentation treasures with predatory precision. No framework lock-in, no dependency bloat, just focused tooling that accomplishes its mission and gets out of your way.

## License

MIT © [Anonyfox](https://anonyfox.com)
