## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.29ms | 650μs | 641μs | baseline |
| 2 | **dot** | 1.80ms | 120μs | 1.68ms | 2.62x slower |
| 3 | **eta** | 1.96ms | 210μs | 1.75ms | 2.73x slower |
| 4 | **beak** | 3.23ms | 750μs | 2.48ms | 3.87x slower |
| 5 | **ejs** | 4.48ms | 1.94ms | 2.54ms | 3.97x slower |
| 6 | **liquid** | 8.00ms | 3.84ms | 4.16ms | 6.50x slower |
| 7 | **nunjucks** | 9.42ms | 2.60ms | 6.82ms | 10.64x slower |
| 8 | **pug** | 21.5ms | 180μs | 21.3ms | 33.19x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.