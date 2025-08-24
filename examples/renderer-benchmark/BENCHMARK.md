# Three-Tiered Template Engine Benchmark Results

**Generated:** 2025-08-24T09:25:06.628Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine per category

## Benchmark Categories

This benchmark tests template engines across three complexity levels:

1. **Baseline** - Static string rendering to measure pure engine overhead
2. **Component** - Product list with loops, conditionals, and data processing
3. **Complex** - Full blog application with 86 posts and rich metadata

## Baseline Benchmark Results

Measures pure template engine overhead with static HTML content.
**Data complexity:** No dynamic data

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.00 | 8842906 | baseline |
| 2 | **Pug** | 0.00 | 4999150 | 1.77x slower |
| 3 | **Beak (RavenJS)** | 0.00 | 1690326 | 5.23x slower |
| 4 | **Mustache** | 0.00 | 1459590 | 6.06x slower |
| 5 | **Beak2 Compiled** | 0.00 | 1443401 | 6.13x slower |
| 6 | **Beak2 (HTML2)** | 0.00 | 1290447 | 6.85x slower |
| 7 | **Handlebars** | 0.00 | 200941 | 44.01x slower |
| 8 | **EJS** | 0.01 | 83325 | 106.13x slower |
| 9 | **Eta** | 0.02 | 53589 | 165.01x slower |
| 10 | **Nunjucks** | 0.03 | 35464 | 249.35x slower |
| 11 | **Liquid** | 0.06 | 15430 | 573.10x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.01 | 97823 | baseline |
| 2 | **Pug** | 0.03 | 32147 | 3.04x slower |
| 3 | **Eta** | 0.07 | 14172 | 6.90x slower |
| 4 | **Mustache** | 0.07 | 13575 | 7.21x slower |
| 5 | **Beak2 (HTML2)** | 0.17 | 5823 | 16.80x slower |
| 6 | **Beak2 Compiled** | 0.17 | 5793 | 16.89x slower |
| 7 | **Beak (RavenJS)** | 0.18 | 5684 | 17.21x slower |
| 8 | **Handlebars** | 0.19 | 5333 | 18.34x slower |
| 9 | **EJS** | 0.27 | 3680 | 26.58x slower |
| 10 | **Nunjucks** | 0.56 | 1783 | 54.87x slower |
| 11 | **Liquid** | 2.17 | 462 | 211.83x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.12 | 8127 | baseline |
| 2 | **Pug** | 0.19 | 5380 | 1.51x slower |
| 3 | **Eta** | 0.21 | 4754 | 1.71x slower |
| 4 | **Beak2 Compiled** | 0.52 | 1932 | 4.21x slower |
| 5 | **Beak2 (HTML2)** | 0.54 | 1864 | 4.36x slower |
| 6 | **Mustache** | 0.66 | 1526 | 5.33x slower |
| 7 | **Handlebars** | 1.31 | 763 | 10.65x slower |
| 8 | **Beak (RavenJS)** | 1.99 | 503 | 16.15x slower |
| 9 | **EJS** | 2.04 | 491 | 16.55x slower |
| 10 | **Nunjucks** | 2.63 | 380 | 21.41x slower |
| 11 | **Liquid** | 3.75 | 267 | 30.46x slower |

## Performance Analysis

### Engine Scaling Patterns

**Baseline:** doT leads at 0.00ms, 573.1x performance spread
**Component:** doT leads at 0.01ms, 211.8x performance spread
**Complex:** doT leads at 0.12ms, 30.5x performance spread

### Why This Matters

- **Baseline** reveals engine startup costs and core overhead
- **Component** shows real-world single-component performance
- **Complex** demonstrates full application scaling behavior

Engines that maintain relative performance across categories handle complexity well.
Large performance drops from baseline to complex indicate poor algorithmic scaling.

## Test Environment

- **Node.js Version:** v22.5.0
- **Platform:** darwin arm64
- **Caching:** Disabled for all engines to ensure fair comparison
- **Warmup:** 10 iterations before measurement
- **Measurement:** 1000 timed iterations per engine per category

---

*Benchmark generated with the RavenJS renderer-benchmark package*
