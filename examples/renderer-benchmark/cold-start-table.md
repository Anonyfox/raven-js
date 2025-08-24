## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.15ms | 650μs | 498μs | baseline |
| 2 | **dot** | 1.84ms | 120μs | 1.72ms | 3.45x slower |
| 3 | **beak** | 2.83ms | 750μs | 2.08ms | 4.17x slower |
| 4 | **eta** | 2.31ms | 210μs | 2.10ms | 4.21x slower |
| 5 | **ejs** | 5.13ms | 1.94ms | 3.19ms | 6.40x slower |
| 6 | **liquid** | 7.63ms | 3.84ms | 3.79ms | 7.60x slower |
| 7 | **nunjucks** | 9.16ms | 2.60ms | 6.56ms | 13.16x slower |
| 8 | **pug** | 21.0ms | 180μs | 20.8ms | 41.82x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.