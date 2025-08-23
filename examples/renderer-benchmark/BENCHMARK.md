# Template Engine Benchmark Results

**Generated:** 2025-08-23T22:11:19.554Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7884 | baseline | 786 |
| 2 | **Pug** | 0.19 | 5291 | 1.49x slower | -7111 |
| 3 | **Eta** | 0.22 | 4533 | 1.74x slower | 3373 |
| 4 | **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.50 | 1983 | 3.98x slower | -3187 |
| 5 | **Beak2 (RavenJS HTML2)** | 0.54 | 1854 | 4.25x slower | 52189 |
| 6 | **Mustache** | 0.67 | 1501 | 5.25x slower | -11757 |
| 7 | **Handlebars** | 1.33 | 752 | 10.49x slower | 796 |
| 8 | **EJS** | 2.00 | 500 | 15.77x slower | -13168 |
| 9 | **Beak (RavenJS)** | 2.20 | 454 | 17.35x slower | -7368 |
| 10 | **Nunjucks** | 2.68 | 374 | 21.11x slower | 3176 |
| 11 | **Liquid** | 3.81 | 263 | 30.02x slower | -11540 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.14 | 0.62 | 127 |\n| **Pug** | 0.17 | 0.18 | 0.20 | 0.80 | 189 |\n| **Eta** | 0.20 | 0.21 | 0.25 | 1.07 | 221 |\n| **Beak2 Compiled (RavenJS HTML2 + Compile)** | 0.44 | 0.47 | 0.66 | 2.97 | 504 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.51 | 0.73 | 1.30 | 539 |\n| **Mustache** | 0.60 | 0.63 | 1.00 | 1.85 | 666 |\n| **Handlebars** | 1.21 | 1.26 | 1.71 | 2.47 | 1331 |\n| **EJS** | 1.90 | 1.96 | 2.36 | 3.57 | 2001 |\n| **Beak (RavenJS)** | 1.85 | 1.95 | 2.57 | 36.05 | 2201 |\n| **Nunjucks** | 2.39 | 2.56 | 3.16 | 5.37 | 2677 |\n| **Liquid** | 3.38 | 3.80 | 4.13 | 4.91 | 3808 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.19ms (1.49x slower)\n3. **Eta** - Third place at 0.22ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **30.0x faster** than the slowest (Liquid).\nMedian performance difference: 5.3x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** EJS (-13168 KB)\n**Highest memory usage:** Beak2 (RavenJS HTML2) (52189 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n