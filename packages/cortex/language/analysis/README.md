# AI Text Detection Algorithms

**Mathematical text analysis for content authenticity verification.**

Advanced linguistic algorithms that detect AI-generated content through statistical pattern recognition. Each algorithm targets specific characteristics of artificial text generation, from sentence structure uniformity to linguistic marker overuse.

## 🎯 Algorithm Decision Matrix

**Choose your detection strategy based on use case and performance requirements:**

| Algorithm                           | Detection Method     | Speed   | Accuracy | Best For            | Avoid When              |
| ----------------------------------- | -------------------- | ------- | -------- | ------------------- | ----------------------- |
| **`analyzeWithEnsemble`**           | Combined scoring     | Medium  | Highest  | Production systems  | Real-time streams       |
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
- **2-3ms**: `analyzeWithEnsemble` (combines 10+ algorithms with smart early termination)

### Accuracy vs Speed Trade-offs

- **Highest Accuracy**: Use `analyzeWithEnsemble` (~2ms, 85-95% accuracy)
- **Balanced**: Combine `detectPerfectGrammar` + `calculateBurstiness` + `approximatePerplexity` (~1ms total, 75-85% accuracy)
- **Speed-First**: Use `calculateBurstiness` alone (~0.04ms, 65-75% accuracy)

## 🧠 Algorithm Selection Guide

### Content Moderation Pipeline

```javascript
import { analyzeWithEnsemble, calculateBurstiness } from "@raven-js/cortex";

// Fast initial screening
function quickScreen(text) {
  const burstiness = calculateBurstiness(text);
  return burstiness < 0.3 ? "flag-for-review" : "likely-human";
}

// Comprehensive analysis for flagged content
function deepAnalysis(text) {
  const result = analyzeWithEnsemble(text, { enableEarlyTermination: true });
  return result.aiLikelihood > 0.7 ? "ai-generated" : "human-written";
}
```

### Academic Integrity Checking

```javascript
import {
  detectPerfectGrammar,
  analyzeAITransitionPhrases,
} from "@raven-js/cortex";

function checkEssayAuthenticity(essayText) {
  // AI essays tend to be grammatically perfect
  const grammar = detectPerfectGrammar(essayText);

  // And use formal transition phrases excessively
  const transitions = analyzeAITransitionPhrases(essayText);

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

function analyzeMarketingCopy(content) {
  // AI marketing copy obsesses with three-item lists
  const ruleOfThree = detectRuleOfThreeObsession(content);

  // And uses formulaic transition phrases
  const transitions = analyzeAITransitionPhrases(content);

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

- **Optimized for**: English text analysis
- **Partial Support**: Germanic languages (German, Dutch)
- **Limited**: Romance languages, non-Latin scripts
- **Not Supported**: Right-to-left languages, logographic systems

### Performance Optimization

```javascript
// For high-volume processing, batch similar algorithms
const batchAnalysis = texts.map((text) => ({
  text,
  burstiness: calculateBurstiness(text),
  entropy: calculateShannonEntropy(text),
  grammar: detectPerfectGrammar(text),
}));

// Early termination for obvious cases
function smartAnalysis(text) {
  const quick = calculateBurstiness(text);
  if (quick < 0.2 || quick > 0.8) {
    return { aiLikelihood: quick < 0.2 ? 0.9 : 0.1, fast: true };
  }

  // Full analysis only when needed
  return analyzeWithEnsemble(text);
}
```

## 🚀 Production Integration Patterns

### Error Boundary Pattern

```javascript
import { analyzeWithEnsemble } from "@raven-js/cortex";
import { detectTextType } from "@raven-js/cortex/language/analysis";
import { ENGLISH_SIGNATURE_PHRASES } from "@raven-js/cortex/language/signaturephrases";

function safeAnalysis(text) {
  try {
    return analyzeWithEnsemble(text, {
      maxExecutionTime: 100,
      signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
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

  const result = analyzeWithEnsemble(text);
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
  const grammar = detectPerfectGrammar(text);
  if (grammar.aiLikelihood > 0.8)
    return { aiLikelihood: 0.8, method: "grammar" };

  // Phase 3: Full ensemble analysis (< 25ms)
  return analyzeWithEnsemble(text, {
    includeDetails: false,
    signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
  });
}
```

## 🧩 Text Type Classification (Language Packs)

```javascript
import { detectTextType } from "@raven-js/cortex/language/analysis";
import {
  ENGLISH_SIGNATURE_PHRASES,
  GERMAN_SIGNATURE_PHRASES,
  MINIMAL_SIGNATURE_PHRASES,
} from "@raven-js/cortex/language/signaturephrases";

const { type, confidence } = detectTextType(text, {
  signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
});

// In the ensemble:
analyzeWithEnsemble(text, { signaturePhrases: MINIMAL_SIGNATURE_PHRASES });
```

Notes:

- Pass `signaturePhrases` to enable `textType: 'auto'` without bundling a default language.
- Choose packs explicitly for tree-shaking. `MINIMAL_SIGNATURE_PHRASES` is a low-FP broad default.

---

**⚡ Pro Tip**: Start with `calculateBurstiness` for speed, escalate to `analyzeWithEnsemble` for accuracy. Most production systems need both strategies depending on volume and precision requirements.
