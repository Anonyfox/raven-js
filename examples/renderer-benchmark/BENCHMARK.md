# Three-Tiered Template Engine Benchmark Results

**Generated:** 2025-08-24T09:28:58.719Z
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
| 1 | **doT** | 0.00 | 9334802 | baseline |
| 2 | **Pug** | 0.00 | 5110593 | 1.83x slower |
| 3 | **Beak2 Compiled** | 0.00 | 3362916 | 2.78x slower |
| 4 | **Beak2 (HTML2)** | 0.00 | 1835792 | 5.08x slower |
| 5 | **Beak (RavenJS)** | 0.00 | 1618322 | 5.77x slower |
| 6 | **Mustache** | 0.00 | 1493565 | 6.25x slower |
| 7 | **Handlebars** | 0.01 | 197347 | 47.30x slower |
| 8 | **EJS** | 0.01 | 102596 | 90.99x slower |
| 9 | **Eta** | 0.02 | 54223 | 172.15x slower |
| 10 | **Nunjucks** | 0.03 | 38655 | 241.49x slower |
| 11 | **Liquid** | 0.07 | 15300 | 610.12x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.01 | 98558 | baseline |
| 2 | **Pug** | 0.03 | 32773 | 3.01x slower |
| 3 | **Beak2 Compiled** | 0.05 | 21267 | 4.63x slower |
| 4 | **Beak2 (HTML2)** | 0.05 | 19841 | 4.97x slower |
| 5 | **Eta** | 0.07 | 14227 | 6.93x slower |
| 6 | **Mustache** | 0.07 | 13580 | 7.26x slower |
| 7 | **Beak (RavenJS)** | 0.17 | 5725 | 17.22x slower |
| 8 | **Handlebars** | 0.19 | 5351 | 18.42x slower |
| 9 | **EJS** | 0.27 | 3750 | 26.28x slower |
| 10 | **Nunjucks** | 0.56 | 1791 | 55.04x slower |
| 11 | **Liquid** | 2.14 | 467 | 211.22x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.12 | 8076 | baseline |
| 2 | **Pug** | 0.18 | 5426 | 1.49x slower |
| 3 | **Eta** | 0.21 | 4829 | 1.67x slower |
| 4 | **Beak2 Compiled** | 0.51 | 1949 | 4.14x slower |
| 5 | **Beak2 (HTML2)** | 0.53 | 1885 | 4.29x slower |
| 6 | **Mustache** | 0.65 | 1537 | 5.25x slower |
| 7 | **Handlebars** | 1.29 | 775 | 10.42x slower |
| 8 | **EJS** | 1.94 | 514 | 15.70x slower |
| 9 | **Beak (RavenJS)** | 1.97 | 508 | 15.91x slower |
| 10 | **Nunjucks** | 2.60 | 385 | 20.99x slower |
| 11 | **Liquid** | 3.84 | 260 | 31.02x slower |

## Performance Analysis

### Engine Scaling Patterns

**Baseline:** doT leads at 0.00ms, 610.1x performance spread
**Component:** doT leads at 0.01ms, 211.2x performance spread
**Complex:** doT leads at 0.12ms, 31.0x performance spread

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
