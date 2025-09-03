# Text Normalization Algorithms

**Clean up messy text to make it consistent and comparable.**

Normalization fixes the chaos of real-world text - different encodings, mixed character widths, case variations, and Unicode complexity. It's like having a universal translator that converts all the different ways to write the "same" text into one consistent format your code can reliably work with.

## 🧰 Available Algorithms

| Algorithm              | Purpose                    | Input    | Output   | Best For                                  |
| ---------------------- | -------------------------- | -------- | -------- | ----------------------------------------- |
| **`foldCase`**         | Smart case normalization   | `string` | `string` | Search, comparison, user input handling   |
| **`foldWidth`**        | Character width conversion | `string` | `string` | CJK text processing, form normalization   |
| **`normalizeUnicode`** | Unicode standardization    | `string` | `string` | Text comparison, search indexing, storage |

## 🔤 FoldCase: Locale-Smart Case Normalization

**What it does:** Converts text to lowercase, but _properly_ - handles the infamous Turkish I problem, German ß rules, and other locale-specific nightmares.

**Why it's unique:** Uses `toLocaleLowerCase()` instead of naive `.toLowerCase()` - prevents bugs in international applications where simple case folding fails spectacularly.

```javascript
import { foldCase } from "@raven-js/cortex";

// Basic usage (English default)
foldCase("Hello WORLD"); // → "hello world"

// Turkish locale - handles İ/I correctly
foldCase("İstanbul", "tr"); // → "i̇stanbul" (dotted i)
foldCase("İstanbul", "en"); // → "i̇stanbul" (different result!)

// German locale - handles ß properly
foldCase("STRAẞE", "de"); // → "straße" (modern ẞ → ß)
foldCase("Großbritannien", "de"); // → "großbritannien"

// Russian Cyrillic
foldCase("Москва", "ru"); // → "москва"
```

**✅ Use for:**

- **User input normalization** - make searches case-insensitive
- **International applications** - proper case handling across locales
- **Database comparisons** - consistent text matching
- **Search functionality** - "Paris" should match "PARIS" and "paris"
- **Form validation** - normalize before comparing user input

**❌ Don't use for:**

- **Display text** - preserves original case for UI
- **Passwords/tokens** - case sensitivity is important
- **Code identifiers** - variable names, etc. need exact case
- **Binary data** - only works on text strings

## 📏 FoldWidth: Fullwidth to Halfwidth Conversion

**What it does:** Converts fullwidth characters (common in Japanese/Chinese input) to regular ASCII equivalents.

**Why it's unique:** Solves the "why doesn't '１２３' equal '123'?" problem. Essential for processing user input in CJK languages where fullwidth characters look identical to ASCII but have different Unicode codes.

```javascript
import { foldWidth } from "@raven-js/cortex";

// Fullwidth digits to regular digits
foldWidth("０１２３４５"); // → "012345"

// Fullwidth letters to regular letters
foldWidth("ＨｅｌｌｏＷｏｒｌｄ"); // → "HelloWorld"

// Fullwidth punctuation
foldWidth("（Ｈｅｌｌｏ！）"); // → "(Hello!)"

// Email addresses (common user input issue)
foldWidth("ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ"); // → "test@example.com"

// Mixed content
foldWidth("Hello１２３World"); // → "Hello123World"
```

**✅ Use for:**

- **Form validation** - emails, phone numbers, URLs with mixed width
- **CJK text processing** - normalize Japanese/Chinese input
- **Search normalization** - match fullwidth and halfwidth versions
- **Data cleaning** - standardize imported data from Asian sources
- **Input sanitization** - prevent fullwidth character confusion

**❌ Don't use for:**

- **Display purposes** - may alter intended formatting
- **CJK ideographs** - only converts Latin/punctuation, not Chinese characters
- **Layout-sensitive text** - fullwidth chars might be intentional spacing
- **Binary data** - text-only processing

## 🌐 NormalizeUnicode: Unicode Standardization

**What it does:** Fixes Unicode encoding inconsistencies and optionally strips accents/diacritics. Makes "café" and "café" (different encodings) actually equal.

**Why it's unique:** Uses NFKC normalization (most comprehensive) plus optional diacritic stripping. Handles composed vs decomposed characters, compatibility mappings, and ligatures.

```javascript
import { normalizeUnicode } from "@raven-js/cortex";

// Fix composed vs decomposed characters
normalizeUnicode("café"); // → "café" (standardized)
normalizeUnicode("cafe\u0301"); // → "café" (é from e + accent)

// Compatibility mappings
normalizeUnicode("ﬀ"); // → "ff" (ligature to letters)
normalizeUnicode("ﬁ"); // → "fi" (ligature to letters)
normalizeUnicode("①"); // → "1" (circled number)

// Diacritic stripping for search
normalizeUnicode("café", true); // → "cafe"
normalizeUnicode("naïve", true); // → "naive"
normalizeUnicode("résumé", true); // → "resume"
normalizeUnicode("Zürich", true); // → "Zurich"

// Preserve diacritics by default
normalizeUnicode("café"); // → "café" (keeps accent)
```

**✅ Use for:**

- **Text comparison** - make different encodings match
- **Search functionality** - "cafe" finds "café" when stripping diacritics
- **Data deduplication** - find visually identical but differently encoded text
- **Database storage** - consistent encoding for reliable queries
- **URL slugs** - "café-parisien" → "cafe-parisien" for clean URLs

**❌ Don't use for:**

- **Proper names** - may alter important cultural/linguistic distinctions
- **Legal documents** - exact character preservation matters
- **Linguistic analysis** - diacritics carry meaning
- **Password processing** - exact character matching required

## 🚀 Quick Start Examples

### International Search System

```javascript
import { foldCase, normalizeUnicode } from "@raven-js/cortex";

function createSearchableText(text, locale = "en") {
  // Normalize Unicode encoding issues
  let normalized = normalizeUnicode(text, true); // Strip diacritics

  // Apply locale-aware case folding
  normalized = foldCase(normalized, locale);

  return normalized;
}

// Usage
const searchIndex = documents.map((doc) => ({
  id: doc.id,
  searchable: createSearchableText(doc.content, doc.locale),
  original: doc.content,
}));

function search(query, locale = "en") {
  const normalizedQuery = createSearchableText(query, locale);
  return searchIndex.filter((doc) => doc.searchable.includes(normalizedQuery));
}
```

### CJK Form Validation

```javascript
import { foldWidth, normalizeUnicode } from "@raven-js/cortex";

function normalizeUserInput(input) {
  // Fix Unicode encoding
  let cleaned = normalizeUnicode(input);

  // Convert fullwidth to halfwidth
  cleaned = foldWidth(cleaned);

  return cleaned.trim();
}

// Example: Email validation
function validateEmail(email) {
  const normalized = normalizeUserInput(email);
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  return emailRegex.test(normalized);
}

// These all validate as the same email:
validateEmail("test@example.com"); // → true
validateEmail("ｔｅｓｔ＠ｅｘａｍｐｌｅ．ｃｏｍ"); // → true (fullwidth)
validateEmail("tést@éxample.com"); // → true (with accents)
```

### Complete Text Normalization Pipeline

```javascript
import { foldCase, foldWidth, normalizeUnicode } from "@raven-js/cortex";

function normalizeForComparison(text1, text2, locale = "en") {
  function normalize(text) {
    // Step 1: Fix Unicode encoding issues
    let result = normalizeUnicode(text);

    // Step 2: Convert fullwidth to halfwidth
    result = foldWidth(result);

    // Step 3: Apply locale-aware case folding
    result = foldCase(result, locale);

    return result;
  }

  return {
    text1: normalize(text1),
    text2: normalize(text2),
    areEqual: normalize(text1) === normalize(text2),
  };
}

// Usage examples
normalizeForComparison("Café", "ＣＡＦＥ");
// → { text1: "café", text2: "cafe", areEqual: false }

normalizeForComparison("Café", "café", "en");
// → { text1: "café", text2: "café", areEqual: true }
```

### Multilingual Content Deduplication

```javascript
import { foldCase, normalizeUnicode } from "@raven-js/cortex";

function createContentFingerprint(text, locale) {
  // Aggressive normalization for deduplication
  return normalizeUnicode(foldCase(text, locale), true);
}

function findDuplicates(articles) {
  const fingerprints = new Map();
  const duplicates = [];

  for (const article of articles) {
    const fingerprint = createContentFingerprint(
      article.content,
      article.locale
    );

    if (fingerprints.has(fingerprint)) {
      duplicates.push({
        duplicate: article,
        original: fingerprints.get(fingerprint),
      });
    } else {
      fingerprints.set(fingerprint, article);
    }
  }

  return duplicates;
}
```

## 🎛️ Algorithm Selection Guide

| Use Case                  | Recommended Algorithm                        | Why                               |
| ------------------------- | -------------------------------------------- | --------------------------------- |
| **User search input**     | `foldCase` + `normalizeUnicode`              | Handle case + encoding variations |
| **CJK form processing**   | `foldWidth` → `normalizeUnicode`             | Fix width then encoding issues    |
| **Content deduplication** | All three in sequence                        | Maximum normalization             |
| **Database comparison**   | `foldCase` only                              | Fast, handles most common cases   |
| **International search**  | `normalizeUnicode` (strip=true)              | Language-agnostic matching        |
| **URL slug generation**   | `normalizeUnicode` (strip=true) + `foldCase` | Clean, ASCII-safe URLs            |

## ⚡ Performance Characteristics

- **`foldCase`**: O(n) - very fast, locale lookup is cached
- **`foldWidth`**: O(n) - regex replacement, pre-compiled for speed
- **`normalizeUnicode`**: O(n) - native browser/Node.js implementation

## 🌍 Locale Support

**`foldCase` supports all BCP 47 locale codes:**

- `"en"` - English (default)
- `"tr"` - Turkish (handles İ/I properly)
- `"de"` - German (handles ß/ẞ)
- `"ru"` - Russian (Cyrillic)
- `"el"` - Greek
- `"de-DE"`, `"de-AT"`, `"de-CH"` - Regional variants
- Plus 100+ other locales

## 🚨 Common Gotchas

### The Turkish I Problem

```javascript
// ❌ WRONG - breaks for Turkish users
"İstanbul".toLowerCase(); // → "i̇stanbul"

// ✅ CORRECT - locale-aware
foldCase("İstanbul", "tr"); // → proper Turkish result
```

### Fullwidth Number Confusion

```javascript
// ❌ These are NOT equal!
"123" === "１２３"; // → false

// ✅ Normalize first
foldWidth("１２３"); // → "123"
```

### Unicode Encoding Ambiguity

```javascript
// ❌ These LOOK the same but aren't equal
"café" === "cafe\u0301"; // → false (composed vs decomposed)

// ✅ Normalize to consistent encoding
normalizeUnicode("café") === normalizeUnicode("cafe\u0301"); // → true
```

---

💡 **Pro Tip:** For maximum compatibility, run text through all three normalizations in sequence: `normalizeUnicode()` → `foldWidth()` → `foldCase()`. This handles encoding issues, character width problems, and case variations in one clean pipeline.
