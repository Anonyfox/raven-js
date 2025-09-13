/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Sentence tokenization using Intl.Segmenter with regex fallback.
 *
 * Provides intelligent sentence boundary detection that handles abbreviations,
 * decimals, and various punctuation marks correctly. Uses modern Intl.Segmenter
 * when available, falling back to heuristic-based regex patterns.
 */

// Pre-compiled regexes for V8 optimization - avoid regex compilation on every call
// Allow Unicode sentence-ending punctuation and optional leading quotes/brackets before next sentence
const SENTENCE_BOUNDARY_REGEX = /([.!?…！？。]+)(?:\s+)(?=(?:["'“”«»([{]+\s*)?[A-Z\p{Lu}])/u;
const PUNCTUATION_END_REGEX = /[.!?…！？。]+$/u;

// Minimal common abbreviation tails to avoid false splits in regex fallback (language-agnostic but biased to EN)
// Intentionally small to stay fast and avoid maintenance bloat
const ABBREVIATION_ENDINGS = new Set([
  "Mr.",
  "Mrs.",
  "Ms.",
  "Dr.",
  "Prof.",
  "Sr.",
  "Jr.",
  "St.",
  "vs.",
  "etc.",
  "No.",
  "Fig.",
  "Eq.",
  "Dept.",
  "Inc.",
  "Ltd.",
  "Jan.",
  "Feb.",
  "Mar.",
  "Apr.",
  "Jun.",
  "Jul.",
  "Aug.",
  "Sep.",
  "Sept.",
  "Oct.",
  "Nov.",
  "Dec.",
  "z.B.",
  "bzw.",
  "u.a.",
  "ca.",
]);

/**
 * Tokenizes text into sentences using intelligent boundary detection.
 *
 * Uses Intl.Segmenter for accurate sentence boundary detection when available,
 * falling back to heuristic-based regex for older environments. Handles
 * abbreviations, decimals, ellipses, and various punctuation correctly.
 *
 * @param {string} text - The text to tokenize into sentences
 * @param {string} locale - BCP 47 locale code for segmentation rules
 * @returns {string[]} Array of sentence tokens, trimmed of leading/trailing whitespace
 *
 * @example
 * // Basic sentence tokenization
 * tokenizeSentences('Hello world. How are you?'); // ['Hello world.', 'How are you?']
 *
 * @example
 * // Handles abbreviations and decimals
 * tokenizeSentences('Mr. Smith paid $1.50. Great deal!'); // ['Mr. Smith paid $1.50.', 'Great deal!']
 *
 * @example
 * // Multiple punctuation marks
 * tokenizeSentences('Really?! Yes... I think so.'); // ['Really?!', 'Yes... I think so.']
 */
export function tokenizeSentences(text, locale = "en") {
  // Handle edge cases - return early for invalid inputs
  if (!text) return [];

  // Ensure valid locale fallback
  if (!locale) locale = "en";

  // Try modern Intl.Segmenter first
  if (typeof Intl !== "undefined" && Intl.Segmenter) {
    try {
      const segmenter = new Intl.Segmenter(locale, { granularity: "sentence" });
      const sentences = [];

      for (const { segment } of segmenter.segment(text)) {
        const trimmed = segment.trim();
        if (trimmed) {
          sentences.push(trimmed);
        }
      }

      return sentences;
    } catch (_error) {
      // Fall through to regex approach if Intl.Segmenter fails
    }
  }

  // Optimized regex-based fallback with pre-compiled patterns
  const sentences = [];
  const segments = text.split(SENTENCE_BOUNDARY_REGEX);

  let current = "";

  for (let i = 0; i < segments.length; i++) {
    current += segments[i];

    // Check if this segment ends with punctuation and we have more segments
    if (i < segments.length - 1 && PUNCTUATION_END_REGEX.test(segments[i])) {
      const trimmed = current.trim();
      if (trimmed) {
        // Avoid splitting at common abbreviations (fallback only)
        const tail = trimmed.split(/\s+/u).slice(-1)[0] || "";
        if (!ABBREVIATION_ENDINGS.has(tail)) {
          sentences.push(trimmed);
          current = "";
        }
      }
    }
  }

  // Add any remaining text
  const trimmed = current.trim();
  if (trimmed) {
    sentences.push(trimmed);
  }

  return sentences.length > 0 ? sentences : [text.trim()].filter(Boolean);
}
