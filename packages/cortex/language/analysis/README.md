# AI Text Detection Algorithms

**Mathematical text analysis for content authenticity verification.**

Advanced linguistic algorithms that detect AI-generated content through statistical pattern recognition. Each algorithm targets specific characteristics of artificial text generation, from sentence structure uniformity to linguistic marker overuse.

## 🎯 Algorithm Decision Matrix

**Choose your detection strategy based on use case and performance requirements:**

| Algorithm                           | Detection Method     | Speed   | Accuracy | Best For            | Avoid When              |
| ----------------------------------- | -------------------- | ------- | -------- | ------------------- | ----------------------- |
| **`isAIText`** (Cascade)            | Hierarchical layers  | Fast    | Highest  | Production systems  | Simple batch processing |
| **`analyzeWithEnsemble`**           | Combined scoring     | Medium  | High     | Batch processing    | Real-time streams       |
| **`detectPerfectGrammar`**          | Error absence        | Fast    | High     | Academic screening  | Informal content        |
| **`calculateBurstiness`**           | Sentence variance    | Fastest | Medium   | Real-time filtering | Short text snippets     |
| **`approximatePerplexity`**         | Word predictability  | Medium  | High     | Content moderation  | Non-English text        |
| **`calculateShannonEntropy`**       | Character randomness | Fast    | Medium   | Spam detection      | Creative writing        |
| **`analyzeAITransitionPhrases`**    | Linguistic markers   | Fast    | Medium   | Blog screening      | Technical documentation |
| **`detectRuleOfThreeObsession`**    | List patterns        | Fastest | Low      | Marketing content   | Academic papers         |
| **`analyzeNgramRepetition`**        | Text repetition      | Medium  | Medium   | Generated reviews   | Poetry/lyrics           |
| **`detectParticipalPhraseFormula`** | Grammar patterns     | Fast    | Medium   | Business content    | Creative writing        |
| **`analyzeZipfDeviation`**          | Word frequency       | Medium  | Medium   | Long documents      | Short messages          |
| **`detectEmDashEpidemic`**          | Punctuation overuse  | Fastest | Low      | Formal writing      | Casual text             |

## ⚡ Performance Characteristics

### Execution Speed (typical 300-word text, measured)

- **Sub-0.5ms**: `calculateBurstiness` (~0.04ms), `detectEmDashEpidemic` (~0.02ms)
- **0.1-0.3ms**: `detectRuleOfThreeObsession`, `calculateShannonEntropy`, `analyzeAITransitionPhrases`, `analyzeNgramRepetition`, `analyzeZipfDeviation`
- **0.3-0.8ms**: `detectPerfectGrammar`, `detectParticipalPhraseFormula`, `approximatePerplexity`
- **2-3ms**: `analyzeWithEnsemble` (combines 10+ algorithms with statistical averaging)
- **0.2-15ms**: `isAIText` (hierarchical cascade with early termination, varies by text complexity)

### Accuracy vs Speed Trade-offs

- **Highest Accuracy**: Use `isAIText` cascade (~0.2-15ms, 85-95% accuracy with early termination)
- **Consistent Performance**: Use `analyzeWithEnsemble` (~2ms, 80-90% accuracy)
- **Balanced**: Combine `detectPerfectGrammar` + `calculateBurstiness` + `approximatePerplexity` (~1ms total, 75-85% accuracy)
- **Speed-First**: Use `calculateBurstiness` alone (~0.04ms, 65-75% accuracy)

## 🚀 Cascade Architecture (New)

**The `isAIText` cascade provides optimal speed/accuracy balance through hierarchical detection:**

### Layer 1: Statistical Fingerprints (sub-1ms)

- **Burstiness**: Sentence length variation analysis
- **Shannon Entropy**: Character distribution randomness
- **Grammar Perfection**: Error detection with language-aware thresholds

Early termination when statistical evidence is conclusive (90%+ certainty).

### Layer 2: Linguistic Tells (1-3ms)

- **AI Transition Phrases**: Mechanical connector detection with natural language filtering
- **Punctuation Overuse**: Sophisticated punctuation pattern analysis
- **Rule-of-Three Obsession**: Triadic pattern detection with cultural calibration

Proceeds only if Layer 1 uncertainty remains. Early termination at 75%+ certainty.

### Layer 3: Deep Structure Analysis (3-5ms, rarely reached)

- **Zipf's Law Deviation**: Word frequency distribution analysis
- **N-gram Repetition**: Text diversity measurement
- **Perplexity Approximation**: Predictability scoring
- **Participial Phrase Formula**: Advanced grammar pattern detection

Only executes when both Layer 1 and Layer 2 show uncertainty.

### Language Pack Integration

- **German**: Extensive calibration for business communication patterns
- **English**: Baseline configuration for standard detection
- **Minimal**: Lightweight fallback for unknown languages

## 🧠 Algorithm Selection Guide

### Content Moderation Pipeline

```javascript
import {
  isAIText,
  analyzeWithEnsemble,
  calculateBurstiness,
} from "@raven-js/cortex";
import { ENGLISH_LANGUAGE_PACK } from "@raven-js/cortex/language/languagepacks/english.js";

// Recommended: Use hierarchical cascade for optimal speed/accuracy balance
function screenContent(text) {
  const result = isAIText(text, { languagePack: ENGLISH_LANGUAGE_PACK });
  return {
    isAI: result.aiLikelihood > 0.7,
    confidence: result.certainty,
    pattern: result.dominantPattern,
    executionTime: result.executionTime,
  };
}

// Alternative: Fast initial screening with single algorithm
function quickScreen(text) {
  const burstiness = calculateBurstiness(text);
  return burstiness < 0.3 ? "flag-for-review" : "likely-human";
}

// Comprehensive analysis for flagged content
function deepAnalysis(text) {
  const result = analyzeWithEnsemble(text, {
    enableEarlyTermination: true,
    languagePack: ENGLISH_LANGUAGE_PACK,
  });
  return result.aiLikelihood > 0.7 ? "ai-generated" : "human-written";
}
```

### Academic Integrity Checking

```javascript
import {
  detectPerfectGrammar,
  analyzeAITransitionPhrases,
} from "@raven-js/cortex";
import { ENGLISH_LANGUAGE_PACK } from "@raven-js/cortex/language/languagepacks/english.js";

function checkEssayAuthenticity(essayText) {
  // AI essays tend to be grammatically perfect
  const grammar = detectPerfectGrammar(essayText, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  });

  // And use formal transition phrases excessively
  const transitions = analyzeAITransitionPhrases(essayText, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  });

  const combinedScore = (grammar.aiLikelihood + transitions.aiLikelihood) / 2;

  if (combinedScore > 0.8) return "requires-investigation";
  if (combinedScore > 0.6) return "flag-for-review";
  return "likely-authentic";
}
```

### Real-time Stream Processing

```javascript
import { calculateBurstiness, calculateShannonEntropy } from "@raven-js/cortex";

// Ultra-fast detection for high-volume streams
function streamFilter(texts) {
  return texts.map((text) => {
    const burstiness = calculateBurstiness(text);
    const entropy = calculateShannonEntropy(text);

    // Simple threshold-based classification
    const aiScore = (1 - burstiness) * 0.6 + (1 - entropy / 5) * 0.4;
    return { text, aiScore, flagged: aiScore > 0.7 };
  });
}
```

### Marketing Content Analysis

```javascript
import {
  detectRuleOfThreeObsession,
  analyzeAITransitionPhrases,
} from "@raven-js/cortex";
import { ENGLISH_LANGUAGE_PACK } from "@raven-js/cortex/language/languagepacks/english.js";

function analyzeMarketingCopy(content) {
  // AI marketing copy obsesses with three-item lists
  const ruleOfThree = detectRuleOfThreeObsession(content, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  });

  // And uses formulaic transition phrases
  const transitions = analyzeAITransitionPhrases(content, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  });

  return {
    aiLikelihood: Math.max(ruleOfThree.aiLikelihood, transitions.aiLikelihood),
    patterns: {
      formulaicLists: ruleOfThree.aiLikelihood > 0.6,
      genericTransitions: transitions.aiLikelihood > 0.5,
    },
  };
}
```

## 🔬 Understanding Algorithm Output

### Standard Return Format

```javascript
{
  aiLikelihood: 0.73,      // Primary score (0-1, higher = more AI-like)
  confidence: 0.89,        // Confidence in the assessment
  score: 0.65,             // Algorithm-specific score
  // Algorithm-specific metrics...
}
```

### Interpreting AI Likelihood Scores

| Score Range   | Interpretation | Recommended Action                     |
| ------------- | -------------- | -------------------------------------- |
| **0.0 - 0.3** | Likely Human   | Accept as authentic                    |
| **0.3 - 0.6** | Uncertain      | Manual review or additional algorithms |
| **0.6 - 0.8** | Likely AI      | Flag for investigation                 |
| **0.8 - 1.0** | Very Likely AI | Reject or require verification         |

### False Positive Mitigation

**High False Positive Risk:**

- `detectPerfectGrammar`: Professional editors, technical writers
- `analyzeAITransitionPhrases`: Academic writing, formal business communication
- `detectRuleOfThreeObsession`: Marketing copy, structured content

**Low False Positive Risk:**

- `calculateBurstiness`: Robust across writing styles
- `approximatePerplexity`: Stable for most content types
- `analyzeWithEnsemble`: Built-in false positive reduction

## ⚠️ Critical Usage Guidelines

### Text Length Requirements

- **Minimum**: 30-50 words for reliable results
- **Optimal**: 100-500 words for best accuracy
- **Maximum**: No hard limit, but diminishing returns after 1000 words

### Language Considerations

- Provide a language pack via `signaturePhrases` (e.g., ENGLISH, GERMAN, MINIMAL)
- Tree-shake by importing only the packs you need

### Performance Optimization

```javascript
// For high-volume processing, batch similar algorithms
const batchAnalysis = texts.map((text) => ({
  text,
  burstiness: calculateBurstiness(text),
  entropy: calculateShannonEntropy(text),
  grammar: detectPerfectGrammar(text, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  }),
}));

// Early termination for obvious cases
function smartAnalysis(text) {
  const quick = calculateBurstiness(text);
  if (quick < 0.2 || quick > 0.8) {
    return { aiLikelihood: quick < 0.2 ? 0.9 : 0.1, fast: true };
  }

  // Full analysis only when needed
  return analyzeWithEnsemble(text, {
    signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
  });
}
```

## 🚀 Production Integration Patterns

### Error Boundary Pattern

```javascript
import { analyzeWithEnsemble } from "@raven-js/cortex";
import { detectTextType } from "@raven-js/cortex/language/analysis";
import { ENGLISH_LANGUAGE_PACK } from "@raven-js/cortex/language/languagepacks/english.js";

function safeAnalysis(text) {
  try {
    return analyzeWithEnsemble(text, {
      maxExecutionTime: 100,
      languagePack: ENGLISH_LANGUAGE_PACK,
    });
  } catch (error) {
    console.warn("AI detection failed:", error.message);
    return { aiLikelihood: 0.5, error: true }; // Neutral score on failure
  }
}
```

### Caching Strategy

```javascript
import crypto from "node:crypto";

const analysisCache = new Map();

function cachedAnalysis(text) {
  const hash = crypto
    .createHash("sha256")
    .update(text)
    .digest("hex")
    .slice(0, 16);

  if (analysisCache.has(hash)) {
    return analysisCache.get(hash);
  }

  const result = analyzeWithEnsemble(text, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  });
  analysisCache.set(hash, result);
  return result;
}
```

### Progressive Analysis

```javascript
// Start with fastest algorithms, escalate if needed
async function progressiveDetection(text) {
  // Phase 1: Ultra-fast screening (< 1ms)
  const burstiness = calculateBurstiness(text);
  if (burstiness < 0.2) return { aiLikelihood: 0.85, method: "burstiness" };
  if (burstiness > 0.7) return { aiLikelihood: 0.15, method: "burstiness" };

  // Phase 2: Medium confidence check (< 5ms)
  const grammar = detectPerfectGrammar(text, {
    languagePack: ENGLISH_LANGUAGE_PACK,
  });
  if (grammar.aiLikelihood > 0.8)
    return { aiLikelihood: 0.8, method: "grammar" };

  // Phase 3: Full ensemble analysis (< 25ms)
  return analyzeWithEnsemble(text, {
    includeDetails: false,
    languagePack: ENGLISH_LANGUAGE_PACK,
  });
}
```

## 🧩 Text Type Classification (Language Packs)

```javascript
import { detectTextType } from "@raven-js/cortex/language/analysis";
import {
  ENGLISH_LANGUAGE_PACK,
  GERMAN_LANGUAGE_PACK,
  MINIMAL_LANGUAGE_PACK,
} from "@raven-js/cortex/language/languagepacks";

const { type, confidence } = detectTextType(text, {
  languagePack: ENGLISH_LANGUAGE_PACK,
});

// In the ensemble:
analyzeWithEnsemble(text, { languagePack: MINIMAL_LANGUAGE_PACK });
```

Notes:

- Pass `languagePack` to enable `textType: 'auto'` without bundling a default language.
- Choose packs explicitly for tree-shaking. `MINIMAL_LANGUAGE_PACK` is a low-FP broad default.

---

**⚡ Pro Tip**: Start with `calculateBurstiness` for speed, escalate to `analyzeWithEnsemble` for accuracy. Most production systems need both strategies depending on volume and precision requirements.
