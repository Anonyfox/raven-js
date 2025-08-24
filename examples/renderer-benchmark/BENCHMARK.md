# Template Engine Benchmark Results

**Generated:** 2025-08-24T08:26:43.563Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7763 | baseline | 897 |
| 2 | **Pug** | 0.20 | 5113 | 1.52x slower | -7117 |
| 3 | **Eta** | 0.23 | 4280 | 1.81x slower | 4009 |
| 4 | **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.55 | 1816 | 4.28x slower | 35643 |
| 5 | **Beak2 (RavenJS HTML2)** | 0.56 | 1777 | 4.37x slower | 21901 |
| 6 | **Mustache** | 0.68 | 1473 | 5.27x slower | 1130 |
| 7 | **Handlebars** | 1.38 | 723 | 10.74x slower | 790 |
| 8 | **Beak (RavenJS)** | 2.12 | 472 | 16.43x slower | 301 |
| 9 | **EJS** | 2.43 | 412 | 18.84x slower | 9648 |
| 10 | **Nunjucks** | 2.80 | 357 | 21.76x slower | 1844 |
| 11 | **Liquid** | 3.91 | 256 | 30.38x slower | -9757 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.14 | 0.75 | 129 |\n| **Pug** | 0.18 | 0.18 | 0.24 | 0.94 | 196 |\n| **Eta** | 0.20 | 0.22 | 0.30 | 0.90 | 234 |\n| **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.47 | 0.51 | 0.71 | 1.60 | 551 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.52 | 0.91 | 1.86 | 563 |\n| **Mustache** | 0.59 | 0.64 | 1.03 | 1.87 | 679 |\n| **Handlebars** | 1.22 | 1.30 | 1.88 | 4.00 | 1384 |\n| **Beak (RavenJS)** | 1.86 | 2.01 | 2.71 | 4.55 | 2117 |\n| **EJS** | 2.27 | 2.37 | 2.76 | 3.91 | 2427 |\n| **Nunjucks** | 2.42 | 2.75 | 3.43 | 5.67 | 2804 |\n| **Liquid** | 3.36 | 3.84 | 4.50 | 5.74 | 3913 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.20ms (1.52x slower)\n3. **Eta** - Third place at 0.23ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **30.4x faster** than the slowest (Liquid).\nMedian performance difference: 5.3x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** Liquid (-9757 KB)\n**Highest memory usage:** Beak2 Compiled (RavenJS HTML2 + Compile) (35643 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n