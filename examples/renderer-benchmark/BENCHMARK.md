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

| Rank | Engine             | Avg Time (ms) | Renders/sec | vs Fastest     |
| ---- | ------------------ | ------------- | ----------- | -------------- |
| 1    | **doT**            | 0.00          | 9334802     | baseline       |
| 2    | **Pug**            | 0.00          | 5110593     | 1.83x slower   |
| 3    | **Beak2 Compiled** | 0.00          | 3362916     | 2.78x slower   |
| 4    | **Beak2 (HTML2)**  | 0.00          | 1835792     | 5.08x slower   |
| 5    | **Beak (RavenJS)** | 0.00          | 1618322     | 5.77x slower   |
| 6    | **Mustache**       | 0.00          | 1493565     | 6.25x slower   |
| 7    | **Handlebars**     | 0.01          | 197347      | 47.30x slower  |
| 8    | **EJS**            | 0.01          | 102596      | 90.99x slower  |
| 9    | **Eta**            | 0.02          | 54223       | 172.15x slower |
| 10   | **Nunjucks**       | 0.03          | 38655       | 241.49x slower |
| 11   | **Liquid**         | 0.07          | 15300       | 610.12x slower |

## Component Benchmark Results

Tests typical component rendering with loops, conditionals, and data processing.
**Data complexity:** 20 products with categories, pricing, ratings

| Rank | Engine             | Avg Time (ms) | Renders/sec | vs Fastest     |
| ---- | ------------------ | ------------- | ----------- | -------------- |
| 1    | **doT**            | 0.01          | 98558       | baseline       |
| 2    | **Pug**            | 0.03          | 32773       | 3.01x slower   |
| 3    | **Beak2 Compiled** | 0.05          | 21267       | 4.63x slower   |
| 4    | **Beak2 (HTML2)**  | 0.05          | 19841       | 4.97x slower   |
| 5    | **Eta**            | 0.07          | 14227       | 6.93x slower   |
| 6    | **Mustache**       | 0.07          | 13580       | 7.26x slower   |
| 7    | **Beak (RavenJS)** | 0.17          | 5725        | 17.22x slower  |
| 8    | **Handlebars**     | 0.19          | 5351        | 18.42x slower  |
| 9    | **EJS**            | 0.27          | 3750        | 26.28x slower  |
| 10   | **Nunjucks**       | 0.56          | 1791        | 55.04x slower  |
| 11   | **Liquid**         | 2.14          | 467         | 211.22x slower |

## Complex Benchmark Results

Full application complexity with comprehensive data processing and transformations.
**Data complexity:** 86 blog posts with authors, categories, tags, pagination

| Rank | Engine             | Avg Time (ms) | Renders/sec | vs Fastest    |
| ---- | ------------------ | ------------- | ----------- | ------------- |
| 1    | **doT**            | 0.12          | 8076        | baseline      |
| 2    | **Pug**            | 0.18          | 5426        | 1.49x slower  |
| 3    | **Eta**            | 0.21          | 4829        | 1.67x slower  |
| 4    | **Beak2 Compiled** | 0.51          | 1949        | 4.14x slower  |
| 5    | **Beak2 (HTML2)**  | 0.53          | 1885        | 4.29x slower  |
| 6    | **Mustache**       | 0.65          | 1537        | 5.25x slower  |
| 7    | **Handlebars**     | 1.29          | 775         | 10.42x slower |
| 8    | **EJS**            | 1.94          | 514         | 15.70x slower |
| 9    | **Beak (RavenJS)** | 1.97          | 508         | 15.91x slower |
| 10   | **Nunjucks**       | 2.60          | 385         | 20.99x slower |
| 11   | **Liquid**         | 3.84          | 260         | 31.02x slower |

## Bundle Size Comparison

Bundle sizes for complex templates (minified + gzipped for production deployment):

| Rank | Engine             | Bundle   | Minified | Min+Gzip | vs Smallest   |
| ---- | ------------------ | -------- | -------- | -------- | ------------- |
| 1    | **beak2-compiled** | 15.7 KB  | 13.7 KB  | 4.2 KB   | baseline      |
| 2    | **beak**           | 15.7 KB  | 13.8 KB  | 4.2 KB   | 1.00x larger  |
| 3    | **beak2**          | 15.7 KB  | 13.8 KB  | 4.2 KB   | 1.00x larger  |
| 4    | **dot**            | 18.6 KB  | 12 KB    | 5.2 KB   | 1.24x larger  |
| 5    | **eta**            | 27 KB    | 15.5 KB  | 6.2 KB   | 1.47x larger  |
| 6    | **mustache**       | 37.1 KB  | 26.3 KB  | 8.5 KB   | 2.03x larger  |
| 7    | **ejs**            | 50.9 KB  | 34.9 KB  | 11.4 KB  | 2.71x larger  |
| 8    | **liquid**         | 164.9 KB | 80.4 KB  | 25 KB    | 5.96x larger  |
| 9    | **nunjucks**       | 213 KB   | 109.9 KB | 32.1 KB  | 7.65x larger  |
| 10   | **handlebars**     | 254.2 KB | 125.5 KB | 38.1 KB  | 9.07x larger  |
| 11   | **pug**            | 1.5 MB   | 814.4 KB | 201.1 KB | 47.93x larger |

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

## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine             | Cold Start | Warm Time | Startup Overhead | vs Fastest    |
| ---- | ------------------ | ---------- | --------- | ---------------- | ------------- |
| 1    | **mustache**       | 1.24ms     | 650μs     | 590μs            | baseline      |
| 2    | **beak2-compiled** | 2.21ms     | 510μs     | 1.70ms           | 2.87x slower  |
| 3    | **eta**            | 1.98ms     | 210μs     | 1.77ms           | 3.00x slower  |
| 4    | **beak2**          | 2.46ms     | 530μs     | 1.93ms           | 3.27x slower  |
| 5    | **dot**            | 2.23ms     | 120μs     | 2.11ms           | 3.57x slower  |
| 6    | **ejs**            | 4.95ms     | 1.94ms    | 3.01ms           | 5.11x slower  |
| 7    | **liquid**         | 8.71ms     | 3.84ms    | 4.87ms           | 8.25x slower  |
| 8    | **beak**           | 7.09ms     | 1.97ms    | 5.12ms           | 8.68x slower  |
| 9    | **nunjucks**       | 10.7ms     | 2.60ms    | 8.11ms           | 13.74x slower |
| 10   | **pug**            | 26.7ms     | 180μs     | 26.5ms           | 44.89x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.

### Performance Insights

**Serverless Champions:** Mustache, Beak2 variants, and Eta excel with sub-2ms startup overhead.

**Development Speed:** Faster cold starts reduce dev build times and hot reload cycles.

**Production Impact:** High startup costs like Pug's 26.5ms overhead can significantly impact serverless function performance in cold start scenarios.

---

_Benchmark generated with the RavenJS renderer-benchmark package_
