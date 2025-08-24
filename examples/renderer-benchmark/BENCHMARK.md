# Three-Tiered Template Engine Benchmark Results

**Generated:** 2025-08-24T16:02:26.210Z
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
| 1 | **doT** | 0.00 | 9127585 | baseline |
| 2 | **Pug** | 0.00 | 5076039 | 1.80x slower |
| 3 | **Beak (RavenJS)** | 0.00 | 4179204 | 2.18x slower |
| 4 | **Mustache** | 0.00 | 1316371 | 6.93x slower |
| 5 | **Handlebars** | 0.01 | 196294 | 46.50x slower |
| 6 | **EJS** | 0.01 | 130118 | 70.15x slower |
| 7 | **Eta** | 0.02 | 49682 | 183.72x slower |
| 8 | **Nunjucks** | 0.03 | 36221 | 252.00x slower |
| 9 | **Liquid** | 0.07 | 13605 | 670.92x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.01 | 90477 | baseline |
| 2 | **Pug** | 0.03 | 31071 | 2.91x slower |
| 3 | **Beak (RavenJS)** | 0.07 | 14287 | 6.33x slower |
| 4 | **Eta** | 0.08 | 13324 | 6.79x slower |
| 5 | **Mustache** | 0.08 | 12668 | 7.14x slower |
| 6 | **Handlebars** | 0.21 | 4693 | 19.28x slower |
| 7 | **EJS** | 0.29 | 3503 | 25.83x slower |
| 8 | **Nunjucks** | 0.65 | 1545 | 58.54x slower |
| 9 | **Liquid** | 2.35 | 425 | 212.67x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest |
|------|--------|---------------|-------------|------------|
| 1 | **doT** | 0.13 | 7735 | baseline |
| 2 | **Pug** | 0.19 | 5187 | 1.49x slower |
| 3 | **Eta** | 0.23 | 4439 | 1.74x slower |
| 4 | **Mustache** | 0.68 | 1477 | 5.24x slower |
| 5 | **Beak (RavenJS)** | 0.75 | 1340 | 5.77x slower |
| 6 | **Handlebars** | 1.39 | 719 | 10.75x slower |
| 7 | **EJS** | 2.40 | 417 | 18.55x slower |
| 8 | **Nunjucks** | 2.92 | 343 | 22.55x slower |
| 9 | **Liquid** | 3.97 | 252 | 30.70x slower |

## Performance Analysis

### Engine Scaling Patterns

**Baseline:** doT leads at 0.00ms, 670.9x performance spread
**Component:** doT leads at 0.01ms, 212.7x performance spread
**Complex:** doT leads at 0.13ms, 30.7x performance spread

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
| 7 | **nunjucks** | 213 KB | 109.9 KB | 32.1 KB | 7.64x larger |
| 8 | **handlebars** | 254.2 KB | 125.5 KB | 38.1 KB | 9.06x larger |
| 9 | **pug** | 1.5 MB | 814.4 KB | 201.1 KB | 47.86x larger |

## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.24ms | 650μs | 590μs | baseline |
| 2 | **dot** | 1.87ms | 120μs | 1.75ms | 2.96x slower |
| 3 | **eta** | 2.10ms | 210μs | 1.89ms | 3.20x slower |
| 4 | **beak** | 3.71ms | 750μs | 2.96ms | 5.01x slower |
| 5 | **ejs** | 5.03ms | 1.94ms | 3.09ms | 5.24x slower |
| 6 | **liquid** | 8.17ms | 3.84ms | 4.33ms | 7.33x slower |
| 7 | **nunjucks** | 10.8ms | 2.60ms | 8.24ms | 13.96x slower |
| 8 | **pug** | 22.7ms | 180μs | 22.5ms | 38.13x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.
---

*Benchmark generated with the RavenJS renderer-benchmark package*
