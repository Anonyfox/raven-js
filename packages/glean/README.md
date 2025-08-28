# 🔍 Glean

[![Website](https://img.shields.io/badge/Website-ravenjs.dev-blue.svg)](https://ravenjs.dev)
[![Zero Dependencies](https://img.shields.io/badge/Zero-Dependencies-brightgreen.svg)](https://github.com/Anonyfox/raven-js)

Glean documentation gold from your codebase - JSDoc parsing, validation, and beautiful doc generation.

## What is Glean?

Ravens glean fields after harvest, gathering valuable scattered resources others missed. **Glean** does the same with JSDoc comments scattered throughout your codebase - collecting, organizing, and transforming documentation knowledge into something beautiful and comprehensive.

This is a **RavenJS Activity** - a focused CLI tool you run with your projects to achieve specific outcomes. Glean operates outside your application runtime, analyzing and processing your code's documentation with surgical precision.

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
- 🦅 **Raven Philosophy** - Surgical precision, zero bloat, maximum value

## Commands

Glean provides three essential commands for complete documentation workflow:

### `validate` - JSDoc Quality Analysis

Analyze your codebase for JSDoc completeness and quality issues.

```bash
# Validate current directory
npx @raven-js/glean validate

# Validate specific directory
npx @raven-js/glean validate ./src

# Detailed analysis with verbose output
npx @raven-js/glean validate ./src --verbose
```

### `ssg` - Static Site Generation

Generate a complete static documentation website ready for deployment.

```bash
# Generate documentation site
npx @raven-js/glean ssg ./src ./docs

# Generate with custom domain for SEO
npx @raven-js/glean ssg ./src ./docs --domain myproject.dev

# Verbose output for deployment guidance
npx @raven-js/glean ssg ./src ./docs --domain myproject.dev --verbose
```

### `server` - Live Documentation Server

Start a development server for real-time documentation preview.

```bash
# Start server for current directory
npx @raven-js/glean server

# Start server for specific package
npx @raven-js/glean server ./my-package

# Custom port and domain
npx @raven-js/glean server ./src --port 8080 --domain docs.local
```

## Workflow

**1. Validate** → **2. Develop** → **3. Deploy**

```bash
# 1. Check documentation quality
npx @raven-js/glean validate ./src

# 2. Preview during development
npx @raven-js/glean server ./src

# 3. Generate for production deployment
npx @raven-js/glean ssg ./src ./docs --domain myproject.dev
```

## Deployment

The `ssg` command generates a complete static site that can be deployed to any hosting service:

- **GitHub Pages** - Deploy the output folder directly
- **Netlify/Vercel** - Drag & drop the generated folder
- **CDN/S3** - Upload static files for global distribution
- **Any HTTP server** - Serve the folder contents

## Requirements

- Node.js 22.5+
- Modern JavaScript (ESM) codebase with JSDoc comments

## Philosophy

Glean embodies the RavenJS principle of surgical intelligence - gathering scattered documentation treasures with predatory precision. No framework lock-in, no dependency bloat, just focused tooling that accomplishes its mission and gets out of your way.

Built from zero external dependencies, Glean survives ecosystem changes that kill other documentation tools. When frameworks break, ravens adapt and thrive.

## License

MIT © [Anonyfox](https://anonyfox.com)
