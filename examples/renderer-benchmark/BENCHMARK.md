# Template Engine Benchmark Results

**Generated:** 2025-08-23T16:39:55.761Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7876 | baseline | 811 |
| 2 | **Eta** | 0.22 | 4569 | 1.72x slower | 4146 |
| 3 | **Pug** | 0.46 | 2192 | 3.59x slower | 8738 |
| 4 | **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.54 | 1863 | 4.23x slower | -4642 |
| 5 | **Beak2 (RavenJS HTML2)** | 0.54 | 1845 | 4.27x slower | -46587 |
| 6 | **Mustache** | 0.66 | 1508 | 5.22x slower | 2096 |
| 7 | **Handlebars** | 1.34 | 746 | 10.55x slower | 1620 |
| 8 | **EJS** | 2.01 | 498 | 15.81x slower | -6456 |
| 9 | **Beak (RavenJS)** | 2.04 | 491 | 16.03x slower | 43889 |
| 10 | **Nunjucks** | 2.70 | 370 | 21.29x slower | 1776 |
| 11 | **Liquid** | 4.14 | 241 | 32.63x slower | 10312 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.13 | 0.81 | 127 |\n| **Eta** | 0.20 | 0.21 | 0.25 | 0.74 | 219 |\n| **Pug** | 0.18 | 0.19 | 0.95 | 35.82 | 456 |\n| **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.48 | 0.50 | 0.68 | 2.68 | 537 |\n| **Beak2 (RavenJS HTML2)** | 0.47 | 0.51 | 0.74 | 4.13 | 542 |\n| **Mustache** | 0.60 | 0.64 | 1.00 | 1.86 | 663 |\n| **Handlebars** | 1.23 | 1.27 | 1.72 | 2.23 | 1340 |\n| **EJS** | 1.91 | 1.97 | 2.36 | 2.88 | 2008 |\n| **Beak (RavenJS)** | 1.86 | 1.94 | 2.45 | 5.33 | 2036 |\n| **Nunjucks** | 2.42 | 2.60 | 3.19 | 4.26 | 2703 |\n| **Liquid** | 3.66 | 4.05 | 4.46 | 11.38 | 4144 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Eta** - Close second at 0.22ms (1.72x slower)\n3. **Pug** - Third place at 0.46ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **32.6x faster** than the slowest (Liquid).\nMedian performance difference: 5.2x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** Beak2 (RavenJS HTML2) (-46587 KB)\n**Highest memory usage:** Beak (RavenJS) (43889 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n