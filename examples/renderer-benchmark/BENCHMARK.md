# Template Engine Benchmark Results

**Generated:** 2025-08-23T06:48:34.311Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7814 | baseline | 815 |
| 2 | **Pug** | 0.19 | 5223 | 1.50x slower | 8757 |
| 3 | **Eta** | 0.22 | 4518 | 1.73x slower | 4028 |
| 4 | **Beak2 (RavenJS HTML2)** | 0.54 | 1845 | 4.24x slower | 50483 |
| 5 | **Beak3 (RavenJS HTML3)** | 0.55 | 1827 | 4.28x slower | -7836 |
| 6 | **Mustache** | 0.65 | 1531 | 5.11x slower | 2093 |
| 7 | **Handlebars** | 1.35 | 742 | 10.53x slower | 1664 |
| 8 | **EJS** | 1.99 | 503 | 15.55x slower | -6454 |
| 9 | **Beak (RavenJS)** | 2.03 | 493 | 15.85x slower | 14512 |
| 10 | **Nunjucks** | 2.72 | 368 | 21.26x slower | 1844 |
| 11 | **Liquid** | 3.77 | 265 | 29.45x slower | -9751 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.14 | 0.94 | 128 |\n| **Pug** | 0.18 | 0.18 | 0.21 | 0.85 | 191 |\n| **Eta** | 0.20 | 0.21 | 0.26 | 0.73 | 221 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.51 | 0.73 | 1.38 | 542 |\n| **Beak3 (RavenJS HTML3)** | 0.47 | 0.51 | 0.82 | 4.29 | 547 |\n| **Mustache** | 0.59 | 0.62 | 1.00 | 1.57 | 653 |\n| **Handlebars** | 1.20 | 1.26 | 1.77 | 3.01 | 1347 |\n| **EJS** | 1.90 | 1.95 | 2.35 | 3.40 | 1990 |\n| **Beak (RavenJS)** | 1.85 | 1.94 | 2.46 | 4.56 | 2028 |\n| **Nunjucks** | 2.41 | 2.58 | 3.19 | 22.43 | 2721 |\n| **Liquid** | 3.35 | 3.76 | 4.08 | 4.84 | 3768 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.19ms (1.50x slower)\n3. **Eta** - Third place at 0.22ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **29.4x faster** than the slowest (Liquid).\nMedian performance difference: 5.1x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** Liquid (-9751 KB)\n**Highest memory usage:** Beak2 (RavenJS HTML2) (50483 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n