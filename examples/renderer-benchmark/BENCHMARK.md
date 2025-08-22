# Template Engine Benchmark Results

**Generated:** 2025-08-22T20:42:39.497Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7896 | baseline | -14930 |
| 2 | **Pug** | 0.19 | 5295 | 1.49x slower | 7922 |
| 3 | **Eta** | 0.22 | 4459 | 1.77x slower | -12615 |
| 4 | **Beak2 (RavenJS HTML2)** | 0.54 | 1841 | 4.29x slower | 14002 |
| 5 | **Mustache** | 0.66 | 1525 | 5.18x slower | 1223 |
| 6 | **Handlebars** | 1.33 | 754 | 10.47x slower | 942 |
| 7 | **Beak (RavenJS)** | 2.02 | 494 | 15.98x slower | 23446 |
| 8 | **EJS** | 2.07 | 483 | 16.35x slower | 9399 |
| 9 | **Nunjucks** | 2.73 | 366 | 21.56x slower | 2558 |
| 10 | **Liquid** | 3.80 | 263 | 30.05x slower | -9793 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.11 | 0.12 | 0.14 | 0.80 | 127 |\n| **Pug** | 0.18 | 0.18 | 0.20 | 0.65 | 189 |\n| **Eta** | 0.20 | 0.21 | 0.27 | 0.78 | 224 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.51 | 0.74 | 3.19 | 543 |\n| **Mustache** | 0.59 | 0.62 | 1.00 | 1.85 | 656 |\n| **Handlebars** | 1.21 | 1.26 | 1.71 | 2.39 | 1326 |\n| **Beak (RavenJS)** | 1.85 | 1.94 | 2.45 | 5.18 | 2024 |\n| **EJS** | 1.97 | 2.04 | 2.42 | 3.08 | 2070 |\n| **Nunjucks** | 2.45 | 2.64 | 3.17 | 5.62 | 2730 |\n| **Liquid** | 3.41 | 3.80 | 4.12 | 4.80 | 3805 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.19ms (1.49x slower)\n3. **Eta** - Third place at 0.22ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **30.0x faster** than the slowest (Liquid).\nMedian performance difference: 10.5x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** doT (-14930 KB)\n**Highest memory usage:** Beak (RavenJS) (23446 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n