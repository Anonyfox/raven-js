# Renderer Benchmark

Comprehensive performance comparison of major JavaScript template rendering engines.

## Quick Start

```bash
npm install
npm run benchmark
```

## What's Tested

This benchmark compares the following template engines against identical, complex sample data:

- **RavenJS Beak** (baseline)
- **EJS** - Embedded JavaScript templates
- **Eta** - Lightweight EJS alternative
- **Handlebars** - Logic-light templates with helpers
- **Mustache** - Logic-less templates (pre-formatted data)
- **Nunjucks** - Jinja-style templates with filters
- **Pug** - Indented DSL
- **doT** - Fast precompiled templates
- **Liquid** - Safe template language

## Sample Data

The benchmark uses complex, realistic template features including:

- **Real-world complexity**: Component-like structures, nested conditionals, complex loops
- **Rich data model**: 90 blog posts with full metadata, analytics, user preferences
- **Advanced features**: Pagination, search/filters, recent activity, popular tags
- **Performance optimizations**: Author avatars, formatted numbers, responsive design
- **Accessibility**: ARIA labels, semantic HTML, progressive enhancement
- **Multiple data transformations**: Date formatting, URL encoding, content processing

## Results

See [BENCHMARK.md](./BENCHMARK.md) for detailed performance results and analysis.
