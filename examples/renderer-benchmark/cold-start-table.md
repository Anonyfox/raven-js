## Cold Start Performance

Startup overhead from fresh engine creation to first render completion:

| Rank | Engine | Cold Start | Warm Time | Startup Overhead | vs Fastest |
|------|--------|------------|-----------|------------------|------------|
| 1 | **mustache** | 1.49ms | 650μs | 838μs | baseline |
| 2 | **eta** | 1.87ms | 210μs | 1.66ms | 1.98x slower |
| 3 | **dot** | 2.12ms | 120μs | 2.00ms | 2.38x slower |
| 4 | **ejs** | 4.49ms | 1.94ms | 2.55ms | 3.05x slower |
| 5 | **beak** | 3.37ms | 750μs | 2.62ms | 3.12x slower |
| 6 | **liquid** | 8.47ms | 3.84ms | 4.63ms | 5.52x slower |
| 7 | **nunjucks** | 10.5ms | 2.60ms | 7.89ms | 9.41x slower |
| 8 | **pug** | 22.7ms | 180μs | 22.5ms | 26.82x slower |

### Cold Start Analysis

- **Cold Start**: Total time from fresh engine instantiation to first render
- **Warm Time**: Known warm render time from performance benchmark
- **Startup Overhead**: Pure engine initialization cost (Cold Start - Warm Time)

Lower startup overhead indicates faster serverless cold starts and development builds.