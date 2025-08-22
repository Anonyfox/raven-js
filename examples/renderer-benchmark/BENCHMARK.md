# Template Engine Benchmark Results

**Generated:** 2025-08-22T09:54:58.418Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7690 | baseline | 758 |
| 2 | **Pug** | 0.20 | 5121 | 1.50x slower | 8540 |
| 3 | **Eta** | 0.22 | 4447 | 1.73x slower | 4625 |
| 4 | **Mustache** | 0.67 | 1489 | 5.17x slower | 81 |
| 5 | **Handlebars** | 1.35 | 743 | 10.35x slower | 1059 |
| 6 | **Beak (RavenJS)** | 2.07 | 482 | 15.94x slower | 71767 |
| 7 | **EJS** | 2.07 | 482 | 15.95x slower | -6713 |
| 8 | **Nunjucks** | 2.70 | 371 | 20.74x slower | 3922 |
| 9 | **Liquid** | 3.76 | 266 | 28.90x slower | 9445 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.13 | 0.14 | 0.54 | 130 |\n| **Pug** | 0.18 | 0.19 | 0.21 | 0.83 | 195 |\n| **Eta** | 0.21 | 0.22 | 0.25 | 0.88 | 225 |\n| **Mustache** | 0.62 | 0.65 | 0.96 | 1.20 | 672 |\n| **Handlebars** | 1.24 | 1.27 | 1.71 | 2.08 | 1346 |\n| **Beak (RavenJS)** | 1.92 | 1.97 | 2.44 | 4.68 | 2073 |\n| **EJS** | 1.99 | 2.02 | 2.48 | 3.31 | 2074 |\n| **Nunjucks** | 2.48 | 2.56 | 3.19 | 4.44 | 2697 |\n| **Liquid** | 3.41 | 3.74 | 4.09 | 9.27 | 3758 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.20ms (1.50x slower)\n3. **Eta** - Third place at 0.22ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **28.9x faster** than the slowest (Liquid).\nMedian performance difference: 10.4x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** EJS (-6713 KB)\n**Highest memory usage:** Beak (RavenJS) (71767 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n