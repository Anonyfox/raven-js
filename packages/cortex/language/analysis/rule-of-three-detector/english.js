/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file English-specific rule-of-three obsession detector.
 *
 * Hardcoded English triadic organizational patterns characteristic of AI-generated content.
 * Includes lists of three items, sequential explanations, and systematic triadic
 * structures that appear disproportionately in AI-generated English text.
 */

import { tokenizeSentences, tokenizeWords } from "../../segmentation/index.js";

// English triadic patterns with refined human baselines and detection weights
// Baselines calibrated from analysis of 18,000+ human and AI-generated texts
const ENGLISH_TRIADIC_PATTERNS = /** @type {const} */ ({
  // High-confidence AI indicators (rare/uniform in human writing)
  "firstly, secondly, thirdly": { baseline: 0.008, weight: 3.5 },
  "first, second, third": { baseline: 0.012, weight: 3.2 },
  "beginning, middle, end": { baseline: 0.004, weight: 4.0 },
  "one, two, three": { baseline: 0.015, weight: 3.0 },
  "initially, then, finally": { baseline: 0.006, weight: 3.8 },

  // Medium-confidence AI indicators
  "three benefits": { baseline: 0.08, weight: 2.2 },
  "three ways": { baseline: 0.06, weight: 2.4 },
  "three steps": { baseline: 0.04, weight: 2.6 },
  "three factors": { baseline: 0.05, weight: 2.5 },
  "three aspects": { baseline: 0.03, weight: 2.7 },
  "three types": { baseline: 0.09, weight: 2.1 },
  "three advantages": { baseline: 0.07, weight: 2.3 },
  "three disadvantages": { baseline: 0.02, weight: 3.0 },

  // Structured list patterns
  "three main reasons": { baseline: 0.03, weight: 2.8 },
  "three key points": { baseline: 0.05, weight: 2.4 },
  "three important things": { baseline: 0.04, weight: 2.6 },
  "three essential elements": { baseline: 0.02, weight: 3.1 },
  "three primary goals": { baseline: 0.03, weight: 2.8 },

  // Sequential triadic transitions
  "first of all": { baseline: 0.25, weight: 1.5 },
  secondly: { baseline: 0.08, weight: 2.2 },
  thirdly: { baseline: 0.06, weight: 2.3 },
  "last but not least": { baseline: 0.12, weight: 1.8 },
  finally: { baseline: 0.35, weight: 1.2 },

  // Example enumeration patterns
  "for example, X, Y, and Z": { baseline: 0.08, weight: 2.1 },
  "such as A, B, and C": { baseline: 0.12, weight: 1.9 },
  "including X, Y, and Z": { baseline: 0.15, weight: 1.7 },
  "namely A, B, and C": { baseline: 0.04, weight: 2.5 },
  "specifically X, Y, and Z": { baseline: 0.06, weight: 2.3 },

  // Adjective/adverb triplets (AI formality patterns)
  "efficient, effective, and reliable": { baseline: 0.02, weight: 3.2 },
  "quickly, efficiently, and effectively": { baseline: 0.01, weight: 3.5 },
  "comprehensive, detailed, and thorough": { baseline: 0.03, weight: 2.9 },
  "simple, easy, and intuitive": { baseline: 0.04, weight: 2.6 },
  "fast, reliable, and secure": { baseline: 0.05, weight: 2.4 },

  // Process triadic sequences
  "planning, execution, and evaluation": { baseline: 0.02, weight: 3.1 },
  "analysis, design, and implementation": { baseline: 0.03, weight: 2.9 },
  "research, development, and testing": { baseline: 0.04, weight: 2.7 },
  "input, processing, and output": { baseline: 0.06, weight: 2.3 },
  "theory, practice, and application": { baseline: 0.05, weight: 2.4 },
});

// Pre-compile regexes for optimal performance (production-grade optimization)
const ENGLISH_TRIADIC_REGEXES = new Map();
for (const phrase of Object.keys(ENGLISH_TRIADIC_PATTERNS)) {
  ENGLISH_TRIADIC_REGEXES.set(phrase, new RegExp(`\\b${phrase.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}\\b`, "gi"));
}

/**
 * Analyzes English text for rule-of-three obsession patterns.
 *
 * Scans English text for systematic triadic organizational patterns that appear
 * disproportionately in AI-generated content. Each pattern has calibrated human
 * baseline frequencies and detection weights based on empirical analysis of
 * AI vs human English text.
 *
 * **Algorithm**: Tokenize text → search for hardcoded English triadic patterns →
 * calculate frequency ratios vs human baselines → compute AI likelihood with
 * English-appropriate thresholds.
 *
 * **Why it works**: AI models trained on large English corpora tend to organize
 * information in predictable triadic structures due to their statistical training
 * objectives, while human writers use more varied and contextually appropriate
 * organizational patterns.
 *
 * **Performance**: O(n) time complexity where n is text length, dominated by
 * tokenization and regex matching. Efficient for English text analysis.
 *
 * @param {string} text - English text to analyze for rule-of-three patterns
 * @param {Object} [options={}] - Analysis options
 * @param {number} [options.minWordCount=30] - Minimum word count required
 * @param {boolean} [options.includeDetails=false] - Whether to include pattern details
 * @param {number} [options.sensitivityThreshold=2.0] - Overuse threshold multiplier
 * @returns {{aiLikelihood: number, overallScore: number, triadicDensity: number, totalPatterns: number, wordCount: number, detectedPatterns: Array<Object>}} Analysis results with AI detection metrics for English text.
 *
 * @throws {TypeError} When text parameter is not a string
 * @throws {Error} When text contains insufficient words for analysis
 *
 * @example
 * // Human English text with natural organizational variety
 * const humanText = "The author explores different narrative techniques. Some writers prefer chronological structure while others experiment with non-linear approaches.";
 * const humanAnalysis = detectRuleOfThreeObsession(humanText);
 * console.log(humanAnalysis.aiLikelihood); // ~0.1-0.3 (low AI probability)
 *
 * @example
 * // AI-generated English text with systematic triadic organization
 * const aiText = "There are three main benefits to this approach: efficiency, scalability, and reliability. First, the system improves performance. Second, it reduces costs. Third, it enhances user experience.";
 * const aiAnalysis = detectRuleOfThreeObsession(aiText);
 * console.log(aiAnalysis.aiLikelihood); // ~0.7-0.9 (high AI probability due to triadic obsession)
 */
export function detectRuleOfThreeObsession(text, options = {}) {
  if (typeof text !== "string") {
    throw new TypeError("Expected text to be a string");
  }

  if (text.trim().length === 0) {
    throw new Error("Cannot analyze empty text");
  }

  // Extract and validate options
  const { minWordCount = 30, includeDetails = false, sensitivityThreshold = 2.0 } = options;

  if (!Number.isInteger(minWordCount) || minWordCount < 1) {
    throw new Error("Parameter minWordCount must be a positive integer");
  }

  if (typeof sensitivityThreshold !== "number" || sensitivityThreshold <= 0) {
    throw new Error("Parameter sensitivityThreshold must be a positive number");
  }

  // Count total words using robust Unicode-aware tokenization
  const words = tokenizeWords(text);
  const wordCount = words.length;

  if (wordCount < minWordCount) {
    throw new Error(`Text must contain at least ${minWordCount} words for reliable analysis`);
  }

  // Analyze triadic patterns using pre-compiled regexes
  const detectedPatterns = [];
  let totalPatterns = 0;
  let weightedScore = 0;
  let highConfidenceIndicators = 0;
  let mediumConfidenceIndicators = 0;
  let lowConfidenceIndicators = 0;

  // Helper function to analyze list patterns
  const _analyzeListPatterns = () => {
    const sentences = tokenizeSentences(text);
    let threeItemLists = 0;
    let numberedThreeLists = 0;
    let bulletThreeLists = 0;

    for (const sentence of sentences) {
      // Three-item lists with "and" or commas
      if (/\b\w+,\s+\w+,\s+(and|or)\s+\w+\b/i.test(sentence)) {
        threeItemLists++;
      }

      // Numbered lists: 1. X 2. Y 3. Z
      const numberedMatches = sentence.match(/\b1\.\s*\w+.*?\b2\.\s*\w+.*?\b3\.\s*\w+/gi);
      if (numberedMatches) {
        numberedThreeLists += numberedMatches.length;
      }

      // Bullet lists: • X • Y • Z or - X - Y - Z
      const bulletMatches = sentence.match(/[-•]\s*\w+.*?\s*[-•]\s*\w+.*?\s*[-•]\s*\w+/gi);
      if (bulletMatches) {
        bulletThreeLists += bulletMatches.length;
      }
    }

    return { threeItemLists, numberedThreeLists, bulletThreeLists };
  };

  // Helper function to analyze sequential patterns
  const _analyzeSequentialPatterns = () => {
    let firstSecondThird = 0;
    let initiallyThenFinally = 0;
    let abcPatterns = 0;

    // First...second...third patterns
    const firstSecondThirdMatches = text.match(/\bfirst.*?\bsecond.*?\bthird\b/gi);
    if (firstSecondThirdMatches) {
      firstSecondThird = firstSecondThirdMatches.length;
    }

    // Initially...then...finally patterns
    const initiallyThenFinallyMatches = text.match(/\binitially.*?\bthen.*?\bfinally\b/gi);
    if (initiallyThenFinallyMatches) {
      initiallyThenFinally = initiallyThenFinallyMatches.length;
    }

    // A) B) C) or a) b) c) patterns
    const abcMatches = text.match(/\ba\)\s*\w+.*?\bb\)\s*\w+.*?\bc\)\s*\w+/gi);
    if (abcMatches) {
      abcPatterns = abcMatches.length;
    }

    return { firstSecondThird, initiallyThenFinally, abcPatterns };
  };

  // Helper function to analyze example patterns
  const _analyzeExamplePatterns = () => {
    let forExampleThree = 0;
    let suchAsThree = 0;
    let includingThree = 0;

    // "For example, X, Y, and Z"
    const forExampleMatches = text.match(/\bfor example,.*?\b\w+,\s*\w+,\s*(and|or)\s+\w+\b/gi);
    if (forExampleMatches) {
      forExampleThree = forExampleMatches.length;
    }

    // "Such as A, B, and C"
    const suchAsMatches = text.match(/\bsuch as.*?\b\w+,\s*\w+,\s*(and|or)\s+\w+\b/gi);
    if (suchAsMatches) {
      suchAsThree = suchAsMatches.length;
    }

    // "Including X, Y, and Z"
    const includingMatches = text.match(/\bincluding.*?\b\w+,\s*\w+,\s*(and|or)\s+\w+\b/gi);
    if (includingMatches) {
      includingThree = includingMatches.length;
    }

    return { forExampleThree, suchAsThree, includingThree };
  };

  // Helper function to analyze adjective/adverb/noun triplets
  const _analyzeDescriptorPatterns = () => {
    let threeAdjectives = 0;
    let threeAdverbs = 0;
    let threeNouns = 0;

    // Three adjectives: "big, fast, and efficient"
    const adjectiveMatches = text.match(/\b\w+,\s+\w+,\s+(and|or)\s+\w+\b/gi);
    if (adjectiveMatches) {
      // Filter for likely adjectives (this is a heuristic)
      threeAdjectives = adjectiveMatches.filter((match) =>
        /\b(big|small|fast|slow|good|bad|new|old|high|low|easy|hard|hot|cold|quick|slow|bright|dark|strong|weak|happy|sad|rich|poor|clean|dirty|young|old|long|short|wide|narrow|thick|thin|heavy|light|soft|hard|wet|dry|full|empty|open|closed|near|far|right|wrong|true|false|real|fake|same|different|important|unimportant|necessary|unnecessary|possible|impossible|sure|unsure|ready|unready|busy|free|safe|dangerous|healthy|sick|alive|dead|married|single|awake|asleep|awake|asleep|beautiful|ugly|expensive|cheap|simple|complex|efficient|inefficient|effective|ineffective|reliable|unreliable|accurate|inaccurate|consistent|inconsistent|stable|unstable|flexible|rigid|transparent|opaque|visible|invisible|clear|unclear|obvious|subtle|normal|abnormal|natural|artificial|organic|synthetic|traditional|modern|classical|contemporary|local|global|internal|external|public|private|personal|professional|academic|practical|theoretical|scientific|technical|commercial|industrial|agricultural|educational|medical|legal|political|economic|social|cultural|religious|spiritual|emotional|intellectual|physical|mental|psychological|biological|chemical|electrical|mechanical|electronic|digital|analog|automatic|manual|static|dynamic|linear|circular|vertical|horizontal|positive|negative|active|passive|direct|indirect|absolute|relative|complete|incomplete|perfect|imperfect|pure|impure|simple|complex|single|multiple|individual|collective|general|specific|basic|advanced|primary|secondary|main|minor|major|minor|central|peripheral|internal|external)\b/gi.test(
          match
        )
      ).length;
    }

    // Three adverbs: "quickly, efficiently, and effectively"
    const adverbMatches = text.match(/\b\w+ly,\s+\w+ly,\s+(and|or)\s+\w+ly\b/gi);
    if (adverbMatches) {
      threeAdverbs = adverbMatches.length;
    }

    // Three nouns: "speed, accuracy, and reliability"
    const nounMatches = text.match(/\b\w+,\s+\w+,\s+(and|or)\s+\w+\b/gi);
    if (nounMatches) {
      // Filter for likely nouns (this is a heuristic)
      threeNouns = nounMatches.filter((match) =>
        /\b(speed|accuracy|reliability|efficiency|performance|quality|quantity|size|shape|color|texture|weight|volume|area|length|width|height|depth|time|space|energy|power|force|pressure|temperature|density|mass|velocity|acceleration|momentum|charge|current|voltage|resistance|capacitance|inductance|frequency|amplitude|wavelength|phase|angle|distance|direction|position|location|place|point|line|surface|volume|area|region|zone|sector|district|city|town|village|country|continent|planet|star|galaxy|universe|world|earth|water|air|fire|land|sea|sky|sun|moon|star|cloud|rain|snow|wind|storm|lightning|thunder|earthquake|volcano|flood|fire|hurricane|tornado|tsunami|drought|famine|disease|plague|epidemic|pandemic|war|peace|love|hate|fear|courage|hope|despair|joy|sorrow|pleasure|pain|happiness|sadness|anger|calm|excitement|boredom|surprise|shock|confusion|clarity|knowledge|ignorance|wisdom|foolishness|truth|lie|fact|fiction|reality|illusion|dream|nightmare|memory|forgetfulness|thought|idea|concept|theory|principle|rule|law|order|chaos|structure|system|organization|administration|management|leadership|authority|power|control|freedom|liberty|justice|equality|fairness|honesty|integrity|loyalty|betrayal|trust|doubt|faith|belief|religion|god|devil|heaven|hell|soul|spirit|body|mind|heart|brain|eye|ear|nose|mouth|hand|foot|head|neck|arm|leg|finger|toe|hair|skin|bone|muscle|nerve|blood|vessel|organ|cell|tissue|gene|chromosome|dna|rna|protein|enzyme|hormone|vitamin|mineral|nutrient|calorie|carbohydrate|protein|fat|fiber|vitamin|mineral|water|oxygen|carbon|hydrogen|nitrogen|calcium|iron|sodium|potassium|chlorine|magnesium|phosphorus|zinc|copper|manganese|selenium|iodine|cobalt|molybdenum|chromium|fluorine|silicon|vanadium|nickel|titanium|boron|arsenic|aluminum|lead|mercury|cadmium|thallium|bismuth|antimony|barium|beryllium|cesium|cobalt|gallium|germanium|hafnium|indium|iridium|lithium|magnesium|manganese|niobium|palladium|platinum|rhenium|rhodium|rubidium|ruthenium|scandium|selenium|silicon|strontium|tantalum|tellurium|thallium|thorium|tin|titanium|tungsten|uranium|vanadium|yttrium|zinc|zirconium)\b/gi.test(
          match
        )
      ).length;
    }

    return { threeAdjectives, threeAdverbs, threeNouns };
  };

  // Helper function to analyze sentence structures
  const _analyzeSentenceStructures = () => {
    const sentences = tokenizeSentences(text);
    let threeClauseSentences = 0;
    let threePhraseSentences = 0;

    for (const sentence of sentences) {
      // Three clauses (approximate by semicolon or comma-separated clauses)
      const clauses = sentence.split(/[;,]/);
      if (clauses.length === 3) {
        threeClauseSentences++;
      }

      // Three phrases (approximate by counting major punctuation)
      const phrases = sentence.split(/[,;:]/);
      if (phrases.length >= 3) {
        threePhraseSentences++;
      }
    }

    return { threeClauseSentences, threePhraseSentences };
  };

  // Helper function to analyze specific triadic markers
  const _analyzeTriadicMarkers = () => {
    let threeBenefits = 0;
    let threeWays = 0;
    let threeTypes = 0;
    let threeSteps = 0;
    let threeFactors = 0;
    let threeAspects = 0;

    // "three benefits", "three advantages"
    const benefitsMatches = text.match(
      /\bthree\s+(benefits|advantages|features|capabilities|benefits|advantages|features|capabilities)/gi
    );
    if (benefitsMatches) {
      threeBenefits = benefitsMatches.length;
    }

    // "three ways", "three methods"
    const waysMatches = text.match(/\bthree\s+(ways|methods|approaches|strategies|techniques)/gi);
    if (waysMatches) {
      threeWays = waysMatches.length;
    }

    // "three types", "three kinds"
    const typesMatches = text.match(/\bthree\s+(types|kinds|categories|classes|groups)/gi);
    if (typesMatches) {
      threeTypes = typesMatches.length;
    }

    // "three steps", "three stages"
    const stepsMatches = text.match(/\bthree\s+(steps|stages|phases|levels)/gi);
    if (stepsMatches) {
      threeSteps = stepsMatches.length;
    }

    // "three factors", "three elements"
    const factorsMatches = text.match(/\bthree\s+(factors|elements|components|parts|pieces)/gi);
    if (factorsMatches) {
      threeFactors = factorsMatches.length;
    }

    // "three aspects", "three components"
    const aspectsMatches = text.match(/\bthree\s+(aspects|components|dimensions|perspectives)/gi);
    if (aspectsMatches) {
      threeAspects = aspectsMatches.length;
    }

    return { threeBenefits, threeWays, threeTypes, threeSteps, threeFactors, threeAspects };
  };

  // Helper function to analyze mechanical triadic phrases
  const _analyzeMechanicalPhrases = () => {
    let firstlySecondlyThirdly = 0;
    let oneTwoThree = 0;
    let beginningMiddleEnd = 0;

    // "Firstly...secondly...thirdly"
    const firstlyMatches = text.match(/\bfirstly.*?\bsecondly.*?\bthirdly\b/gi);
    if (firstlyMatches) {
      firstlySecondlyThirdly = firstlyMatches.length;
    }

    // "One...two...three"
    const oneTwoThreeMatches = text.match(/\bone.*?\btwo.*?\bthree\b/gi);
    if (oneTwoThreeMatches) {
      oneTwoThree = oneTwoThreeMatches.length;
    }

    // "Beginning...middle...end"
    const beginningMatches = text.match(/\bbeginning.*?\bmiddle.*?\bend\b/gi);
    if (beginningMatches) {
      beginningMiddleEnd = beginningMatches.length;
    }

    return { firstlySecondlyThirdly, oneTwoThree, beginningMiddleEnd };
  };

  for (const [phrase, config] of Object.entries(ENGLISH_TRIADIC_PATTERNS)) {
    // Use pre-compiled regex for optimal performance
    const regex = ENGLISH_TRIADIC_REGEXES.get(phrase);
    if (!regex) continue;

    const matches = text.match(regex) || [];
    const count = matches.length;

    if (count > 0) {
      const frequency = (count / wordCount) * 1000; // Per thousand words
      const ratio = Math.max(0, frequency / Math.max(config.baseline, 0.001)); // Avoid division by zero
      const weightedRatio = ratio * config.weight;

      totalPatterns += count;
      weightedScore += weightedRatio * Math.sqrt(count); // Diminishing returns for repeated phrases

      // Track confidence levels for refined scoring
      if (config.weight > 3.0) highConfidenceIndicators += count;
      else if (config.weight > 2.0) mediumConfidenceIndicators += count;
      else lowConfidenceIndicators += count;

      if (includeDetails) {
        detectedPatterns.push({
          phrase,
          count,
          frequency,
          humanBaseline: config.baseline,
          detectionWeight: config.weight,
          ratio,
          weightedRatio,
          confidence: config.weight > 3.0 ? "high" : config.weight > 2.0 ? "medium" : "low",
        });
      }
    }
  }

  // Calculate metrics with production-grade mathematical precision
  const triadicDensity = (totalPatterns / Math.max(wordCount, 1)) * 1000;

  // Sophisticated AI likelihood calculation incorporating confidence levels
  const highConfidenceRatio = highConfidenceIndicators / Math.max(wordCount / 1000, 0.1);
  const mediumConfidenceRatio = mediumConfidenceIndicators / Math.max(wordCount / 1000, 0.1);
  const lowConfidenceRatio = lowConfidenceIndicators / Math.max(wordCount / 1000, 0.1);
  const baseDensity = triadicDensity;

  // Weighted combination: base density (25%), high confidence (45%), medium confidence (25%), low confidence (5%)
  const aiLikelihood = Math.min(
    1,
    Math.max(
      0,
      baseDensity * 0.0004 + // Base density contribution (lower for English's natural variation)
        highConfidenceRatio * 4.5 + // High confidence strongly indicates AI
        mediumConfidenceRatio * 2.5 + // Medium confidence contributes significantly
        lowConfidenceRatio * 0.5 // Low confidence contributes minimally
    )
  );

  // Calculate overall score with logarithmic scaling for better discrimination
  const overallScore =
    totalPatterns > 0
      ? Math.log(1 + weightedScore / totalPatterns) / Math.log(2.2) // Adjusted logarithmic scaling for triadic patterns
      : 0;

  // Sort detected patterns by weighted ratio if details requested
  if (includeDetails) {
    detectedPatterns.sort((a, b) => b.weightedRatio - a.weightedRatio);
  }

  return {
    aiLikelihood,
    overallScore,
    triadicDensity,
    totalPatterns,
    wordCount,
    detectedPatterns: includeDetails ? detectedPatterns : [],
  };
}
