# Template Engine Benchmark Results

**Generated:** 2025-08-22T08:54:34.557Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7553 | baseline | 599 |
| 2 | **Pug** | 0.20 | 4955 | 1.52x slower | 8539 |
| 3 | **Eta** | 0.23 | 4373 | 1.73x slower | 4294 |
| 4 | **Mustache** | 0.68 | 1462 | 5.17x slower | 3770 |
| 5 | **Handlebars** | 1.47 | 682 | 11.08x slower | 2405 |
| 6 | **EJS** | 2.11 | 475 | 15.91x slower | -32874 |
| 7 | **Nunjucks** | 2.79 | 358 | 21.10x slower | 1730 |
| 8 | **Beak (RavenJS)** | 3.28 | 305 | 24.76x slower | 15711 |
| 9 | **Liquid** | 4.12 | 243 | 31.12x slower | 65181 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.13 | 0.15 | 0.55 | 132 |\n| **Pug** | 0.18 | 0.19 | 0.22 | 0.94 | 202 |\n| **Eta** | 0.21 | 0.22 | 0.26 | 0.86 | 229 |\n| **Mustache** | 0.62 | 0.65 | 0.99 | 1.78 | 684 |\n| **Handlebars** | 1.28 | 1.43 | 1.87 | 2.72 | 1467 |\n| **EJS** | 2.00 | 2.04 | 2.43 | 4.85 | 2106 |\n| **Nunjucks** | 2.48 | 2.73 | 3.34 | 4.74 | 2794 |\n| **Beak (RavenJS)** | 3.11 | 3.17 | 3.68 | 5.86 | 3278 |\n| **Liquid** | 3.55 | 4.02 | 4.50 | 10.47 | 4120 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.20ms (1.52x slower)\n3. **Eta** - Third place at 0.23ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **31.1x faster** than the slowest (Liquid).\nMedian performance difference: 11.1x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** EJS (-32874 KB)\n**Highest memory usage:** Liquid (65181 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n