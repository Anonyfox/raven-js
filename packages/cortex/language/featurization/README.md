# Text Featurization Algorithms

**Convert raw text into structured data that machines can work with.**

Featurization is like preprocessing for text - taking messy, unstructured text and converting it into clean, numerical representations or structured features that your algorithms can actually use. Think of it as the bridge between "human text" and "machine-readable data."

## 🧰 Available Algorithms

| Algorithm          | Purpose                  | Input    | Output       | Best For                                      |
| ------------------ | ------------------------ | -------- | ------------ | --------------------------------------------- |
| **`ngrams`**       | Text chunking            | `string` | `string[]`   | Pattern recognition, autocomplete, similarity |
| **`hashFeatures`** | Text fingerprinting      | `string` | `hex string` | Deduplication, fast similarity, clustering    |
| **`rake`**         | Keyword extraction       | `string` | `string[]`   | SEO, content analysis, tagging                |
| **`textrank`**     | Smart keyword extraction | `string` | `string[]`   | Document summarization, key topics            |

## 📝 N-Grams: Text Chunking for Patterns

**What it does:** Breaks text into overlapping chunks (like "hello world" → ["hello", "world"] or ["he", "el", "ll", "lo"]).

**Why it's unique:** The foundation of most text analysis - gives you the building blocks to detect patterns, similarity, and predict what comes next.

```javascript
import { ngrams } from "@raven-js/cortex";

// Default: word bigrams (most common)
ngrams("machine learning is awesome");
// → ['machine learning', 'learning is', 'is awesome']

// Character trigrams (for typo detection, fuzzy matching)
ngrams("hello", { type: "chars" });
// → ['hel', 'ell', 'llo']

// Both at once (comprehensive features)
ngrams("hello world", { type: "mixed" });
// → { char: ['hel', 'ell', ...], word: ['hello world'] }
```

**✅ Use for:**

- **Autocomplete/suggestions** - predict next words
- **Similarity detection** - compare document overlap
- **Language detection** - different languages have different n-gram patterns
- **Spell checking** - character n-grams catch typos
- **Search optimization** - partial matches

**❌ Don't use for:**

- **Semantic understanding** - n-grams don't understand meaning
- **Large-scale similarity** - too slow for millions of documents
- **Real-time chat** - processing overhead might be noticeable

## 🔐 Hash Features: Lightning-Fast Text Fingerprints

**What it does:** Converts any text into a fixed-size hex string (like a text "fingerprint").

**Why it's unique:** Blazingly fast similarity checks - instead of comparing full texts, compare short hex strings. Uses the "hashing trick" to compress infinite text possibilities into fixed-size buckets.

```javascript
import { hashFeatures } from "@raven-js/cortex";

// Generate fingerprint
const hash1 = hashFeatures("The quick brown fox jumps");
const hash2 = hashFeatures("The quick brown fox leaps");
// → Both return 128-character hex strings

// Similar texts = similar hashes (use hamming distance to compare)
// Identical texts = identical hashes (perfect for deduplication)

// High precision for exact matching
hashFeatures("Important document", {
  numFeatures: 1024, // More precision
  featureType: "words", // Word-based only
  useSignHash: false, // Faster, less collision-resistant
});
```

**✅ Use for:**

- **Deduplication** - find exact/near-duplicate content instantly
- **Database indexing** - fixed-size keys for variable text
- **Real-time similarity** - compare hashes instead of full text
- **Content fingerprinting** - track document versions
- **Clustering preparation** - group similar documents fast

**❌ Don't use for:**

- **Understanding content** - hashes lose all semantic meaning
- **Partial matches** - can't find "similar" parts of different documents
- **Human-readable output** - it's just a hex string
- **Small datasets** - overhead might exceed benefits

## 🎯 RAKE: Smart Keyword Extraction

**What it does:** Finds the most important keywords and phrases by analyzing how words appear together.

**Why it's unique:** Fast and simple - no training data needed. Works by finding phrases that aren't broken up by common words (stopwords), then scoring them based on word frequency and co-occurrence.

```javascript
import { rake } from "@raven-js/cortex";

// Basic usage (works without stopwords)
rake("Machine learning algorithms are powerful tools");
// → ['machine learning algorithms', 'powerful tools']

// With stopwords for better results
import { ENGLISH_STOPWORDS } from "@raven-js/cortex/language/stopwords";

rake("Natural language processing is fascinating", {
  stopwords: ENGLISH_STOPWORDS,
  maxKeywords: 3,
});
// → ['natural language processing', 'fascinating']
```

**✅ Use for:**

- **SEO keyword extraction** - find key terms from content
- **Content tagging** - auto-generate tags for blog posts
- **Document summarization** - identify main topics quickly
- **Search indexing** - extract searchable terms
- **Content analysis** - understand what articles are about

**❌ Don't use for:**

- **Short text** - needs enough content to find meaningful phrases
- **Highly technical content** - might miss domain-specific important terms
- **Sentiment analysis** - doesn't understand emotional context
- **Multi-language content** - requires language-specific stopwords

## 🌐 TextRank: Google PageRank for Keywords

**What it does:** Builds a graph of word relationships and ranks them like Google ranks web pages - words that connect to important words become important themselves.

**Why it's unique:** More sophisticated than RAKE - understands that some words are important because of their connections, not just their frequency. Better at finding truly significant terms.

```javascript
import { textrank } from "@raven-js/cortex";

// Finds interconnected important terms
textrank("Machine learning revolutionizes artificial intelligence research", {
  stopwords: ENGLISH_STOPWORDS,
  maxKeywords: 3,
  windowSize: 4, // How far apart words can be to connect
});
// → ['machine learning', 'artificial intelligence', 'research']

// Fine-tune the algorithm
textrank(longDocument, {
  maxIterations: 100, // More precision
  dampingFactor: 0.85, // PageRank parameter
  extractPhrases: true, // Get multi-word phrases
});
```

**✅ Use for:**

- **Academic paper analysis** - find key research terms
- **Long document summarization** - identify central concepts
- **Content recommendation** - understand document themes
- **Knowledge graph building** - find related important concepts
- **Advanced SEO** - discover semantically important terms

**❌ Don't use for:**

- **Real-time applications** - slower than RAKE (iterative algorithm)
- **Very short text** - needs enough content to build meaningful graphs
- **Simple keyword extraction** - RAKE might be faster and good enough
- **Memory-constrained environments** - builds internal word graphs

## 🚀 Quick Start Examples

### Content Deduplication System

```javascript
import { hashFeatures } from "@raven-js/cortex";

// Hash all your documents
const documentHashes = documents.map((doc) => ({
  id: doc.id,
  hash: hashFeatures(doc.content),
}));

// Find duplicates instantly
const duplicates = documentHashes.filter((doc, i) =>
  documentHashes.slice(i + 1).some((other) => other.hash === doc.hash)
);
```

### Smart Article Tagging

```javascript
import { rake, textrank } from "@raven-js/cortex";
import { ENGLISH_STOPWORDS } from "@raven-js/cortex/language/stopwords";

function autoTag(articleContent) {
  // Fast tags with RAKE
  const quickTags = rake(articleContent, {
    stopwords: ENGLISH_STOPWORDS,
    maxKeywords: 5,
  });

  // Important concepts with TextRank
  const keyTopics = textrank(articleContent, {
    stopwords: ENGLISH_STOPWORDS,
    maxKeywords: 3,
  });

  return { quickTags, keyTopics };
}
```

### Text Similarity Pipeline

```javascript
import { ngrams, hashFeatures } from "@raven-js/cortex";

function similarityPipeline(text1, text2) {
  // Fast first-pass with hash features
  const hash1 = hashFeatures(text1);
  const hash2 = hashFeatures(text2);

  if (hash1 === hash2) return 1.0; // Identical

  // Detailed comparison with n-grams
  const ngrams1 = new Set(ngrams(text1));
  const ngrams2 = new Set(ngrams(text2));

  const intersection = new Set([...ngrams1].filter((x) => ngrams2.has(x)));
  const union = new Set([...ngrams1, ...ngrams2]);

  return intersection.size / union.size; // Jaccard similarity
}
```

## 🎛️ Algorithm Selection Guide

| Use Case                    | Recommended Algorithm       | Why                               |
| --------------------------- | --------------------------- | --------------------------------- |
| **Autocomplete**            | `ngrams`                    | Predicts next text chunks         |
| **Duplicate detection**     | `hashFeatures`              | Fast, exact matching              |
| **Blog post tagging**       | `rake`                      | Quick, no training needed         |
| **Research paper analysis** | `textrank`                  | Finds conceptual importance       |
| **Search indexing**         | `ngrams` + `hashFeatures`   | Coverage + speed                  |
| **Content clustering**      | `hashFeatures` → `textrank` | Fast grouping, then deep analysis |

## 📊 Performance Characteristics

- **`ngrams`**: O(n) - linear with text length
- **`hashFeatures`**: O(n) - linear, very fast constants
- **`rake`**: O(n) - linear, moderate constants
- **`textrank`**: O(n²) - quadratic, use for important content only

---

💡 **Pro Tip:** Start with `hashFeatures` for quick similarity, then use `rake` for human-readable insights, and `textrank` when you need the best possible keyword quality.
