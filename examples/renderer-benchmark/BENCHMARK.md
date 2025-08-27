# Three-Tiered Template Engine Benchmark Results

**Generated:** 2025-08-27T18:12:01.901Z
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
| 1 | **doT** | 0.00 | 8634684 | baseline |
| 2 | **Pug** | 0.00 | 5203807 | 1.66x slower |
| 3 | **Beak (RavenJS)** | 0.00 | 3796363 | 2.27x slower |
| 4 | **Mustache** | 0.00 | 1279951 | 6.75x slower |
| 5 | **Handlebars** | 0.00 | 205661 | 41.99x slower |
| 6 | **EJS** | 0.01 | 133678 | 64.59x slower |
| 7 | **Eta** | 0.02 | 51626 | 167.25x slower |
| 8 | **Nunjucks** | 0.03 | 37324 | 231.34x slower |
| 9 | **Liquid** | 0.07 | 14470 | 596.74x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.01 | 89688 | baseline |
| 2 | **Pug** | 0.03 | 32160 | 2.79x slower |
| 3 | **Beak (RavenJS)** | 0.06 | 16787 | 5.34x slower |
| 4 | **Eta** | 0.07 | 13721 | 6.54x slower |
| 5 | **Mustache** | 0.08 | 12086 | 7.42x slower |
| 6 | **Handlebars** | 0.20 | 4953 | 18.11x slower |
| 7 | **EJS** | 0.28 | 3593 | 24.96x slower |
| 8 | **Nunjucks** | 0.64 | 1566 | 57.27x slower |
| 9 | **Liquid** | 2.51 | 399 | 224.73x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.13 | 7890 | baseline |
| 2 | **Pug** | 0.19 | 5307 | 1.49x slower |
| 3 | **Eta** | 0.22 | 4619 | 1.71x slower |
| 4 | **Mustache** | 0.67 | 1491 | 5.29x slower |
| 5 | **Beak (RavenJS)** | 0.70 | 1419 | 5.56x slower |
| 6 | **Handlebars** | 1.36 | 736 | 10.72x slower |
| 7 | **EJS** | 2.10 | 475 | 16.59x slower |
| 8 | **Nunjucks** | 2.84 | 353 | 22.38x slower |
| 9 | **Liquid** | 4.23 | 236 | 33.39x slower |

## Performance Analysis

### Engine Scaling Patterns

**Baseline:** doT leads at 0.00ms, 596.7x performance spread
**Component:** doT leads at 0.01ms, 224.7x performance spread
**Complex:** doT leads at 0.13ms, 33.4x performance spread

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


## Bundle Size Comparison

Bundle sizes for complex templates (minified + gzipped for production deployment):

| Rank | Engine | Bundle | Minified | Min+Gzip | vs Smallest |
|------|--------|--------|----------|----------|-------------|
| 1 | **beak** | 15.7 KB | 13.8 KB | 4.2 KB | baseline |
| 2 | **dot** | 18.6 KB | 12 KB | 5.2 KB | 1.24x larger |
| 3 | **eta** | 27 KB | 15.5 KB | 6.2 KB | 1.47x larger |
| 4 | **mustache** | 37.1 KB | 26.3 KB | 8.5 KB | 2.03x larger |
| 5 | **ejs** | 50.9 KB | 34.9 KB | 11.4 KB | 2.70x larger |
| 6 | **liquid** | 164.9 KB | 80.4 KB | 25 KB | 5.94x larger |
| 7 | **nunjucks** | 213 KB | 109.9 KB | 32.1 KB | 7.63x larger |
| 8 | **handlebars** | 254.2 KB | 125.5 KB | 38.1 KB | 9.05x larger |
| 9 | **pug** | 1.5 MB | 814.4 KB | 201.1 KB | 47.79x larger |

## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.29ms | 650μs | 641μs | baseline |
| 2 | **dot** | 1.80ms | 120μs | 1.68ms | 2.62x slower |
| 3 | **eta** | 1.96ms | 210μs | 1.75ms | 2.73x slower |
| 4 | **beak** | 3.23ms | 750μs | 2.48ms | 3.87x slower |
| 5 | **ejs** | 4.48ms | 1.94ms | 2.54ms | 3.97x slower |
| 6 | **liquid** | 8.00ms | 3.84ms | 4.16ms | 6.50x slower |
| 7 | **nunjucks** | 9.42ms | 2.60ms | 6.82ms | 10.64x slower |
| 8 | **pug** | 21.5ms | 180μs | 21.3ms | 33.19x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.
---

*Benchmark generated with the RavenJS renderer-benchmark package*
