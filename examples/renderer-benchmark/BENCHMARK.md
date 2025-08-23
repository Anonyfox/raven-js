# Template Engine Benchmark Results

**Generated:** 2025-08-23T21:50:24.331Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7948 | baseline | 627 |
| 2 | **Pug** | 0.19 | 5279 | 1.51x slower | 8556 |
| 3 | **Eta** | 0.22 | 4573 | 1.74x slower | 4070 |
| 4 | **Beak2 (RavenJS HTML2)** | 0.54 | 1836 | 4.33x slower | -30987 |
| 5 | **Mustache** | 0.66 | 1521 | 5.23x slower | 2728 |
| 6 | **Beak2 Compiled (RavenJS HTML2 + Compile)** | 1.24 | 809 | 9.82x slower | 67943 |
| 7 | **Handlebars** | 1.32 | 755 | 10.53x slower | 1737 |
| 8 | **EJS** | 2.04 | 490 | 16.23x slower | -5201 |
| 9 | **Beak (RavenJS)** | 2.05 | 488 | 16.28x slower | 63130 |
| 10 | **Nunjucks** | 2.72 | 367 | 21.64x slower | -75570 |
| 11 | **Liquid** | 4.12 | 242 | 32.79x slower | 63506 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.14 | 0.72 | 126 |\n| **Pug** | 0.17 | 0.18 | 0.20 | 0.81 | 189 |\n| **Eta** | 0.20 | 0.21 | 0.26 | 0.77 | 219 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.51 | 0.72 | 4.90 | 545 |\n| **Mustache** | 0.59 | 0.62 | 1.03 | 1.77 | 657 |\n| **Beak2 Compiled (RavenJS HTML2 + Compile)** | 1.14 | 1.19 | 1.56 | 1.92 | 1236 |\n| **Handlebars** | 1.20 | 1.24 | 1.72 | 2.13 | 1324 |\n| **EJS** | 1.94 | 1.99 | 2.44 | 2.84 | 2042 |\n| **Beak (RavenJS)** | 1.86 | 1.95 | 2.44 | 5.50 | 2048 |\n| **Nunjucks** | 2.42 | 2.62 | 3.21 | 9.11 | 2723 |\n| **Liquid** | 3.50 | 4.05 | 4.47 | 9.31 | 4125 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.19ms (1.51x slower)\n3. **Eta** - Third place at 0.22ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **32.8x faster** than the slowest (Liquid).\nMedian performance difference: 9.8x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** Nunjucks (-75570 KB)\n**Highest memory usage:** Beak2 Compiled (RavenJS HTML2 + Compile) (67943 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n