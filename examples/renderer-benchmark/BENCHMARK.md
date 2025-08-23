# Template Engine Benchmark Results

**Generated:** 2025-08-23T17:15:04.796Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7754 | baseline | 810 |
| 2 | **Pug** | 0.19 | 5141 | 1.51x slower | 8763 |
| 3 | **Eta** | 0.22 | 4518 | 1.72x slower | 3995 |
| 4 | **Beak2 (RavenJS HTML2)** | 0.55 | 1815 | 4.27x slower | 15809 |
| 5 | **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.55 | 1805 | 4.29x slower | 2232 |
| 6 | **Mustache** | 0.66 | 1512 | 5.13x slower | 2081 |
| 7 | **Handlebars** | 1.35 | 738 | 10.50x slower | 55 |
| 8 | **Beak (RavenJS)** | 2.07 | 484 | 16.02x slower | -9114 |
| 9 | **EJS** | 2.11 | 474 | 16.37x slower | -5707 |
| 10 | **Nunjucks** | 3.07 | 325 | 23.83x slower | 1852 |
| 11 | **Liquid** | 4.21 | 238 | 32.62x slower | 64716 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.14 | 0.70 | 129 |\n| **Pug** | 0.18 | 0.18 | 0.21 | 0.85 | 195 |\n| **Eta** | 0.20 | 0.21 | 0.25 | 0.88 | 221 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.51 | 0.71 | 2.99 | 551 |\n| **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.49 | 0.52 | 0.70 | 2.91 | 554 |\n| **Mustache** | 0.60 | 0.63 | 1.00 | 2.11 | 661 |\n| **Handlebars** | 1.22 | 1.29 | 1.74 | 2.23 | 1354 |\n| **Beak (RavenJS)** | 1.85 | 1.97 | 2.52 | 4.63 | 2066 |\n| **EJS** | 1.99 | 2.07 | 2.46 | 2.94 | 2111 |\n| **Nunjucks** | 2.46 | 2.72 | 3.49 | 69.71 | 3073 |\n| **Liquid** | 3.49 | 4.09 | 4.69 | 9.09 | 4207 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.19ms (1.51x slower)\n3. **Eta** - Third place at 0.22ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **32.6x faster** than the slowest (Liquid).\nMedian performance difference: 5.1x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** Beak (RavenJS) (-9114 KB)\n**Highest memory usage:** Liquid (64716 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n