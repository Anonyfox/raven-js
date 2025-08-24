## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.24ms | 650μs | 590μs | baseline |
| 2 | **dot** | 1.87ms | 120μs | 1.75ms | 2.96x slower |
| 3 | **eta** | 2.10ms | 210μs | 1.89ms | 3.20x slower |
| 4 | **beak** | 3.71ms | 750μs | 2.96ms | 5.01x slower |
| 5 | **ejs** | 5.03ms | 1.94ms | 3.09ms | 5.24x slower |
| 6 | **liquid** | 8.17ms | 3.84ms | 4.33ms | 7.33x slower |
| 7 | **nunjucks** | 10.8ms | 2.60ms | 8.24ms | 13.96x slower |
| 8 | **pug** | 22.7ms | 180μs | 22.5ms | 38.13x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.