# Three-Tiered Template Engine Benchmark

Comprehensive performance analysis of JavaScript template engines across three complexity levels.

## Quick Start

```bash
npm install
npm run benchmark
```

## Three-Tiered Testing Approach

This benchmark evaluates template engines across three distinct complexity levels:

### 1. Baseline - Engine Overhead

Static string rendering with no dynamic data to measure pure engine overhead.

### 2. Component - Typical Complexity

Product list component with loops, conditionals, and data processing (20 products).

### 3. Complex - Real-World Application

Full blog application with comprehensive data transformations (86 blog posts).

## Template Engines Tested

This benchmark compares the following template engines:

- **RavenJS Beak** (baseline)
- **EJS** - Embedded JavaScript templates
- **Eta** - Lightweight EJS alternative
- **Handlebars** - Logic-light templates with helpers
- **Mustache** - Logic-less templates (pre-formatted data)
- **Nunjucks** - Jinja-style templates with filters
- **Pug** - Indented DSL
- **doT** - Fast precompiled templates
- **Liquid** - Safe template language

## Why Three Tiers Matter

### Engine Overhead vs Scaling Performance

Different engines excel at different complexity levels:

- **High baseline performance** doesn't guarantee good complex performance
- **Poor baseline performance** might scale better with data complexity
- **Consistent ratios** across tiers indicate predictable scaling behavior

### Real-World Insights

- **Baseline** → Choose for static site generation
- **Component** → Choose for typical React/Vue-style components
- **Complex** → Choose for server-side rendered applications

### Sample Data Complexity

**Baseline:** Static HTML string (no data processing)

**Component:** Product catalog with:

- 20 products with pricing, ratings, categories
- Conditional rendering (stock status, discounts)
- Loops (product attributes, star ratings)
- Data transformations (price formatting)

**Complex:** Blog application with:

- 86 blog posts with full metadata
- Author information and avatars
- Categories, tags, and pagination
- Analytics data and recent activity
- Date formatting and URL encoding

## Results

See [BENCHMARK.md](./BENCHMARK.md) for detailed performance results and analysis.
