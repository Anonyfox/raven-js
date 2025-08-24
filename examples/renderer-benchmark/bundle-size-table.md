## Bundle Size Comparison

Bundle sizes for complex templates (minified + gzipped for production deployment):

| Rank | Engine | Bundle | Minified | Min+Gzip | vs Smallest |
|------|--------|--------|----------|----------|-------------|
| 1 | **beak2-compiled** | 15.7 KB | 13.7 KB | 4.2 KB | baseline |
| 2 | **beak** | 15.7 KB | 13.8 KB | 4.2 KB | 1.00x larger |
| 3 | **beak2** | 15.7 KB | 13.8 KB | 4.2 KB | 1.00x larger |
| 4 | **dot** | 18.6 KB | 12 KB | 5.2 KB | 1.24x larger |
| 5 | **eta** | 27 KB | 15.5 KB | 6.2 KB | 1.47x larger |
| 6 | **mustache** | 37.1 KB | 26.3 KB | 8.5 KB | 2.03x larger |
| 7 | **ejs** | 50.9 KB | 34.9 KB | 11.4 KB | 2.71x larger |
| 8 | **liquid** | 164.9 KB | 80.4 KB | 25 KB | 5.96x larger |
| 9 | **nunjucks** | 213 KB | 109.9 KB | 32.1 KB | 7.65x larger |
| 10 | **handlebars** | 254.2 KB | 125.5 KB | 38.1 KB | 9.07x larger |
| 11 | **pug** | 1.5 MB | 814.4 KB | 201.1 KB | 47.93x larger |