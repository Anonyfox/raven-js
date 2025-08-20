# 🔍 Glean

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)

Glean documentation gold from your codebase - JSDoc parsing, validation, and beautiful doc generation.

## What is Glean?

Ravens glean fields after harvest, gathering valuable scattered resources others missed. **Glean** does the same with JSDoc comments scattered throughout your codebase - collecting, organizing, and transforming documentation knowledge into something beautiful and comprehensive.

This is a **RavenJS Activity** - a focused CLI tool you run with your projects to achieve specific outcomes. Glean operates outside your application runtime, analyzing and processing your code's documentation with surgical precision.

## Quick Start

```bash
# Run on current directory
npx @raven-js/glean

# Analyze specific directory
npx @raven-js/glean ./src

# Enable verbose output
npx @raven-js/glean --verbose
```

## Features

- 🔍 **JSDoc Parsing** - Extract documentation from JavaScript files
- ✅ **Validation** - Ensure JSDoc syntax and completeness
- 📚 **Beautiful Docs** - Generate clean, readable documentation
- 🚫 **Zero Dependencies** - Pure Node.js with no external packages
- ⚡ **Fast** - Optimized for performance and minimal overhead
- 🦅 **Raven Philosophy** - Surgical precision, zero bloat, maximum value

## Usage

Glean analyzes your codebase and processes JSDoc comments to generate comprehensive documentation. It validates syntax, checks for completeness, and outputs beautiful docs in your preferred format.

```bash
# Basic usage
npx @raven-js/glean

# Specify target directory
npx @raven-js/glean ./packages/my-package

# Enable detailed logging
npx @raven-js/glean --verbose

# Check validation only (no output generation)
npx @raven-js/glean --validate-only
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
