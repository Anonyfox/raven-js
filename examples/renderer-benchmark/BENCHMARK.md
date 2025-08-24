# Three-Tiered Template Engine Benchmark Results

**Generated:** 2025-08-24T18:57:37.540Z
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
| 1 | **doT** | 0.00 | 8583249 | baseline |
| 2 | **Pug** | 0.00 | 5258619 | 1.63x slower |
| 3 | **Beak (RavenJS)** | 0.00 | 4659984 | 1.84x slower |
| 4 | **Handlebars** | 0.01 | 184295 | 46.57x slower |
| 5 | **EJS** | 0.01 | 140659 | 61.02x slower |
| 6 | **Mustache** | 0.02 | 51853 | 165.53x slower |
| 7 | **Nunjucks** | 0.03 | 29558 | 290.38x slower |
| 8 | **Liquid** | 0.06 | 15692 | 546.97x slower |
| 9 | **Eta** | 0.16 | 6450 | 1330.66x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.01 | 94882 | baseline |
| 2 | **Pug** | 0.03 | 33218 | 2.86x slower |
| 3 | **Beak (RavenJS)** | 0.07 | 15102 | 6.28x slower |
| 4 | **Eta** | 0.07 | 14148 | 6.71x slower |
| 5 | **Mustache** | 0.07 | 13569 | 6.99x slower |
| 6 | **Handlebars** | 0.19 | 5382 | 17.63x slower |
| 7 | **EJS** | 0.27 | 3694 | 25.69x slower |
| 8 | **Nunjucks** | 0.57 | 1754 | 54.09x slower |
| 9 | **Liquid** | 2.15 | 465 | 204.02x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.12 | 8196 | baseline |
| 2 | **Pug** | 0.18 | 5484 | 1.49x slower |
| 3 | **Eta** | 0.21 | 4755 | 1.72x slower |
| 4 | **Mustache** | 0.63 | 1575 | 5.20x slower |
| 5 | **Beak (RavenJS)** | 0.68 | 1481 | 5.53x slower |
| 6 | **Handlebars** | 1.28 | 782 | 10.48x slower |
| 7 | **EJS** | 2.01 | 498 | 16.45x slower |
| 8 | **Nunjucks** | 2.65 | 377 | 21.73x slower |
| 9 | **Liquid** | 3.91 | 256 | 32.01x slower |

## Performance Analysis

### Engine Scaling Patterns

**Baseline:** doT leads at 0.00ms, 1330.7x performance spread
**Component:** doT leads at 0.01ms, 204.0x performance spread
**Complex:** doT leads at 0.12ms, 32.0x performance spread

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
| 6 | **liquid** | 164.9 KB | 80.4 KB | 25 KB | 5.95x larger |
| 7 | **nunjucks** | 213 KB | 109.9 KB | 32.1 KB | 7.63x larger |
| 8 | **handlebars** | 254.2 KB | 125.5 KB | 38.1 KB | 9.06x larger |
| 9 | **pug** | 1.5 MB | 814.4 KB | 201.1 KB | 47.84x larger |

## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.15ms | 650μs | 498μs | baseline |
| 2 | **dot** | 1.84ms | 120μs | 1.72ms | 3.45x slower |
| 3 | **beak** | 2.83ms | 750μs | 2.08ms | 4.17x slower |
| 4 | **eta** | 2.31ms | 210μs | 2.10ms | 4.21x slower |
| 5 | **ejs** | 5.13ms | 1.94ms | 3.19ms | 6.40x slower |
| 6 | **liquid** | 7.63ms | 3.84ms | 3.79ms | 7.60x slower |
| 7 | **nunjucks** | 9.16ms | 2.60ms | 6.56ms | 13.16x slower |
| 8 | **pug** | 21.0ms | 180μs | 20.8ms | 41.82x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.
---

*Benchmark generated with the RavenJS renderer-benchmark package*
