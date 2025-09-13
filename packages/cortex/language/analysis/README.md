# Language Analysis

**Modular text analysis algorithms for content pattern detection.**

Statistical and linguistic analysis functions targeting specific text characteristics. Each algorithm operates independently with language-specific variants for optimal tree-shaking.

## 📊 Algorithm Overview

| Algorithm                       | Method                      | Speed | Focus                               |
| ------------------------------- | --------------------------- | ----- | ----------------------------------- |
| `calculateBurstiness`           | Sentence length variance    | fast  | Human variation (higher=human-like) |
| `calculateShannonEntropy`       | Character distribution      | fast  | Text randomness                     |
| `analyzeNgramRepetition`        | N-gram diversity            | fast  | Pattern repetition                  |
| `approximatePerplexity`         | Bigram predictability       | fast  | Language model deviation            |
| `analyzeZipfDeviation`          | Word frequency distribution | fast  | Power-law analysis                  |
| `analyzeAITransitionPhrases`    | Linguistic markers          | fast  | Transition phrase overuse           |
| `detectParticipalPhraseFormula` | Grammar patterns            | fast  | Syntactic structures                |
| `detectRuleOfThreeObsession`    | Triadic patterns            | fast  | List/rhetorical structures          |
| `detectPerfectGrammar`          | Error absence               | fast  | Grammatical perfection              |
| `detectEmDashEpidemic`          | Punctuation density         | fast  | Em-dash overuse                     |
| `detectTextType`                | Signature phrase analysis   | fast  | Content categorization              |

## 🚀 Modular Architecture

**Clean separation with perfect tree-shaking:**

```javascript
// Import only what you need
import { calculateBurstiness } from '@raven-js/cortex/language';

// Language-specific variants available
import { analyzeAITransitionPhrasesEnglish } from '@raven-js/cortex/language';
```

### Algorithm Organization

Each algorithm lives in its own folder with language-specific implementations:

```
analysis/
├── burstiness.js                    # Language-agnostic
├── shannon-entropy.js              # Language-agnostic
├── ai-transition-phrases/
│   ├── general.js                  # Fallback implementation
│   ├── english.js                  # English-specific phrases
│   └── german.js                   # German-specific phrases
└── [other algorithms...]
```

## 🎯 Usage Patterns

### Single Algorithm

```javascript
import { calculateBurstiness } from '@raven-js/cortex/language';

const score = calculateBurstiness(text);
// Returns: number (coefficient of variation)
```

### Language-Specific Analysis

```javascript
import {
  analyzeAITransitionPhrasesEnglish,
  detectPerfectGrammarGerman
} from '@raven-js/cortex/language';

const englishResult = analyzeAITransitionPhrasesEnglish(text);
const germanResult = detectPerfectGrammarGerman(text);
```

### Combined Analysis

```javascript
import {
  calculateBurstiness,
  analyzeAITransitionPhrases,
  detectPerfectGrammar
} from '@raven-js/cortex/language';

const burst = calculateBurstiness(text);
const transitions = analyzeAITransitionPhrases(text);
const grammar = detectPerfectGrammar(text);

// Example scoring: treat low burstiness as an AI hint and combine with heuristics
const burstinessHint = burst < 0.3 ? 0.7 : 0.3; // domain-dependent thresholding
const isAI = (burstinessHint + transitions.aiLikelihood + grammar.aiLikelihood) / 3 > 0.5;
```

## 🎯 Algorithm Details

### Statistical Algorithms

**Language-agnostic functions using mathematical analysis:**

#### `calculateBurstiness(text)`

Sentence length variation analysis using coefficient of variation.

- **Input**: String (20+ words recommended)
- **Output**: `number` (coefficient of variation σ/μ)
- **Interpretation**: Lower values indicate uniformity (more AI-like); higher values indicate variation (more human-like)

#### `calculateShannonEntropy(text)`

Character distribution randomness using information theory.

- **Input**: String (any length)
- **Output**: `{ entropy: number, normalizedEntropy: number }`
- **AI Detection**: Lower entropy indicates mechanical patterns

#### `analyzeNgramRepetition(text, options?)`

N-gram diversity analysis for pattern repetition.

- **Input**: String (20+ words recommended), optional `{ n?: number, unit?: 'word'|'char' }`
- **Output**: `{ diversity: number, repetitionRatio: number, aiLikelihood: number }`

#### `approximatePerplexity(text)`

Self-perplexity (bigram self-predictability) scoring using add-one smoothing.

- **Input**: String (20+ words recommended)
- **Output**: `{ overallPerplexity: number, predictabilityScore: number, aiLikelihood: number }`
  (Note: This measures how predictable the text is under its own bigram statistics; it is not model perplexity.)

#### `analyzeZipfDeviation(text)`

Word frequency distribution analysis against Zipf's law.

- **Input**: String (50+ words recommended)
- **Output**: `{ deviation: number, zipfExponent: number, aiLikelihood: number }`

### Linguistic Algorithms

**Language-aware pattern detection with cultural calibration:**

#### `analyzeAITransitionPhrases(text)` / `analyzeAITransitionPhrasesEnglish(text)` / `analyzeAITransitionPhrasesGerman(text)`

Mechanical transition phrase detection with natural language filtering.

- **Input**: String (20+ words recommended)
- **Output**: `{ aiLikelihood: number, totalPhrases: number, phrasesPerThousand: number }`

#### `detectParticipalPhraseFormula(text)` / `...English(text)` / `...German(text)`

Participial phrase pattern analysis.

- **Input**: String (25+ words recommended)
- **Output**: `{ aiLikelihood: number, detectedPatterns: Array, wordCount: number }`

#### `detectRuleOfThreeObsession(text)` / `...English(text)` / `...German(text)`

Triadic structure and rhetorical pattern detection.

- **Input**: String (30+ words recommended)
- **Output**: `{ aiLikelihood: number, triadPatterns: Array, wordCount: number }`

#### `detectPerfectGrammar(text)` / `...English(text)` / `...German(text)`

Grammatical error absence detection with language-aware thresholds.

- **Input**: String (30+ words recommended)
- **Output**: `{ aiLikelihood: number, perfectionScore: number, totalErrors: number }`

#### `detectEmDashEpidemic(text)` / `...English(text)` / `...German(text)`

Punctuation overuse pattern analysis.

- **Input**: String (20+ words recommended)
- **Output**: `{ aiLikelihood: number, totalPunctuation: number, density: number }`

#### `detectTextType(text)` / `...English(text)` / `...German(text)`

Content categorization using signature phrase analysis.

- **Input**: String (20+ words recommended)
- **Output**: `{ type: string, confidence: number, scores: Record<string, number> }`

## 🔧 Implementation Notes

### Error Handling

All functions throw `Error` for invalid input or insufficient text length.

### Performance

- Sub-millisecond execution for most algorithms
- Memory-efficient with minimal allocations
- Platform-native JavaScript (no external dependencies)

### Tree Shaking

Import only specific algorithms to minimize bundle size:

```javascript
// ✅ Optimal: Only imports burstiness logic
import { calculateBurstiness } from '@raven-js/cortex/language';

// ❌ Suboptimal: Imports all analysis functions
import * as analysis from '@raven-js/cortex/language/analysis';
```

## 📈 Performance Notes

All algorithms are implemented with linear-time or near-linear-time complexity and minimal allocations. Actual timings depend on runtime and input size.

## 🔍 Common Use Cases

### Content Moderation

```javascript
import { calculateBurstiness, detectPerfectGrammar } from '@raven-js/cortex/language';

function moderateContent(text) {
  const burstiness = calculateBurstiness(text);
  const grammar = detectPerfectGrammar(text);

  // AI content often shows low burstiness (uniformity) + perfect grammar
  const burstinessHint = burstiness < 0.3 ? 0.7 : 0.3; // domain-dependent
  const aiScore = (burstinessHint + grammar.aiLikelihood) / 2;
  return aiScore > 0.6 ? 'flag' : 'approve';
}
```

### Academic Integrity

```javascript
import { analyzeAITransitionPhrasesEnglish, detectRuleOfThreeObsessionEnglish } from '@raven-js/cortex/language';

function checkEssay(text) {
  const transitions = analyzeAITransitionPhrasesEnglish(text);
  const triads = detectRuleOfThreeObsessionEnglish(text);

  return transitions.aiLikelihood > 0.7 || triads.aiLikelihood > 0.6
    ? 'investigate'
    : 'likely-original';
}
```

### Real-time Filtering

```javascript
import { calculateBurstiness } from '@raven-js/cortex/language';

// Sub-millisecond AI detection for live streams
function streamFilter(text) {
  const burstiness = calculateBurstiness(text);
  return burstiness < 0.3 ? 'block' : 'allow';
}
```

## 🧭 Choose the right tool

- **Quick AI-likeness hint**: `calculateBurstiness` (uniformity), `analyzeNgramRepetition`, `approximatePerplexity` (self-predictability)
- **Clean input first**: `normalization/*` (Unicode, case), `segmentation/*` (sentences/words)
- **Build features**: `featurization/ngrams`, `featurization/hash-features`
- **Keywords**: `featurization/rake`, `featurization/textrank`
- **Similarity/dedup**: `similarity/{levenshtein, osa, jaro-winkler, minhash, simhash}`
- **Style cues**: `analysis/*` detectors (transition phrases, rule of three, em-dash, participial phrases)

### Language variants

```javascript
import { analyzeAITransitionPhrases } from '@raven-js/cortex/language';              // general
import { analyzeAITransitionPhrasesEnglish } from '@raven-js/cortex/language';      // English
import { analyzeAITransitionPhrasesGerman } from '@raven-js/cortex/language';       // German
```

### Composition example

```javascript
import {
  tokenizeWords,
  calculateBurstiness,
  analyzeNgramRepetition,
  approximatePerplexity,
} from '@raven-js/cortex/language';

export function quickAiHint(text) {
  const wc = tokenizeWords(text).length;
  if (wc < 20) return { hint: 0 };

  const burst = calculateBurstiness(text); // number
  const ngram = analyzeNgramRepetition(text).aiLikelihood; // 0..1
  const perp = approximatePerplexity(text).aiLikelihood; // 0..1

  // Treat low burstiness as an AI hint (uniformity), calibrate to your corpus
  const burstHint = burst < 0.3 ? 0.7 : 0.3;
  return { hint: (burstHint + ngram + perp) / 3 };
}
```

### Heuristic note

- `aiLikelihood` fields are heuristics in [0,1], not calibrated probabilities. Calibrate thresholds to your own corpus and risk tolerance.

### Building blocks

- See `segmentation/` for tokenizers and `normalization/` for Unicode/case handling.
- See `featurization/` and `similarity/` for downstream ML and dedup tasks.

## ⚠️ Anti-patterns (avoid these)

- **Treating `aiLikelihood` as probability**: It’s a heuristic score in [0,1]. Calibrate per corpus.
- **Analyzing tiny texts**: Respect minimum lengths (e.g., ≥20 words) or results are noisy.
- **Skipping normalization/segmentation**: Run `normalizeUnicode`, `foldCase`, and tokenizers first.
- **Using English-only variants on non-English text**: Pick the right language-specific detector or the general version.
- **Over-indexing on one metric**: Combine burstiness, n-gram repetition, and self-perplexity for robustness.
- **Assuming sentence regex is perfect**: Prefer `Intl.Segmenter` (used automatically) and treat regex fallback as best-effort.
