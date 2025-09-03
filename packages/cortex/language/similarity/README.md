# Text Similarity & Distance Algorithms

**Find how alike two pieces of text are - from typos to entire documents.**

Similarity algorithms solve the fundamental question: "How similar are these two texts?" Whether you're building spell checkers, deduplication systems, search engines, or recommendation systems, you need the right algorithm for your specific problem and scale.

## 🧰 Available Algorithms

| Algorithm                   | Purpose                        | Input           | Output             | Best For                                      |
| --------------------------- | ------------------------------ | --------------- | ------------------ | --------------------------------------------- |
| **`hammingDistance`**       | Position-based comparison      | 2 equal strings | `number` (0-n)     | Fixed-length data, binary comparison          |
| **`jaroWinklerSimilarity`** | Name/title fuzzy matching      | 2 strings       | `number` (0-1)     | Names, addresses, short text with prefixes    |
| **`levenshteinDistance`**   | Classic edit distance          | 2 strings       | `number` (0-n)     | Spell checking, general string comparison     |
| **`osaDistance`**           | Advanced edit distance         | 2 strings       | `number` (0-n)     | Typo detection, transposition handling        |
| **`lcsLength`**             | Common sequence finding        | 2 strings       | `number` (0-n)     | Code diff, version control, sequence analysis |
| **`MinHasher`**             | Document similarity estimation | Documents       | Hash signatures    | Large document comparison, plagiarism         |
| **`SimHasher`**             | Document fingerprinting        | Documents       | Binary hashes      | Near-duplicate detection at scale             |
| **`LSHBuckets`**            | Fast similarity search         | Hash signatures | Similar candidates | Real-time similarity search, recommendations  |

## 🎯 Quick Algorithm Selection

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

## 🔢 Hamming Distance: Position-Perfect Comparison

**What it does:** Counts differences at each character position. Only works with equal-length strings.

**Why it's unique:** Blazingly fast because it only checks substitutions, not insertions/deletions. Perfect for structured data where position matters.

```javascript
import { hammingDistance, hammingSimilarity } from "@raven-js/cortex";

// Binary comparison
hammingDistance("10101", "11001"); // → 2 (two positions differ)

// DNA sequences
hammingDistance("ATCG", "ATGG"); // → 1 (one nucleotide differs)

// Hash comparison
hammingDistance("abc123", "abd123"); // → 1 (one character differs)

// Similarity score (0-1)
hammingSimilarity("HELLO", "HXLLO"); // → 0.8 (4/5 positions match)
```

**✅ Use for:**

- **Fixed-format validation** - credit cards, UUIDs, hash comparison
- **Binary data comparison** - checksums, error detection
- **Bioinformatics** - DNA/RNA sequence comparison
- **Network protocols** - error-correcting codes
- **Fast screening** - quick first-pass before expensive algorithms

**❌ Don't use for:**

- **Different length strings** - algorithm requires equal lengths
- **Natural language** - doesn't handle insertions/deletions
- **Fuzzy matching** - too strict for human text
- **Substring matching** - position-dependent comparison

## 👤 Jaro-Winkler: Names & Titles Specialist

**What it does:** Fuzzy string matching optimized for names and titles. Gives extra weight to common prefixes.

**Why it's unique:** Designed specifically for matching person names, addresses, and short descriptive text. Includes utility functions for practical usage.

```javascript
import {
  jaroWinklerSimilarity,
  findBestMatch,
  groupSimilarStrings,
} from "@raven-js/cortex";

// Name matching
jaroWinklerSimilarity("Martha", "Marhta"); // → 0.96 (very high)
jaroWinklerSimilarity("García", "Garcia"); // → 0.95 (accent handling)

// Find best match from array
const names = ["John", "Joan", "Jane", "James"];
findBestMatch("Jhon", names);
// → { candidate: "John", similarity: 0.89, index: 0 }

// Group similar strings
const customers = ["John Smith", "Jon Smith", "Jane Doe", "J. Smith"];
groupSimilarStrings(customers, 0.8);
// → [["John Smith", "Jon Smith", "J. Smith"], ["Jane Doe"]]

// Company names
jaroWinklerSimilarity("Microsoft Corp", "Microsoft Corporation"); // → 0.87
```

**✅ Use for:**

- **Name matching** - person names, company names
- **Address normalization** - "Main St" vs "Main Street"
- **Product search** - fuzzy matching in catalogs
- **Customer deduplication** - finding duplicate records
- **Auto-complete suggestions** - ranking search suggestions

**❌ Don't use for:**

- **Long documents** - designed for short strings
- **Exact spelling** - better algorithms for precise typo detection
- **Code comparison** - not optimized for structured text
- **Case-sensitive matching** - works best case-insensitive

## ✏️ Levenshtein Distance: The Classic Edit Distance

**What it does:** Counts the minimum edits (insert, delete, substitute) needed to transform one string into another.

**Why it's unique:** The gold standard for string similarity. Most intuitive and widely understood metric.

```javascript
import { levenshteinDistance, levenshteinSimilarity } from "@raven-js/cortex";

// Spell checking
levenshteinDistance("recieve", "receive"); // → 2 (substitute i→e, e→i)
levenshteinDistance("kitten", "sitting"); // → 3 (substitute k→s, e→i, insert g)

// Similarity score (0-1)
levenshteinSimilarity("hello", "hallo"); // → 0.8 (4/5 characters preserved)

// DNA analysis
levenshteinDistance("ATCG", "ATCGA"); // → 1 (one insertion)

// Typo detection
const typos = ["recieve", "seperate", "definately"];
const corrections = ["receive", "separate", "definitely"];
typos.map((typo, i) => ({
  typo,
  correction: corrections[i],
  distance: levenshteinDistance(typo, corrections[i]),
}));
```

**✅ Use for:**

- **Spell checkers** - find closest correct spelling
- **Autocorrect systems** - mobile keyboard corrections
- **Data deduplication** - find similar customer records
- **Fuzzy search** - approximate string matching
- **Version comparison** - text diff generation
- **General similarity** - when you need a reliable, understood metric

**❌ Don't use for:**

- **Large documents** - quadratic complexity is too slow
- **Real-time systems** - can be expensive for long strings
- **Transposition-heavy errors** - OSA is better for swapped characters
- **Structured data** - Hamming might be more appropriate

## 🔄 OSA Distance: Advanced Typo Detection

**What it does:** Like Levenshtein but also handles adjacent character transpositions as a single operation.

**Why it's unique:** Better at catching common typing errors where people swap adjacent letters ("teh" → "the").

```javascript
import { osaDistance, osaSimilarity } from "@raven-js/cortex";

// Transposition detection
osaDistance("hello", "hlelo"); // → 1 (one transposition: el→le)
levenshteinDistance("hello", "hlelo"); // → 2 (two substitutions)

// Common typos
osaDistance("the", "teh"); // → 1 (adjacent swap)
osaDistance("form", "from"); // → 1 (o and r swapped)

// Better for keyboard errors
osaDistance("algorithm", "algoritm"); // → 1 (h and m transposed)

// Real-world spell checking
const userInput = "recieve";
const suggestions = ["receive", "retrieve", "deceive"];
suggestions
  .map((word) => ({
    word,
    distance: osaDistance(userInput, word),
  }))
  .sort((a, b) => a.distance - b.distance);
```

**✅ Use for:**

- **Advanced spell checkers** - better than Levenshtein for typos
- **Keyboard error detection** - handles adjacent key swaps
- **OCR post-processing** - scanning errors often swap characters
- **Search suggestions** - better ranking for common typing errors
- **Data cleaning** - fixing transposed characters in datasets

**❌ Don't use for:**

- **Long documents** - same complexity issues as Levenshtein
- **Non-adjacent errors** - doesn't help with distant character swaps
- **Simple applications** - Levenshtein might be sufficient and simpler
- **Real-time constraints** - slightly slower than Levenshtein

## 📝 LCS: Longest Common Subsequence

**What it does:** Finds the longest sequence of characters that appears in both strings in the same order (but not necessarily consecutive).

**Why it's unique:** Focuses on what's preserved rather than what changed. Great for understanding structural similarity.

```javascript
import { lcsLength, lcsString, lcsSimilarity } from "@raven-js/cortex";

// Find common subsequence
lcsString("ABCDGH", "AEDFHR"); // → "ADH"
lcsLength("programming", "program"); // → 7 ("program" is common)

// Code similarity
const code1 = "function hello() { return 'world'; }";
const code2 = "function hi() { return 'universe'; }";
lcsString(code1, code2); // → "function () { return ''; }" (structure preserved)

// Document comparison
lcsSimilarity("The quick brown fox", "A quick fox jumps"); // → 0.47

// Version control (simplified diff)
const original = "Line 1\nLine 2\nLine 3";
const modified = "Line 1\nNew Line\nLine 3";
lcsString(original, modified); // → "Line 1\nLine 3" (preserved lines)
```

**✅ Use for:**

- **Code plagiarism detection** - find common structures
- **Version control systems** - Git diff algorithms
- **Document comparison** - academic paper similarity
- **DNA sequencing** - find common genetic patterns
- **Diff generation** - show what stayed the same
- **Structural analysis** - focus on preserved patterns

**❌ Don't use for:**

- **Spell checking** - order preservation isn't helpful for typos
- **Real-time applications** - quadratic complexity
- **Exact matching** - other algorithms better for precise similarity
- **Short strings** - overhead may exceed benefits

## 📊 MinHash: Document Similarity Estimation

**What it does:** Creates compact signatures for large documents that can estimate similarity without comparing full text.

**Why it's unique:** Uses probabilistic techniques to compress documents into small signatures while preserving similarity relationships. Statistical guarantees on accuracy.

```javascript
import { MinHasher } from "@raven-js/cortex";

// Set up MinHasher
const minhasher = new MinHasher({
  numHashes: 128,
  useWordShingles: true,
  wordShingleSize: 2,
});

// Create signatures for documents
const doc1 = "The quick brown fox jumps over the lazy dog";
const doc2 = "A quick brown fox leaps over a lazy dog";
const doc3 = "Completely different content about cats";

const sig1 = minhasher.computeTextSignature(doc1);
const sig2 = minhasher.computeTextSignature(doc2);
const sig3 = minhasher.computeTextSignature(doc3);

// Fast similarity estimation
const jaccard12 = minhasher.estimateJaccard(sig1, sig2); // → ~0.7 (similar)
const jaccard13 = minhasher.estimateJaccard(sig1, sig3); // → ~0.1 (different)

// Bulk comparison
const documents = [doc1, doc2, doc3];
const signatures = documents.map((doc) => minhasher.computeTextSignature(doc));

// Find all similar pairs
for (let i = 0; i < signatures.length; i++) {
  for (let j = i + 1; j < signatures.length; j++) {
    const similarity = minhasher.estimateJaccard(signatures[i], signatures[j]);
    if (similarity > 0.5) {
      console.log(`Documents ${i} and ${j} are similar: ${similarity}`);
    }
  }
}
```

**✅ Use for:**

- **Plagiarism detection** - compare academic papers efficiently
- **Content deduplication** - remove duplicate articles/posts at scale
- **Recommendation systems** - "documents similar to this one"
- **Copyright detection** - find similar content across platforms
- **Large-scale clustering** - group similar documents
- **Search engines** - find related web pages

**❌ Don't use for:**

- **Small documents** - overhead exceeds benefits
- **Exact matching** - probabilistic, not deterministic
- **Real-time single comparisons** - setup cost is high
- **Highly precise requirements** - small errors are possible

## 🔗 SimHash: Document Fingerprinting

**What it does:** Creates compact binary fingerprints for documents where similar documents have similar fingerprints.

**Why it's unique:** Fixed-size fingerprints (typically 64-bit) enable super-fast comparison using Hamming distance. Used by Google for web page deduplication.

```javascript
import { SimHasher } from "@raven-js/cortex";

// Set up SimHasher
const simhasher = new SimHasher({
  hashBits: 64,
  useWordShingles: true,
  wordShingleSize: 2,
});

// Generate fingerprints
const article1 = "Breaking: New AI model achieves breakthrough results";
const article2 = "Breaking: Novel AI model reaches breakthrough performance";
const article3 = "Weather: Sunny skies expected tomorrow";

const hash1 = simhasher.computeFromText(article1);
const hash2 = simhasher.computeFromText(article2);
const hash3 = simhasher.computeFromText(article3);

// Fast comparison using Hamming distance
const distance12 = simhasher.hammingDistance(hash1, hash2); // Low (similar)
const distance13 = simhasher.hammingDistance(hash1, hash3); // High (different)

// Similarity threshold
const threshold = 10; // Bit differences allowed
const isSimilar = (hash1, hash2) =>
  simhasher.hammingDistance(hash1, hash2) <= threshold;

console.log(isSimilar(hash1, hash2)); // → true (similar articles)
console.log(isSimilar(hash1, hash3)); // → false (different topics)

// Batch processing
const articles = [article1, article2, article3];
const fingerprints = articles.map((article) => ({
  text: article,
  hash: simhasher.computeFromText(article),
}));

// Find duplicates
const duplicates = [];
for (let i = 0; i < fingerprints.length; i++) {
  for (let j = i + 1; j < fingerprints.length; j++) {
    const distance = simhasher.hammingDistance(
      fingerprints[i].hash,
      fingerprints[j].hash
    );
    if (distance <= threshold) {
      duplicates.push([i, j, distance]);
    }
  }
}
```

**✅ Use for:**

- **News clustering** - group similar news articles automatically
- **Web crawling** - avoid indexing duplicate pages
- **Social media** - detect spam or duplicate posts
- **Content moderation** - flag similar harmful content
- **Document deduplication** - at massive scale
- **Real-time similarity** - O(1) fingerprint comparison

**❌ Don't use for:**

- **Precise similarity scores** - only provides approximate similarity
- **Small text** - works best on substantial documents
- **Highly similar content** - may not distinguish fine differences
- **Structured data** - optimized for natural language text

## 🔍 LSH Buckets: Fast Similarity Search

**What it does:** Builds a hash table system that lets you quickly find all documents similar to a query document.

**Why it's unique:** After initial setup, finding similar items is extremely fast - you don't need to compare against every document in your collection.

```javascript
import { LSHBuckets } from "@raven-js/cortex";
import { MinHasher } from "@raven-js/cortex";

// Set up components
const minhasher = new MinHasher({ numHashes: 128 });
const lsh = new LSHBuckets({
  numBands: 16,
  signatureLength: 128,
});

// Prepare documents
const documents = [
  "The quick brown fox jumps over the lazy dog",
  "A quick brown fox leaps over a lazy dog",
  "The lazy dog sleeps in the sun",
  "Cats are independent animals",
  "Dogs are loyal companions",
];

// Index documents
documents.forEach((doc, index) => {
  const signature = minhasher.computeTextSignature(doc);
  lsh.add(`doc_${index}`, signature);
});

// Fast similarity search
const queryDoc = "Quick brown foxes are amazing animals";
const querySignature = minhasher.computeTextSignature(queryDoc);
const candidates = lsh.query(querySignature);

console.log("Similar documents:", candidates);
// → ["doc_0", "doc_1"] (documents about foxes)

// Real-world recommendation system
class DocumentRecommender {
  constructor() {
    this.minhasher = new MinHasher({ numHashes: 128 });
    this.lsh = new LSHBuckets({ numBands: 16, signatureLength: 128 });
    this.documents = new Map();
  }

  addDocument(id, text) {
    const signature = this.minhasher.computeTextSignature(text);
    this.lsh.add(id, signature);
    this.documents.set(id, { text, signature });
  }

  findSimilar(id, maxResults = 10) {
    const doc = this.documents.get(id);
    if (!doc) return [];

    const candidates = this.lsh.query(doc.signature);

    // Rank by actual similarity
    return candidates
      .filter((candidateId) => candidateId !== id)
      .map((candidateId) => ({
        id: candidateId,
        similarity: this.minhasher.estimateJaccard(
          doc.signature,
          this.documents.get(candidateId).signature
        ),
      }))
      .sort((a, b) => b.similarity - a.similarity)
      .slice(0, maxResults);
  }
}
```

**✅ Use for:**

- **Recommendation engines** - "users who liked this also liked..."
- **Search engines** - fast "more like this" functionality
- **Data deduplication** - find duplicates in massive datasets
- **Content discovery** - help users find related articles/products
- **Real-time similarity** - sub-second response times
- **Large-scale clustering** - group similar items efficiently

**❌ Don't use for:**

- **Small datasets** - overhead isn't worth it for < 1000 items
- **Exact matching** - probabilistic, may miss some similar items
- **One-off comparisons** - setup cost is high
- **Memory-constrained systems** - stores hash tables in memory

## 🚀 Quick Start Examples

### Content Deduplication System

```javascript
import { SimHasher } from "@raven-js/cortex";

const simhasher = new SimHasher({ hashBits: 64 });
const threshold = 5; // Bit differences allowed

function findDuplicates(documents) {
  // Generate fingerprints
  const fingerprints = documents.map((doc, index) => ({
    id: index,
    text: doc,
    hash: simhasher.computeFromText(doc),
  }));

  // Find duplicates
  const duplicates = [];
  for (let i = 0; i < fingerprints.length; i++) {
    for (let j = i + 1; j < fingerprints.length; j++) {
      const distance = simhasher.hammingDistance(
        fingerprints[i].hash,
        fingerprints[j].hash
      );

      if (distance <= threshold) {
        duplicates.push({
          doc1: fingerprints[i].id,
          doc2: fingerprints[j].id,
          similarity: 1 - distance / 64, // Convert to similarity score
        });
      }
    }
  }

  return duplicates;
}
```

### Smart Spell Checker

```javascript
import { osaDistance, levenshteinDistance } from "@raven-js/cortex";

function spellCheck(word, dictionary, maxSuggestions = 5) {
  const suggestions = dictionary
    .map((dictWord) => ({
      word: dictWord,
      osaDistance: osaDistance(word, dictWord),
      levDistance: levenshteinDistance(word, dictWord),
    }))
    .filter((suggestion) => suggestion.osaDistance <= 3) // Only close matches
    .sort((a, b) => {
      // Prefer OSA for transpositions, fall back to Levenshtein
      if (a.osaDistance !== b.osaDistance) {
        return a.osaDistance - b.osaDistance;
      }
      return a.levDistance - b.levDistance;
    })
    .slice(0, maxSuggestions)
    .map((s) => s.word);

  return suggestions;
}

// Usage
const dictionary = ["receive", "believe", "achieve", "retrieve", "deceive"];
spellCheck("recieve", dictionary); // → ["receive", "retrieve", "deceive"]
spellCheck("beleive", dictionary); // → ["believe", "receive"]
```

### Name Matching System

```javascript
import { findBestMatch, jaroWinklerSimilarity } from "@raven-js/cortex";

function findCustomerMatches(newCustomer, existingCustomers, threshold = 0.85) {
  // Find best single match
  const bestMatch = findBestMatch(
    newCustomer.name,
    existingCustomers.map((c) => c.name)
  );

  // Find all potential matches above threshold
  const potentialMatches = existingCustomers
    .map((customer, index) => ({
      ...customer,
      similarity: jaroWinklerSimilarity(newCustomer.name, customer.name),
      index,
    }))
    .filter((match) => match.similarity >= threshold)
    .sort((a, b) => b.similarity - a.similarity);

  return {
    bestMatch,
    potentialMatches,
    isLikelyDuplicate: bestMatch.similarity >= threshold,
  };
}

// Usage
const newCustomer = { name: "Jon Smith", email: "jon@email.com" };
const existing = [
  { name: "John Smith", email: "john@email.com" },
  { name: "Jane Smith", email: "jane@email.com" },
  { name: "Bob Johnson", email: "bob@email.com" },
];

const result = findCustomerMatches(newCustomer, existing);
// → Finds "John Smith" as likely duplicate
```

## 🎛️ Algorithm Selection Guide

| Use Case                      | Recommended Algorithm                 | Why                                       |
| ----------------------------- | ------------------------------------- | ----------------------------------------- |
| **Spell checking**            | `osaDistance` → `levenshteinDistance` | Handle transpositions then general edits  |
| **Name matching**             | `jaroWinklerSimilarity`               | Optimized for names and titles            |
| **Document similarity**       | `MinHasher` → `SimHasher`             | Accuracy vs speed trade-off               |
| **Real-time search**          | `LSHBuckets` + `MinHasher`            | Fast approximate search                   |
| **Exact binary comparison**   | `hammingDistance`                     | Perfect for fixed-length data             |
| **Code comparison**           | `lcsLength` → `levenshteinDistance`   | Structure preservation vs character level |
| **Large-scale deduplication** | `SimHasher` + `LSHBuckets`            | Scale and speed                           |

## ⚡ Performance Characteristics

- **`hammingDistance`**: O(n) - fastest, equal-length strings only
- **`jaroWinklerSimilarity`**: O(n×m) - fast with early termination
- **`levenshteinDistance`**: O(n×m) - standard dynamic programming
- **`osaDistance`**: O(n×m) - slightly slower than Levenshtein
- **`lcsLength`**: O(n×m) - same complexity, different focus
- **`MinHasher`**: O(n) to hash, O(k) to compare (k = signature size)
- **`SimHasher`**: O(n) to hash, O(1) to compare fingerprints
- **`LSHBuckets`**: O(n) setup, O(1) average query time

## 🚨 Common Gotchas

### Equal Length Requirement

```javascript
// ❌ WRONG - Hamming requires equal lengths
hammingDistance("hello", "world!"); // → Error!

// ✅ CORRECT - Use Levenshtein for different lengths
levenshteinDistance("hello", "world!"); // → 5
```

### Algorithm vs Similarity Score

```javascript
// Distance: 0 = identical, higher = more different
levenshteinDistance("cat", "bat"); // → 1 (one edit)

// Similarity: 1 = identical, 0 = completely different
levenshteinSimilarity("cat", "bat"); // → 0.67 (67% similar)
```

### Case Sensitivity

```javascript
// Most algorithms are case-sensitive by default
jaroWinklerSimilarity("John", "john"); // → 0.93 (not perfect)

// Normalize first for case-insensitive comparison
import { foldCase } from "@raven-js/cortex/language/normalization";
const name1 = foldCase("John");
const name2 = foldCase("john");
jaroWinklerSimilarity(name1, name2); // → 1.0 (perfect match)
```

---

💡 **Pro Tip:** For most applications, start with `jaroWinklerSimilarity` for names/titles, `osaDistance` for spell checking, and `SimHasher` for document comparison. These cover 80% of real-world similarity needs with excellent performance.
