# Template Engine Benchmark Results

**Generated:** 2025-08-22T17:15:28.892Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7724 | baseline | 813 |
| 2 | **Pug** | 0.20 | 5099 | 1.51x slower | 8622 |
| 3 | **Eta** | 0.23 | 4444 | 1.74x slower | 4508 |
| 4 | **Mustache** | 0.68 | 1467 | 5.27x slower | 2161 |
| 5 | **Handlebars** | 1.38 | 726 | 10.64x slower | 516 |
| 6 | **EJS** | 2.08 | 481 | 16.05x slower | -62489 |
| 7 | **Beak (RavenJS)** | 2.12 | 472 | 16.37x slower | 62181 |
| 8 | **Nunjucks** | 2.81 | 356 | 21.73x slower | 3830 |
| 9 | **Liquid** | 4.33 | 231 | 33.44x slower | 62071 |
| 10 | **Beak2 (RavenJS HTML2)** | 6.99 | 143 | 53.97x slower | 5411 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.14 | 0.59 | 129 |\n| **Pug** | 0.18 | 0.19 | 0.22 | 0.90 | 196 |\n| **Eta** | 0.21 | 0.21 | 0.26 | 0.74 | 225 |\n| **Mustache** | 0.62 | 0.65 | 1.02 | 1.67 | 682 |\n| **Handlebars** | 1.26 | 1.31 | 1.77 | 2.54 | 1377 |\n| **EJS** | 1.97 | 2.03 | 2.41 | 6.03 | 2078 |\n| **Beak (RavenJS)** | 1.91 | 2.03 | 2.56 | 5.92 | 2120 |\n| **Nunjucks** | 2.49 | 2.74 | 3.33 | 4.87 | 2813 |\n| **Liquid** | 3.62 | 4.28 | 4.73 | 10.13 | 4330 |\n| **Beak2 (RavenJS HTML2)** | 6.68 | 6.89 | 7.80 | 9.15 | 6987 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.20ms (1.51x slower)\n3. **Eta** - Third place at 0.23ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **54.0x faster** than the slowest (Beak2 (RavenJS HTML2)).\nMedian performance difference: 16.1x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** EJS (-62489 KB)\n**Highest memory usage:** Beak (RavenJS) (62181 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n