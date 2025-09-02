# String Similarity & Distance Algorithms

**Quick algorithm selection for real-world use cases.** Choose the right tool for your specific problem.

## 🎯 Algorithm Decision Guide

### For **Short Strings** (names, titles, search terms)

- **Names & addresses** → `jaroWinklerSimilarity()`
- **Spell checking** → `levenshteinDistance()` or `osaDistance()`
- **Fixed-length data** (UUIDs, hashes) → `hammingDistance()`

### For **Medium Text** (sentences, paragraphs)

- **General similarity** → `levenshteinDistance()`
- **Find common patterns** → `lcsLength()` / `lcsString()`
- **Advanced typo detection** → `osaDistance()` (handles transpositions)

### For **Large Documents** (articles, books, code)

- **Fast similarity estimation** → `MinHasher` class
- **Document fingerprinting** → `SimHasher` class
- **Near-duplicate search** → `LSHBuckets` class

---

## 📋 Algorithm Reference

### **Hamming Distance** - `hammingDistance()`, `hammingSimilarity()`

**What:** Counts character differences at each position. Requires equal-length strings.

**Real-world use cases:**

- Comparing binary data, DNA sequences, error-correcting codes
- Validating fixed-format data (credit card numbers, UUIDs, barcodes)
- Detecting single-bit errors in transmission

**Performance:** ⚡ **Fastest** - O(n) time, O(1) space
**Best for:** Fixed-length data where position matters

```javascript
hammingDistance("HELLO", "HXLLO"); // 1 - one character differs
hammingDistance("10101", "11001"); // 2 - two bit positions differ
```

---

### **Jaro-Winkler** - `jaroSimilarity()`, `jaroWinklerSimilarity()`

**What:** Specialized for short strings with common prefixes. Includes utility functions.

**Real-world use cases:**

- **Person names:** "John Smith" vs "Jon Smith", "García" vs "Garcia"
- **Company names:** "Microsoft Corp" vs "Microsoft Corporation"
- **Street addresses:** "123 Main St" vs "123 Main Street"
- **Product search:** Fuzzy matching in e-commerce catalogs

**Performance:** 🟡 **Fast** - O(n×m) with early optimizations
**Best for:** Names, titles, and short text with common prefixes

**Utilities:**

- `findBestMatch(query, candidates)` - Find closest match from array
- `groupSimilarStrings(strings, threshold)` - Cluster similar strings

```javascript
jaroWinklerSimilarity("Martha", "Marhta"); // 0.96 - high similarity
findBestMatch("Jhon", ["John", "Joan", "Jane"]); // Returns "John" match
```

---

### **Levenshtein Distance** - `levenshteinDistance()`, `levenshteinSimilarity()`

**What:** Classic edit distance. Counts insertions, deletions, and substitutions.

**Real-world use cases:**

- **Spell checkers:** "recieve" → "receive" (1 substitution)
- **Autocorrect systems:** Mobile keyboard corrections
- **Data deduplication:** Finding similar customer records
- **DNA analysis:** Measuring genetic similarity

**Performance:** 🟡 **Medium** - O(n×m) time and space
**Best for:** General-purpose string comparison, spell checking

```javascript
levenshteinDistance("kitten", "sitting"); // 3 edits needed
levenshteinSimilarity("hello", "hallo"); // 0.8 similarity
```

---

### **OSA (Optimal String Alignment)** - `osaDistance()`, `osaSimilarity()`

**What:** Enhanced edit distance that includes adjacent character transpositions.

**Real-world use cases:**

- **Advanced spell checkers:** "teh" → "the" (transposition)
- **Typo detection:** "form" vs "from" (adjacent swap)
- **OCR error correction:** Scanning documents with character swaps
- **Search suggestions:** Better than Levenshtein for common typing errors

**Performance:** 🟡 **Medium** - O(n×m) time and space
**Best for:** Handling transposition errors, better typo detection

```javascript
osaDistance("hello", "hlelo"); // 1 - one transposition
osaDistance("algorithm", "logarithm"); // Better results than Levenshtein
```

---

### **LCS (Longest Common Subsequence)** - `lcsLength()`, `lcsString()`, `lcsSimilarity()`

**What:** Finds the longest sequence that appears in both strings (order preserved).

**Real-world use cases:**

- **Version control systems:** Git diff algorithms
- **Code similarity:** Detecting code clones and plagiarism
- **DNA sequencing:** Finding common genetic patterns
- **Document comparison:** Academic paper similarity

**Performance:** 🟡 **Medium** - O(n×m) time and space
**Best for:** When sequence order matters, diff generation

```javascript
lcsString("ABCDGH", "AEDFHR"); // "ADH" - longest common subsequence
lcsLength("programming", "program"); // 7 - "program" is common
```

---

### **MinHash** - `MinHasher` class

**What:** Probabilistic similarity estimation for large text using hash signatures.

**Real-world use cases:**

- **Plagiarism detection:** Compare academic papers efficiently
- **Content deduplication:** Remove duplicate articles/posts
- **Recommendation systems:** "Users who liked this also liked..."
- **Copyright detection:** Find similar media content

**Performance:** ⚡ **Very Fast** for large documents - O(n) preprocessing, O(k) comparison
**Best for:** Large document similarity, statistical guarantees

```javascript
const minhasher = new MinHasher({ numHashes: 128 });
const sig1 = minhasher.computeTextSignature("Large document...");
const sig2 = minhasher.computeTextSignature("Another document...");
const jaccard = minhasher.estimateJaccard(sig1, sig2); // Fast similarity
```

---

### **SimHash** - `SimHasher` class

**What:** Creates compact fingerprints for documents, enabling fast bit-level comparison.

**Real-world use cases:**

- **News clustering:** Group similar news articles automatically
- **Web crawling:** Avoid indexing duplicate pages
- **Social media:** Detect spam or duplicate posts
- **Content moderation:** Flag similar harmful content

**Performance:** ⚡ **Very Fast** - O(n) to compute, O(1) to compare fingerprints
**Best for:** Document fingerprinting, near-duplicate detection at scale

```javascript
const simhasher = new SimHasher({ hashBits: 64 });
const hash1 = simhasher.computeFromText("Article content...");
const hash2 = simhasher.computeFromText("Similar article...");
const distance = simhasher.hammingDistance(hash1, hash2); // Fast comparison
```

---

### **LSH (Locality Sensitive Hashing)** - `LSHBuckets` class

**What:** Fast approximate similarity search using hash buckets.

**Real-world use cases:**

- **Search engines:** Find similar queries/documents quickly
- **Recommendation engines:** Fast "similar items" lookup
- **Data deduplication:** Identify duplicates in massive datasets
- **Image/audio search:** Find similar media files (with appropriate hashes)

**Performance:** ⚡ **Extremely Fast** queries after O(n) setup
**Best for:** Large-scale similarity search, real-time recommendations

```javascript
const lsh = new LSHBuckets({ numBands: 8, signatureLength: 128 });
lsh.add("Document 1", minHashSignature1);
lsh.add("Document 2", minHashSignature2);

const candidates = lsh.query(querySignature); // Fast similarity search
```

---

## 🚀 Performance Summary

| Algorithm        | Speed            | Memory     | Best Use Case              |
| ---------------- | ---------------- | ---------- | -------------------------- |
| **Hamming**      | ⚡⚡⚡ Fastest   | Minimal    | Fixed-length data          |
| **Jaro-Winkler** | ⚡⚡ Fast        | Low        | Names, short strings       |
| **Levenshtein**  | 🟡 Medium        | Medium     | General spell checking     |
| **OSA**          | 🟡 Medium        | Medium     | Advanced typo detection    |
| **LCS**          | 🟡 Medium        | Medium     | Sequence comparison        |
| **MinHash**      | ⚡⚡ Fast\*      | Low        | Large document similarity  |
| **SimHash**      | ⚡⚡⚡ Fastest\* | Minimal    | Document fingerprinting    |
| **LSH**          | ⚡⚡⚡ Fastest\* | High setup | Similarity search at scale |

_\*After preprocessing/setup phase_

---

## 🎨 Practical Examples

### **E-commerce Product Search**

```javascript
// Fuzzy product matching
const query = "iphone 13 pro max";
const products = ["iPhone 13 Pro Max", "iPhone 13 Pro", "Samsung Galaxy"];

const match = findBestMatch(query, products);
// Returns: {candidate: "iPhone 13 Pro Max", similarity: 0.95}
```

### **Customer Data Deduplication**

```javascript
// Find duplicate customer records
const customer1 = "John Smith, 123 Main St";
const customer2 = "Jon Smith, 123 Main Street";

const similarity = jaroWinklerSimilarity(customer1, customer2);
if (similarity > 0.85) {
  console.log("Potential duplicate detected");
}
```

### **Content Moderation Pipeline**

```javascript
// Fast duplicate detection for user-generated content
const simhasher = new SimHasher();
const contentHash = simhasher.computeFromText(userPost);

const lsh = new LSHBuckets();
const similarContent = lsh.query(contentHash);
// Check if content is too similar to existing posts
```

### **Advanced Spell Checker**

```javascript
// Handle complex typos including transpositions
const typo = "algoritm";
const correct = "algorithm";

console.log(levenshteinDistance(typo, correct)); // 2
console.log(osaDistance(typo, correct)); // 1 (better detection)
```

---

## 💡 Tips for Better Performance

- **Pre-compile patterns** for repeated use
- **Set distance limits** with `maxDistance` options where available
- **Use case-insensitive mode** with `{ caseSensitive: false }` for user input
- **Choose algorithm complexity** appropriate to your data size
- **Consider preprocessing** for large-scale operations (MinHash, SimHash, LSH)

---

Ready to find the perfect similarity algorithm for your use case? Import what you need and start comparing! 🚀
