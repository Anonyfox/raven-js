/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { RakeExtractor } from "./rake.js";

describe("RakeExtractor", () => {
	describe("constructor and configuration", () => {
		it("creates extractor with default options", () => {
			const rake = new RakeExtractor();

			ok(rake.stopwords instanceof Set);
			strictEqual(rake.options.language, "en");
			strictEqual(rake.options.normalize, true);
			strictEqual(rake.options.lowercase, true);
			strictEqual(rake.options.minWordLength, 1);
			strictEqual(rake.options.maxPhraseLength, 5);
		});

		it("creates extractor with custom options", () => {
			const customStopwords = new Set(["custom", "stop", "words"]);
			const rake = new RakeExtractor({
				stopwords: customStopwords,
				language: "de",
				normalize: false,
				lowercase: false,
				minWordLength: 3,
				maxPhraseLength: 3,
			});

			strictEqual(rake.stopwords, customStopwords);
			strictEqual(rake.options.language, "de");
			strictEqual(rake.options.normalize, false);
			strictEqual(rake.options.lowercase, false);
			strictEqual(rake.options.minWordLength, 3);
			strictEqual(rake.options.maxPhraseLength, 3);
		});

		it("accepts stopwords as array", () => {
			const stopwordsArray = ["the", "and", "or"];
			const rake = new RakeExtractor({ stopwords: stopwordsArray });

			ok(rake.stopwords instanceof Set);
			ok(rake.stopwords.has("the"));
			ok(rake.stopwords.has("and"));
			ok(rake.stopwords.has("or"));
		});

		it("uses German stopwords for German language", () => {
			const rake = new RakeExtractor({ language: "de" });

			ok(rake.stopwords.has("der"));
			ok(rake.stopwords.has("die"));
			ok(rake.stopwords.has("und"));
		});
	});

	describe("text preprocessing", () => {
		it("preprocesses text with normalization", () => {
			const rake = new RakeExtractor();
			const result = rake.preprocessText("Hello WORLD! Café");

			strictEqual(result, "hello world! café");
		});

		it("respects normalization options", () => {
			const normalizedRake = new RakeExtractor({
				normalize: true,
				lowercase: true,
			});
			const rawRake = new RakeExtractor({
				normalize: false,
				lowercase: false,
			});

			const text = "HELLO Café";
			strictEqual(normalizedRake.preprocessText(text), "hello café");
			strictEqual(rawRake.preprocessText(text), "HELLO Café");
		});

		it("throws on non-string input", () => {
			const rake = new RakeExtractor();
			throws(() => rake.preprocessText(123), /Input must be a string/);
			throws(() => rake.preprocessText(null), /Input must be a string/);
		});
	});

	describe("candidate phrase extraction", () => {
		it("extracts basic phrases", () => {
			const rake = new RakeExtractor();
			const phrases = rake.extractCandidatePhrases(
				"machine learning algorithms are powerful",
			);

			ok(Array.isArray(phrases));
			ok(phrases.length > 0);
			ok(phrases.includes("machine learning algorithms"));
			ok(phrases.includes("powerful"));
		});

		it("splits on punctuation", () => {
			const rake = new RakeExtractor();
			const phrases = rake.extractCandidatePhrases(
				"Natural language processing. Machine learning algorithms!",
			);

			ok(phrases.includes("natural language processing"));
			ok(phrases.includes("machine learning algorithms"));
		});

		it("removes stopwords from phrases", () => {
			const rake = new RakeExtractor();
			const phrases = rake.extractCandidatePhrases(
				"The quick brown fox jumps over the lazy dog",
			);

			// Should not include standalone articles/prepositions
			ok(!phrases.includes("the"));
			ok(!phrases.includes("over"));
			// Should include content words as phrases
			ok(phrases.includes("quick brown fox jumps"));
			ok(phrases.includes("lazy dog"));
		});

		it("respects minimum word length", () => {
			const rake = new RakeExtractor({ minWordLength: 3 });
			const phrases = rake.extractCandidatePhrases("a big red car is fast");

			// Should not include short words like "a", "is"
			ok(!phrases.some((phrase) => phrase.includes("a ")));
			ok(phrases.includes("big red car"));
			ok(phrases.includes("fast"));
		});

		it("respects maximum phrase length", () => {
			const rake = new RakeExtractor({ maxPhraseLength: 2 });
			const phrases = rake.extractCandidatePhrases(
				"artificial intelligence machine learning deep neural networks",
			);

			// No phrase should have more than 2 words
			for (const phrase of phrases) {
				const wordCount = phrase.split(" ").length;
				ok(
					wordCount <= 2,
					`Phrase "${phrase}" has ${wordCount} words, exceeding limit`,
				);
			}
		});

		it("handles empty input", () => {
			const rake = new RakeExtractor();
			const phrases = rake.extractCandidatePhrases("");

			deepStrictEqual(phrases, []);
		});

		it("handles text with only stopwords", () => {
			const rake = new RakeExtractor();
			const phrases = rake.extractCandidatePhrases("the and or but");

			deepStrictEqual(phrases, []);
		});
	});

	describe("co-occurrence graph building", () => {
		it("builds word frequency and co-occurrence data", () => {
			const rake = new RakeExtractor();
			const phrases = [
				"machine learning",
				"learning algorithms",
				"neural networks",
			];
			const graph = rake.buildCooccurrenceGraph(phrases);

			ok(graph.wordFrequency instanceof Map);
			ok(graph.wordCooccurrence instanceof Map);
			ok(graph.wordDegree instanceof Map);

			// Check word frequencies
			strictEqual(graph.wordFrequency.get("learning"), 2);
			strictEqual(graph.wordFrequency.get("machine"), 1);
			strictEqual(graph.wordFrequency.get("algorithms"), 1);

			// Check co-occurrence
			ok(graph.wordCooccurrence.has("machine"));
			ok(graph.wordCooccurrence.get("machine").has("learning"));

			// Check degrees
			ok(graph.wordDegree.has("learning"));
			ok(graph.wordDegree.get("learning") > 0);
		});

		it("handles single word phrases", () => {
			const rake = new RakeExtractor();
			const phrases = ["machine", "learning", "algorithms"];
			const graph = rake.buildCooccurrenceGraph(phrases);

			// Single words should have frequency but no co-occurrence
			strictEqual(graph.wordFrequency.get("machine"), 1);
			strictEqual(graph.wordDegree.get("machine"), 0); // No co-occurrences
		});

		it("handles empty phrases array", () => {
			const rake = new RakeExtractor();
			const graph = rake.buildCooccurrenceGraph([]);

			strictEqual(graph.wordFrequency.size, 0);
			strictEqual(graph.wordCooccurrence.size, 0);
			strictEqual(graph.wordDegree.size, 0);
		});
	});

	describe("word scoring", () => {
		it("calculates RAKE scores correctly", () => {
			const rake = new RakeExtractor();

			// Create mock graph data
			const graph = {
				wordFrequency: new Map([
					["machine", 1],
					["learning", 2],
					["algorithms", 1],
				]),
				wordDegree: new Map([
					["machine", 1],
					["learning", 3], // appears with multiple words
					["algorithms", 1],
				]),
			};

			const scores = rake.calculateWordScores(graph);

			// RAKE score = degree / frequency
			strictEqual(scores.get("machine"), 1); // 1/1
			strictEqual(scores.get("learning"), 1.5); // 3/2
			strictEqual(scores.get("algorithms"), 1); // 1/1
		});

		it("handles words with no co-occurrences", () => {
			const rake = new RakeExtractor();

			const graph = {
				wordFrequency: new Map([["isolated", 1]]),
				wordDegree: new Map(), // No degree entry
			};

			const scores = rake.calculateWordScores(graph);

			// Should use frequency as degree when degree is missing
			strictEqual(scores.get("isolated"), 1); // frequency/frequency = 1
		});
	});

	describe("phrase scoring", () => {
		it("scores phrases by summing word scores", () => {
			const rake = new RakeExtractor();
			const phrases = ["machine learning", "deep learning"];
			const wordScores = new Map([
				["machine", 2.0],
				["learning", 1.5],
				["deep", 3.0],
			]);

			const phraseScores = rake.scorePhrases(phrases, wordScores);

			strictEqual(phraseScores.get("machine learning"), 3.5); // 2.0 + 1.5
			strictEqual(phraseScores.get("deep learning"), 4.5); // 3.0 + 1.5
		});

		it("handles phrases with unknown words", () => {
			const rake = new RakeExtractor();
			const phrases = ["unknown phrase"];
			const wordScores = new Map([["known", 1.0]]);

			const phraseScores = rake.scorePhrases(phrases, wordScores);

			strictEqual(phraseScores.get("unknown phrase"), 0); // Unknown words score 0
		});
	});

	describe("full extraction", () => {
		it("extracts keywords from simple text", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract(
				"Machine learning algorithms are powerful tools for data analysis",
			);

			ok(Array.isArray(keywords));
			ok(keywords.length > 0);

			// Should extract meaningful phrases
			ok(keywords.some((keyword) => keyword.includes("machine learning")));
			ok(keywords.some((keyword) => keyword.includes("data analysis")));
		});

		it("returns keywords with scores when requested", () => {
			const rake = new RakeExtractor();
			const results = rake.extract("Machine learning algorithms", {
				includeScores: true,
				maxKeywords: 5,
			});

			ok(Array.isArray(results));
			for (const result of results) {
				ok(typeof result === "object");
				ok(typeof result.phrase === "string");
				ok(typeof result.score === "number");
				ok(result.score >= 0);
			}
		});

		it("respects maximum keywords limit", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract(
				"artificial intelligence machine learning deep neural networks",
				{
					maxKeywords: 2,
				},
			);

			ok(keywords.length <= 2);
		});

		it("respects minimum score threshold", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract("test document with various phrases", {
				minScore: 2.0,
				includeScores: true,
			});

			for (const result of keywords) {
				ok(result.score >= 2.0);
			}
		});

		it("returns empty array for empty input", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract("");

			deepStrictEqual(keywords, []);
		});

		it("handles text with only stopwords", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract("the and or but if when");

			deepStrictEqual(keywords, []);
		});
	});

	describe("text analysis", () => {
		it("provides detailed analysis statistics", () => {
			const rake = new RakeExtractor();
			const analysis = rake.analyzeText(
				"Machine learning algorithms are powerful tools",
			);

			ok(typeof analysis === "object");
			ok(Array.isArray(analysis.candidatePhrases));
			ok(typeof analysis.totalWords === "number");
			ok(typeof analysis.totalPhrases === "number");
			ok(typeof analysis.avgWordsPerPhrase === "number");
			ok(typeof analysis.wordFrequencies === "object");
			ok(typeof analysis.wordScores === "object");
			ok(typeof analysis.phraseScores === "object");
		});

		it("calculates average words per phrase correctly", () => {
			const rake = new RakeExtractor();
			const analysis = rake.analyzeText(
				"single word. two words. three word phrase.",
			);

			// Phrases: ['single word', 'two words', 'three word phrase']
			// Word counts: [2, 2, 3] -> Average = 7/3 = 2.33...
			strictEqual(analysis.candidatePhrases.length, 3);
			strictEqual(Math.round(analysis.avgWordsPerPhrase * 10) / 10, 2.3);
		});

		it("handles empty text in analysis", () => {
			const rake = new RakeExtractor();
			const analysis = rake.analyzeText("");

			strictEqual(analysis.totalWords, 0);
			strictEqual(analysis.totalPhrases, 0);
			strictEqual(analysis.avgWordsPerPhrase, 0);
		});
	});

	describe("language support", () => {
		it("works with German text", () => {
			const rake = new RakeExtractor({ language: "de" });
			const keywords = rake.extract(
				"Maschinelles Lernen und künstliche Intelligenz sind wichtige Technologien",
			);

			ok(Array.isArray(keywords));
			ok(keywords.length > 0);

			// Should extract German phrases
			ok(keywords.some((keyword) => keyword.includes("maschinelles lernen")));
			ok(
				keywords.some((keyword) => keyword.includes("künstliche intelligenz")),
			);
		});

		it("filters German stopwords correctly", () => {
			const rake = new RakeExtractor({ language: "de" });
			const phrases = rake.extractCandidatePhrases(
				"Der schnelle braune Fuchs springt über den faulen Hund",
			);

			// Should not include German articles/prepositions
			ok(!phrases.some((phrase) => phrase.includes("der")));
			ok(!phrases.some((phrase) => phrase.includes("über")));
			ok(!phrases.some((phrase) => phrase.includes("den")));
		});
	});

	describe("integration with text processing pipeline", () => {
		it("integrates with normalization functions", () => {
			const rake = new RakeExtractor({
				normalize: true,
				lowercase: true,
			});

			const keywords1 = rake.extract("MACHINE LEARNING");
			const keywords2 = rake.extract("machine learning");

			// Should produce same results due to normalization
			deepStrictEqual(keywords1, keywords2);
		});

		it("uses tokenization consistently", () => {
			const rake = new RakeExtractor();

			// Test with contractions and hyphens that tokenizeWords handles
			const keywords = rake.extract(
				"state-of-the-art machine learning isn't perfect",
			);

			ok(keywords.length > 0);
			// Apostrophe splits contraction, hyphenated phrase should be preserved as one segment
			ok(
				keywords.some((keyword) =>
					keyword.includes("state-of-the-art machine learning"),
				),
			);
		});
	});

	describe("edge cases and robustness", () => {
		it("handles very long text", () => {
			const rake = new RakeExtractor();
			const longText = `${"machine learning ".repeat(100)}algorithms`;

			const keywords = rake.extract(longText, { maxKeywords: 5 });

			ok(Array.isArray(keywords));
			ok(keywords.length <= 5);
		});

		it("handles text with excessive punctuation", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract(
				"Machine!!! Learning??? Algorithms... Are. Powerful!!!",
			);

			ok(keywords.length > 0);
			// Punctuation splits into individual terms, should extract meaningful ones
			const hasKeyword = keywords.some(
				(keyword) =>
					keyword === "machine" ||
					keyword === "learning" ||
					keyword === "algorithms" ||
					keyword === "powerful",
			);
			ok(hasKeyword);
		});

		it("handles Unicode text", () => {
			const rake = new RakeExtractor();
			const keywords = rake.extract(
				"αlgorithms für natürliche Sprache 中文处理",
			);

			ok(Array.isArray(keywords));
			// Should handle mixed scripts without crashing
		});

		it("handles very short phrases", () => {
			const rake = new RakeExtractor({ minWordLength: 1 });
			const keywords = rake.extract("a b c d e");

			// Single letters should be filtered out as non-meaningful
			ok(keywords.length === 0 || keywords.every((k) => k.length > 1));
		});
	});
});
