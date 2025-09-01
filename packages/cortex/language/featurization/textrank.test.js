/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import { deepStrictEqual, ok, strictEqual, throws } from "node:assert";
import { describe, it } from "node:test";
import { TextRankExtractor } from "./textrank.js";

describe("TextRankExtractor", () => {
	describe("constructor and configuration", () => {
		it("creates extractor with default options", () => {
			const textrank = new TextRankExtractor();

			ok(textrank.stopwords instanceof Set);
			strictEqual(textrank.options.language, "en");
			strictEqual(textrank.options.normalize, true);
			strictEqual(textrank.options.lowercase, true);
			strictEqual(textrank.options.windowSize, 4);
			strictEqual(textrank.options.minWordLength, 2);
			strictEqual(textrank.options.maxIterations, 50);
			strictEqual(textrank.options.dampingFactor, 0.85);
			strictEqual(textrank.options.tolerance, 1e-6);
		});

		it("creates extractor with custom options", () => {
			const customStopwords = new Set(["custom", "stop", "words"]);
			const textrank = new TextRankExtractor({
				stopwords: customStopwords,
				language: "de",
				normalize: false,
				lowercase: false,
				windowSize: 6,
				minWordLength: 3,
				maxIterations: 100,
				dampingFactor: 0.9,
				tolerance: 1e-8,
			});

			strictEqual(textrank.stopwords, customStopwords);
			strictEqual(textrank.options.language, "de");
			strictEqual(textrank.options.normalize, false);
			strictEqual(textrank.options.lowercase, false);
			strictEqual(textrank.options.windowSize, 6);
			strictEqual(textrank.options.minWordLength, 3);
			strictEqual(textrank.options.maxIterations, 100);
			strictEqual(textrank.options.dampingFactor, 0.9);
			strictEqual(textrank.options.tolerance, 1e-8);
		});

		it("accepts stopwords as array", () => {
			const stopwordsArray = ["the", "and", "or"];
			const textrank = new TextRankExtractor({ stopwords: stopwordsArray });

			ok(textrank.stopwords instanceof Set);
			ok(textrank.stopwords.has("the"));
			ok(textrank.stopwords.has("and"));
			ok(textrank.stopwords.has("or"));
		});

		it("uses German stopwords for German language", () => {
			const textrank = new TextRankExtractor({ language: "de" });

			ok(textrank.stopwords.has("der"));
			ok(textrank.stopwords.has("die"));
			ok(textrank.stopwords.has("und"));
		});

		it("falls back to English for unsupported language", () => {
			const textrank = new TextRankExtractor({ language: "unsupported" });

			ok(textrank.stopwords.has("the"));
			ok(textrank.stopwords.has("and"));
		});
	});

	describe("text preprocessing", () => {
		it("preprocesses text with normalization", () => {
			const textrank = new TextRankExtractor();
			const result = textrank.preprocessText("Hello WORLD! Café");

			strictEqual(result, "hello world! café");
		});

		it("respects normalization options", () => {
			const normalizedTextrank = new TextRankExtractor({
				normalize: true,
				lowercase: true,
			});
			const rawTextrank = new TextRankExtractor({
				normalize: false,
				lowercase: false,
			});

			const text = "HELLO Café";
			strictEqual(normalizedTextrank.preprocessText(text), "hello café");
			strictEqual(rawTextrank.preprocessText(text), "HELLO Café");
		});

		it("throws on non-string input", () => {
			const textrank = new TextRankExtractor();
			throws(() => textrank.preprocessText(123), /Input must be a string/);
			throws(() => textrank.preprocessText(null), /Input must be a string/);
		});
	});

	describe("word extraction", () => {
		it("extracts and filters words", () => {
			const textrank = new TextRankExtractor();
			const words = textrank.extractWords(
				"Machine learning algorithms are powerful tools for data analysis",
			);

			ok(Array.isArray(words));
			ok(words.includes("machine"));
			ok(words.includes("learning"));
			ok(words.includes("algorithms"));
			ok(words.includes("powerful"));
			ok(words.includes("tools"));
			ok(words.includes("data"));
			ok(words.includes("analysis"));

			// Should not include stopwords
			ok(!words.includes("are"));
			ok(!words.includes("for"));
		});

		it("respects minimum word length", () => {
			const textrank = new TextRankExtractor({ minWordLength: 5 });
			const words = textrank.extractWords("big red car runs fast");

			ok(!words.includes("big")); // Too short
			ok(!words.includes("red")); // Too short
			ok(!words.includes("car")); // Too short
			ok(!words.includes("runs")); // Too short
			ok(!words.includes("fast")); // Too short
		});

		it("handles empty input", () => {
			const textrank = new TextRankExtractor();
			const words = textrank.extractWords("");

			deepStrictEqual(words, []);
		});

		it("handles text with only stopwords", () => {
			const textrank = new TextRankExtractor();
			const words = textrank.extractWords("the and or but if when");

			deepStrictEqual(words, []);
		});
	});

	describe("co-occurrence graph building", () => {
		it("builds graph with correct structure", () => {
			const textrank = new TextRankExtractor({ windowSize: 2 });
			const words = [
				"machine",
				"learning",
				"algorithms",
				"machine",
				"learning",
			];
			const graph = textrank.buildCooccurrenceGraph(words);

			ok(graph.nodes instanceof Set);
			ok(graph.edges instanceof Map);

			// Check nodes
			ok(graph.nodes.has("machine"));
			ok(graph.nodes.has("learning"));
			ok(graph.nodes.has("algorithms"));

			// Check edges exist
			ok(graph.edges.has("machine"));
			ok(graph.edges.has("learning"));
			ok(graph.edges.has("algorithms"));

			// Check specific co-occurrences
			ok(graph.edges.get("machine").has("learning"));
			ok(graph.edges.get("learning").has("machine"));
			ok(graph.edges.get("learning").has("algorithms"));
		});

		it("respects window size", () => {
			const smallWindow = new TextRankExtractor({ windowSize: 1 });
			const largeWindow = new TextRankExtractor({ windowSize: 3 });

			const words = ["word1", "word2", "word3", "word4"];

			const smallGraph = smallWindow.buildCooccurrenceGraph(words);
			const largeGraph = largeWindow.buildCooccurrenceGraph(words);

			// Larger window should have more connections
			const smallEdgeCount = Array.from(smallGraph.edges.values()).reduce(
				(sum, edges) => sum + edges.size,
				0,
			);
			const largeEdgeCount = Array.from(largeGraph.edges.values()).reduce(
				(sum, edges) => sum + edges.size,
				0,
			);

			ok(largeEdgeCount >= smallEdgeCount);
		});

		it("handles single word", () => {
			const textrank = new TextRankExtractor();
			const graph = textrank.buildCooccurrenceGraph(["single"]);

			strictEqual(graph.nodes.size, 1);
			ok(graph.nodes.has("single"));
			strictEqual(graph.edges.get("single").size, 0); // No co-occurrences
		});

		it("handles empty word array", () => {
			const textrank = new TextRankExtractor();
			const graph = textrank.buildCooccurrenceGraph([]);

			strictEqual(graph.nodes.size, 0);
			strictEqual(graph.edges.size, 0);
		});
	});

	describe("TextRank scoring", () => {
		it("calculates scores for simple graph", () => {
			const textrank = new TextRankExtractor();

			// Create simple graph: A <-> B <-> C
			const graph = {
				nodes: new Set(["a", "b", "c"]),
				edges: new Map([
					["a", new Map([["b", 1]])],
					[
						"b",
						new Map([
							["a", 1],
							["c", 1],
						]),
					],
					["c", new Map([["b", 1]])],
				]),
			};

			const scores = textrank.calculateTextRankScores(graph);

			ok(scores instanceof Map);
			strictEqual(scores.size, 3);

			// All nodes should have positive scores
			ok(scores.get("a") > 0);
			ok(scores.get("b") > 0);
			ok(scores.get("c") > 0);

			// Central node 'b' should have higher score
			ok(scores.get("b") > scores.get("a"));
			ok(scores.get("b") > scores.get("c"));
		});

		it("handles graph with isolated nodes", () => {
			const textrank = new TextRankExtractor();

			const graph = {
				nodes: new Set(["isolated", "connected1", "connected2"]),
				edges: new Map([
					["isolated", new Map()],
					["connected1", new Map([["connected2", 1]])],
					["connected2", new Map([["connected1", 1]])],
				]),
			};

			const scores = textrank.calculateTextRankScores(graph);

			// All nodes should have positive scores (due to random walk component)
			ok(scores.get("isolated") > 0);
			ok(scores.get("connected1") > 0);
			ok(scores.get("connected2") > 0);
		});

		it("handles empty graph", () => {
			const textrank = new TextRankExtractor();

			const graph = {
				nodes: new Set(),
				edges: new Map(),
			};

			const scores = textrank.calculateTextRankScores(graph);

			strictEqual(scores.size, 0);
		});

		it("converges within iteration limit", () => {
			const textrank = new TextRankExtractor({ maxIterations: 10 });

			const graph = {
				nodes: new Set(["a", "b"]),
				edges: new Map([
					["a", new Map([["b", 1]])],
					["b", new Map([["a", 1]])],
				]),
			};

			// Should not throw and should produce valid scores
			const scores = textrank.calculateTextRankScores(graph);

			ok(scores.get("a") > 0);
			ok(scores.get("b") > 0);
		});
	});

	describe("phrase extraction", () => {
		it("extracts phrases from adjacent high-scoring words", () => {
			const textrank = new TextRankExtractor();

			const wordScores = new Map([
				["machine", 0.8],
				["learning", 0.9],
				["algorithms", 0.7],
				["powerful", 0.6],
				["data", 0.8],
				["analysis", 0.7],
			]);

			const phraseScores = textrank.extractPhrases(
				"machine learning algorithms are powerful for data analysis",
				wordScores,
			);

			// Debug: console.log("Phrase scores:", Array.from(phraseScores.entries()));

			ok(phraseScores instanceof Map);
			// "are" and "for" are stopwords, so they should split the phrases
			ok(phraseScores.has("machine learning algorithms"));
			ok(phraseScores.has("powerful"));
			ok(phraseScores.has("data analysis"));
		});

		it("handles text with no significant words", () => {
			const textrank = new TextRankExtractor();
			const wordScores = new Map([
				["word1", 0],
				["word2", 0],
			]);

			const phraseScores = textrank.extractPhrases("word1 word2", wordScores);

			strictEqual(phraseScores.size, 0);
		});

		it("calculates phrase scores as average of word scores", () => {
			const textrank = new TextRankExtractor();

			const wordScores = new Map([
				["machine", 0.8],
				["learning", 0.6],
			]);

			const phraseScores = textrank.extractPhrases(
				"machine learning",
				wordScores,
			);

			// Average of 0.8 and 0.6 should be 0.7
			strictEqual(phraseScores.get("machine learning"), 0.7);
		});
	});

	describe("full extraction", () => {
		it("extracts keywords from simple text", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract(
				"Machine learning algorithms are powerful tools for data analysis and pattern recognition",
			);

			ok(Array.isArray(keywords));
			ok(keywords.length > 0);

			// Should extract meaningful phrases
			const keywordText = keywords.join(" ");
			ok(
				keywordText.includes("machine") ||
					keywordText.includes("learning") ||
					keywordText.includes("algorithms"),
			);
		});

		it("returns keywords with scores when requested", () => {
			const textrank = new TextRankExtractor();
			const results = textrank.extract("Machine learning algorithms", {
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
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract(
				"artificial intelligence machine learning deep neural networks computer vision natural language processing",
				{
					maxKeywords: 3,
				},
			);

			ok(keywords.length <= 3);
		});

		it("respects minimum score threshold", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract(
				"test document with various phrases and different importance levels",
				{
					minScore: 0.5,
					includeScores: true,
				},
			);

			for (const result of keywords) {
				ok(result.score >= 0.5);
			}
		});

		it("can extract individual words only", () => {
			const textrank = new TextRankExtractor();
			const words = textrank.extract("machine learning algorithms", {
				extractPhrases: false,
			});

			ok(Array.isArray(words));
			// Should return individual words, not phrases
			for (const word of words) {
				ok(!word.includes(" ")); // No spaces in individual words
			}
		});

		it("returns empty array for empty input", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract("");

			deepStrictEqual(keywords, []);
		});

		it("handles text with only stopwords", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract("the and or but if when where");

			deepStrictEqual(keywords, []);
		});
	});

	describe("extractWordsOnly method", () => {
		it("extracts individual words only", () => {
			const textrank = new TextRankExtractor();
			const words = textrank.extractWordsOnly("machine learning algorithms");

			ok(Array.isArray(words));
			for (const word of words) {
				ok(typeof word === "string");
				ok(!word.includes(" ")); // Should be individual words
			}
		});
	});

	describe("text analysis", () => {
		it("provides detailed analysis statistics", () => {
			const textrank = new TextRankExtractor();
			const analysis = textrank.analyzeText(
				"Machine learning algorithms enable powerful data analysis capabilities",
			);

			ok(typeof analysis === "object");
			ok(typeof analysis.totalWords === "number");
			ok(typeof analysis.uniqueWords === "number");
			ok(typeof analysis.cooccurrenceEdges === "number");
			ok(typeof analysis.avgScore === "number");
			ok(typeof analysis.wordScores === "object");
			ok(typeof analysis.phraseScores === "object");

			ok(analysis.totalWords > 0);
			ok(analysis.uniqueWords > 0);
			ok(analysis.avgScore > 0);
		});

		it("handles empty text in analysis", () => {
			const textrank = new TextRankExtractor();
			const analysis = textrank.analyzeText("");

			strictEqual(analysis.totalWords, 0);
			strictEqual(analysis.uniqueWords, 0);
			strictEqual(analysis.cooccurrenceEdges, 0);
			strictEqual(analysis.avgScore, 0);
		});

		it("calculates statistics correctly", () => {
			const textrank = new TextRankExtractor({ windowSize: 2 });
			const analysis = textrank.analyzeText(
				"machine learning machine learning",
			);

			// Should have 4 total words, 2 unique words
			strictEqual(analysis.totalWords, 4);
			strictEqual(analysis.uniqueWords, 2);

			// Should have co-occurrence edges
			ok(analysis.cooccurrenceEdges > 0);
		});
	});

	describe("graph extraction", () => {
		it("provides graph data for visualization", () => {
			const textrank = new TextRankExtractor();
			const graphData = textrank.getGraph("machine learning algorithms");

			ok(typeof graphData === "object");
			ok(Array.isArray(graphData.nodes));
			ok(Array.isArray(graphData.edges));

			// Check node structure
			for (const node of graphData.nodes) {
				ok(typeof node.word === "string");
				ok(typeof node.score === "number");
			}

			// Check edge structure
			for (const edge of graphData.edges) {
				ok(typeof edge.source === "string");
				ok(typeof edge.target === "string");
				ok(typeof edge.weight === "number");
			}
		});

		it("handles empty text for graph", () => {
			const textrank = new TextRankExtractor();
			const graphData = textrank.getGraph("");

			deepStrictEqual(graphData.nodes, []);
			deepStrictEqual(graphData.edges, []);
		});

		it("avoids duplicate edges in undirected graph", () => {
			const textrank = new TextRankExtractor();
			const graphData = textrank.getGraph("word1 word2 word1 word2");

			// Check that we don't have both (word1, word2) and (word2, word1)
			const edgePairs = graphData.edges.map((edge) =>
				[edge.source, edge.target].sort().join(":"),
			);
			const uniquePairs = new Set(edgePairs);

			strictEqual(edgePairs.length, uniquePairs.size);
		});
	});

	describe("language support", () => {
		it("works with German text", () => {
			const textrank = new TextRankExtractor({ language: "de" });
			const keywords = textrank.extract(
				"Maschinelles Lernen und künstliche Intelligenz sind wichtige Technologien für die Datenanalyse",
			);

			ok(Array.isArray(keywords));
			ok(keywords.length > 0);

			// Should extract German terms
			const keywordText = keywords.join(" ");
			ok(
				keywordText.includes("maschinelles") ||
					keywordText.includes("lernen") ||
					keywordText.includes("intelligenz"),
			);
		});

		it("filters German stopwords correctly", () => {
			const textrank = new TextRankExtractor({ language: "de" });
			const words = textrank.extractWords(
				"Der schnelle braune Fuchs springt über den faulen Hund",
			);

			// Should not include German stopwords
			ok(!words.includes("der"));
			ok(!words.includes("über"));
			ok(!words.includes("den"));

			// Should include content words
			ok(words.includes("schnelle"));
			ok(words.includes("braune"));
			ok(words.includes("fuchs"));
		});
	});

	describe("integration with text processing pipeline", () => {
		it("integrates with normalization functions", () => {
			const textrank = new TextRankExtractor({
				normalize: true,
				lowercase: true,
			});

			const keywords1 = textrank.extract("MACHINE LEARNING");
			const keywords2 = textrank.extract("machine learning");

			// Should produce same results due to normalization
			deepStrictEqual(keywords1, keywords2);
		});

		it("uses tokenization consistently", () => {
			const textrank = new TextRankExtractor();

			// Test with contractions and hyphens that tokenizeWords handles
			const keywords = textrank.extract(
				"state-of-the-art machine learning isn't perfect",
			);

			ok(keywords.length > 0);
			// Should handle hyphenated terms and contractions properly
			const keywordText = keywords.join(" ");
			ok(
				keywordText.includes("state-of-the-art") ||
					keywordText.includes("machine") ||
					keywordText.includes("learning"),
			);
		});
	});

	describe("edge cases and robustness", () => {
		it("handles very long text", () => {
			const textrank = new TextRankExtractor();
			const longText = `${"machine learning ".repeat(100)}algorithms`;

			const keywords = textrank.extract(longText, { maxKeywords: 5 });

			ok(Array.isArray(keywords));
			ok(keywords.length <= 5);
		});

		it("handles text with repetitive patterns", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract(
				"machine machine machine learning learning algorithm",
			);

			ok(Array.isArray(keywords));
			ok(keywords.length > 0);
		});

		it("handles Unicode text", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract(
				"αlgorithms für natürliche Sprache 中文处理",
			);

			ok(Array.isArray(keywords));
			// Should handle mixed scripts without crashing
		});

		it("handles very short text", () => {
			const textrank = new TextRankExtractor();
			const keywords = textrank.extract("machine learning");

			ok(Array.isArray(keywords));
			// Should work with minimal input
		});

		it("handles text with no valid words after filtering", () => {
			const textrank = new TextRankExtractor({ minWordLength: 10 });
			const keywords = textrank.extract("short words only here");

			deepStrictEqual(keywords, []);
		});

		it("maintains score consistency across multiple runs", () => {
			const textrank = new TextRankExtractor({ tolerance: 1e-8 });
			const text = "machine learning algorithms for data analysis";

			const run1 = textrank.extract(text, { includeScores: true });
			const run2 = textrank.extract(text, { includeScores: true });

			// Should produce identical results
			deepStrictEqual(run1, run2);
		});
	});
});
