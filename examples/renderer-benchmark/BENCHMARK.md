# Three-Tiered Template Engine Benchmark Results

**Generated:** 2025-08-25T12:49:36.003Z
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
| 1 | **doT** | 0.00 | 9019979 | baseline |
| 2 | **Pug** | 0.00 | 5097619 | 1.77x slower |
| 3 | **Beak (RavenJS)** | 0.00 | 3756870 | 2.40x slower |
| 4 | **Mustache** | 0.00 | 1333232 | 6.77x slower |
| 5 | **Handlebars** | 0.01 | 178516 | 50.53x slower |
| 6 | **EJS** | 0.01 | 126433 | 71.34x slower |
| 7 | **Eta** | 0.02 | 44235 | 203.91x slower |
| 8 | **Nunjucks** | 0.03 | 35534 | 253.84x slower |
| 9 | **Liquid** | 0.07 | 15131 | 596.12x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.01 | 90615 | baseline |
| 2 | **Pug** | 0.03 | 31147 | 2.91x slower |
| 3 | **Beak (RavenJS)** | 0.07 | 13892 | 6.52x slower |
| 4 | **Eta** | 0.08 | 13239 | 6.84x slower |
| 5 | **Mustache** | 0.08 | 13168 | 6.88x slower |
| 6 | **Handlebars** | 0.19 | 5155 | 17.58x slower |
| 7 | **EJS** | 0.28 | 3573 | 25.36x slower |
| 8 | **Nunjucks** | 0.63 | 1591 | 56.97x slower |
| 9 | **Liquid** | 2.58 | 387 | 234.13x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.13 | 7893 | baseline |
| 2 | **Pug** | 0.19 | 5221 | 1.51x slower |
| 3 | **Eta** | 0.22 | 4583 | 1.72x slower |
| 4 | **Mustache** | 0.67 | 1502 | 5.26x slower |
| 5 | **Beak (RavenJS)** | 0.75 | 1342 | 5.88x slower |
| 6 | **Handlebars** | 1.37 | 731 | 10.79x slower |
| 7 | **EJS** | 2.05 | 488 | 16.18x slower |
| 8 | **Nunjucks** | 2.82 | 355 | 22.26x slower |
| 9 | **Liquid** | 4.29 | 233 | 33.85x slower |

## Performance Analysis

### Engine Scaling Patterns

**Baseline:** doT leads at 0.00ms, 596.1x performance spread
**Component:** doT leads at 0.01ms, 234.1x performance spread
**Complex:** doT leads at 0.13ms, 33.8x performance spread

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
| 1 | **mustache** | 1.49ms | 650μs | 838μs | baseline |
| 2 | **eta** | 1.87ms | 210μs | 1.66ms | 1.98x slower |
| 3 | **dot** | 2.12ms | 120μs | 2.00ms | 2.38x slower |
| 4 | **ejs** | 4.49ms | 1.94ms | 2.55ms | 3.05x slower |
| 5 | **beak** | 3.37ms | 750μs | 2.62ms | 3.12x slower |
| 6 | **liquid** | 8.47ms | 3.84ms | 4.63ms | 5.52x slower |
| 7 | **nunjucks** | 10.5ms | 2.60ms | 7.89ms | 9.41x slower |
| 8 | **pug** | 22.7ms | 180μs | 22.5ms | 26.82x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.
---

*Benchmark generated with the RavenJS renderer-benchmark package*
