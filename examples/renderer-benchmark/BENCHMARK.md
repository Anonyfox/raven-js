# Template Engine Benchmark Results

**Generated:** 2025-08-23T06:32:43.865Z
**Test Environment:** Node.js v22.5.0
**Iterations:** 1000 renders per engine
**Sample Data:** 90 blog posts with full metadata

## Performance Ranking

| Rank | Engine | Avg Time (ms) | Renders/sec | vs Fastest | Memory (KB) |
|------|--------|---------------|-------------|------------|-------------|
| 1 | **doT** | 0.13 | 7718 | baseline | 856 |
| 2 | **Pug** | 0.20 | 5016 | 1.54x slower | -6672 |
| 3 | **Beak3 (RavenJS HTML3)** | 0.29 | 3461 | 2.23x slower | -3911 |
| 4 | **Eta** | 0.44 | 2281 | 3.38x slower | -11248 |
| 5 | **Mustache** | 0.69 | 1446 | 5.34x slower | 1261 |
| 6 | **Beak2 (RavenJS HTML2)** | 0.73 | 1378 | 5.60x slower | -14697 |
| 7 | **Handlebars** | 1.39 | 720 | 10.73x slower | -109 |
| 8 | **EJS** | 2.06 | 485 | 15.93x slower | 9382 |
| 9 | **Beak (RavenJS)** | 2.12 | 473 | 16.33x slower | 20954 |
| 10 | **Nunjucks** | 2.88 | 347 | 22.24x slower | 2737 |
| 11 | **Liquid** | 3.93 | 254 | 30.37x slower | -9723 |
\n## Detailed Statistics\n\n| Engine | Min (ms) | Median (ms) | P95 (ms) | Max (ms) | Total (ms) |\n|--------|----------|-------------|----------|----------|------------|\n| **doT** | 0.12 | 0.12 | 0.15 | 0.58 | 130 |\n| **Pug** | 0.18 | 0.19 | 0.22 | 1.05 | 199 |\n| **Beak3 (RavenJS HTML3)** | 0.27 | 0.28 | 0.34 | 0.84 | 289 |\n| **Eta** | 0.20 | 0.25 | 0.67 | 41.87 | 438 |\n| **Mustache** | 0.63 | 0.66 | 1.02 | 1.94 | 692 |\n| **Beak2 (RavenJS HTML2)** | 0.48 | 0.51 | 1.06 | 32.81 | 726 |\n| **Handlebars** | 1.27 | 1.31 | 1.76 | 2.22 | 1390 |\n| **EJS** | 1.94 | 1.99 | 2.43 | 4.51 | 2063 |\n| **Beak (RavenJS)** | 1.86 | 1.99 | 2.61 | 4.92 | 2116 |\n| **Nunjucks** | 2.54 | 2.75 | 3.51 | 5.93 | 2882 |\n| **Liquid** | 3.50 | 3.93 | 4.28 | 4.90 | 3935 |\n\n## Analysis\n\n### 🏆 Performance Leaders\n\n1. **doT** - Fastest overall with 0.13ms average render time\n2. **Pug** - Close second at 0.20ms (1.54x slower)\n3. **Beak3 (RavenJS HTML3)** - Third place at 0.29ms\n\n### 📈 Performance Spread\n\nThe fastest engine (doT) is **30.4x faster** than the slowest (Liquid).\nMedian performance difference: 5.6x slower than fastest.\n\n### 💾 Memory Efficiency\n\n**Most memory efficient:** Beak2 (RavenJS HTML2) (-14697 KB)\n**Highest memory usage:** Beak (RavenJS) (20954 KB)\n\n## Test Environment\n\n- **Node.js Version:** v22.5.0\n- **Platform:** darwin arm64\n- **Template Complexity:** Blog listing with 90 posts\n- **Data Variety:** Mixed content lengths, multiple authors, categories, tags\n- **Caching:** Disabled for all engines to ensure fair comparison\n- **Warmup:** 10 iterations before measurement\n- **Measurement:** 1000 timed iterations per engine\n\n---\n\n*Benchmark generated with the RavenJS renderer-benchmark package*\n