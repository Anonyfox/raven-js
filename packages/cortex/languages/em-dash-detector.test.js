/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectEmDashEpidemic } from "./em-dash-detector.js";

describe("detectEmDashEpidemic", () => {
	describe("basic functionality", () => {
		it("detects em-dash overuse correctly", () => {
			const text =
				"Furthermore—it's important to note—we must analyze various approaches; consequently, multiple implementations (using comprehensive methodologies) facilitate substantial improvements... across different systems and platforms.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return AI likelihood",
			);
			assert.ok(
				typeof result.overallScore === "number",
				"Should return overall score",
			);
			assert.ok(
				typeof result.punctuationDensity === "number",
				"Should return punctuation density",
			);
			assert.ok(
				result.totalPunctuation > 0,
				"Should detect overused punctuation",
			);
			assert.ok(result.wordCount > 20, "Should count words correctly");
			assert.ok(
				result.aiLikelihood > 0.3,
				"Should show moderate to high AI likelihood for punctuation-heavy text",
			);
		});

		it("returns low scores for natural punctuation usage", () => {
			const text =
				"The author carefully examines narrative techniques through detailed analysis. Creative writers often experiment with different approaches to storytelling. Each method offers unique advantages for character development and reader engagement.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Should show low AI likelihood for natural punctuation",
			);
			assert.ok(
				result.totalPunctuation <= 1,
				"Should detect few or no overused punctuation",
			);
			assert.ok(result.overallScore < 2, "Should show low overall score");
		});

		it("handles text with no punctuation overuse", () => {
			const text =
				"The cat sat on the mat. Dogs love to play in the park. Children enjoy reading stories about adventure. Simple sentences convey clear meaning without excessive punctuation marks.";
			const result = detectEmDashEpidemic(text);

			assert.equal(
				result.totalPunctuation,
				0,
				"Should detect no overused punctuation",
			);
			assert.equal(
				result.punctuationDensity,
				0,
				"Should have zero punctuation density",
			);
			assert.ok(
				result.aiLikelihood < 0.1,
				"Should show very low AI likelihood",
			);
			assert.equal(result.overallScore, 0, "Should have zero overall score");
		});

		it("calculates word count correctly", () => {
			const text =
				"One two three four five six seven eight nine ten eleven twelve thirteen fourteen fifteen sixteen seventeen eighteen nineteen twenty twenty-one twenty-two twenty-three twenty-four twenty-five words total here.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.wordCount >= 25,
				"Should count all words including hyphenated",
			);
		});
	});

	describe("punctuation detection accuracy", () => {
		it("detects em-dash overuse", () => {
			const text =
				"The analysis shows—quite clearly—that systems must work efficiently across different platforms. Moreover—as we discovered—performance improvements are essential for comprehensive implementations and substantial optimizations.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			const emDash = result.detectedOveruse.find((p) => p.punctuation === "—");
			assert.ok(emDash, "Should detect em-dash overuse");
			assert.equal(emDash.count, 4, "Should count all em-dash occurrences");
			assert.ok(
				emDash.ratio > 2,
				"Should show high ratio compared to baseline",
			);
		});

		it("detects semicolon overuse", () => {
			const text =
				"The system works efficiently; however, improvements are needed; consequently, we must implement changes; therefore, multiple approaches are required for success.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			const semicolon = result.detectedOveruse.find(
				(p) => p.punctuation === ";",
			);
			assert.ok(semicolon, "Should detect semicolon overuse");
			assert.ok(
				semicolon.count >= 3,
				"Should count multiple semicolon occurrences",
			);
		});

		it("detects parenthetical overuse", () => {
			const text =
				"The solution addresses performance issues (using advanced algorithms) and scalability concerns (through comprehensive optimization) while maintaining reliability (across different platforms) effectively.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			const openParen = result.detectedOveruse.find(
				(p) => p.punctuation === "(",
			);
			const closeParen = result.detectedOveruse.find(
				(p) => p.punctuation === ")",
			);

			assert.ok(openParen, "Should detect opening parenthesis overuse");
			assert.ok(closeParen, "Should detect closing parenthesis overuse");
			assert.equal(
				openParen.count,
				closeParen.count,
				"Should have matching parentheses",
			);
		});

		it("detects ellipsis overuse", () => {
			const text =
				"The performance is good across all systems... Moreover, scalability is excellent for large datasets... Furthermore, reliability is maintained through comprehensive testing... across different environments and platforms consistently.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			const ellipsis = result.detectedOveruse.find(
				(p) => p.punctuation === "...",
			);
			assert.ok(ellipsis, "Should detect ellipsis overuse");
			assert.ok(
				ellipsis.count >= 3,
				"Should count multiple ellipsis occurrences",
			);
		});

		it("detects smart quote overuse", () => {
			const text =
				"The concept of \u201cefficiency\u201d requires \u201ccomprehensive analysis\u201d and \u201csubstantial improvements\u201d through \u201cvarious methodologies\u201d and \u201cextensive optimization\u201d across different systems and platforms consistently.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			const openQuote = result.detectedOveruse.find(
				(p) => p.punctuation === "\u201c",
			);
			const closeQuote = result.detectedOveruse.find(
				(p) => p.punctuation === "\u201d",
			);

			assert.ok(openQuote || closeQuote, "Should detect smart quote overuse");
		});

		it("handles mixed punctuation overuse", () => {
			const text =
				"Furthermore—we must analyze complex systems; consequently (using various approaches) the implementation works efficiently... across different platforms; moreover—performance improvements are substantial and comprehensive.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			assert.ok(
				result.detectedOveruse.length >= 3,
				"Should detect multiple types of overused punctuation",
			);
			assert.ok(
				result.aiLikelihood > 0.5,
				"Should show high AI likelihood for mixed overuse",
			);
		});
	});

	describe("parameter variations", () => {
		it("respects minimum word count requirement", () => {
			const shortText = "Furthermore—short text.";

			assert.throws(
				() => detectEmDashEpidemic(shortText, { minWordCount: 10 }),
				Error,
				"Should reject text below minimum word count",
			);
		});

		it("includes detailed punctuation information when requested", () => {
			const text =
				"The analysis shows—quite clearly—that performance improvements are essential; consequently, multiple implementations (using comprehensive methodologies) work effectively... across different platforms and systems.";

			const withDetails = detectEmDashEpidemic(text, {
				includeDetails: true,
			});
			const withoutDetails = detectEmDashEpidemic(text, {
				includeDetails: false,
			});

			assert.ok(
				withDetails.detectedOveruse.length > 0,
				"Should include punctuation details",
			);
			assert.equal(
				withoutDetails.detectedOveruse.length,
				0,
				"Should not include details by default",
			);

			// Check detail structure
			const firstPunctuation = withDetails.detectedOveruse[0];
			assert.ok(
				typeof firstPunctuation.punctuation === "string",
				"Should include punctuation mark",
			);
			assert.ok(
				typeof firstPunctuation.count === "number",
				"Should include count",
			);
			assert.ok(
				typeof firstPunctuation.frequency === "number",
				"Should include frequency",
			);
			assert.ok(
				typeof firstPunctuation.ratio === "number",
				"Should include ratio",
			);
			assert.ok(
				typeof firstPunctuation.overuseLevel === "string",
				"Should include overuse level",
			);
		});

		it("allows custom sensitivity threshold", () => {
			const text =
				"The system works efficiently; however, performance is good and reliable across different environments and platforms with comprehensive testing and substantial optimization.";

			const sensitive = detectEmDashEpidemic(text, {
				sensitivityThreshold: 1.5,
			});
			const normal = detectEmDashEpidemic(text, {
				sensitivityThreshold: 2.0,
			});
			const tolerant = detectEmDashEpidemic(text, {
				sensitivityThreshold: 3.0,
			});

			assert.ok(
				sensitive.totalPunctuation >= normal.totalPunctuation,
				"Lower threshold should detect more overuse",
			);
			assert.ok(
				normal.totalPunctuation >= tolerant.totalPunctuation,
				"Higher threshold should detect less overuse",
			);
		});

		it("allows custom minimum word count", () => {
			const text = "Furthermore—short text works.";

			const result = detectEmDashEpidemic(text, { minWordCount: 3 });
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should work with low minimum",
			);
		});
	});

	describe("mathematical properties", () => {
		it("returns bounded metrics", () => {
			const texts = [
				"Furthermore—it's important to note—we must analyze various comprehensive approaches for modern systems; consequently, multiple implementations (using advanced methodologies) facilitate substantial improvements...",
				"Simple text without excessive punctuation marks should work fine for testing purposes and validation across different environments and platforms consistently.",
				"Moreover—numerous implementations are essential for modern systems; substantial methodologies (comprehensive approaches) and extensive optimizations... help various systems work effectively across different platforms consistently.",
			];

			for (const text of texts) {
				const result = detectEmDashEpidemic(text);

				assert.ok(
					result.aiLikelihood >= 0 && result.aiLikelihood <= 1,
					"AI likelihood should be between 0 and 1",
				);
				assert.ok(
					result.overallScore >= 0,
					"Overall score should be non-negative",
				);
				assert.ok(
					result.punctuationDensity >= 0,
					"Punctuation density should be non-negative",
				);
				assert.ok(
					result.totalPunctuation >= 0,
					"Total punctuation should be non-negative",
				);
				assert.ok(result.wordCount > 0, "Word count should be positive");
			}
		});

		it("calculates frequencies correctly", () => {
			const text =
				"Furthermore—this text contains exactly twenty-five words including various punctuation marks across different systems; consequently, comprehensive analysis (using advanced methodologies) facilitates substantial improvements effectively.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			// Verify frequency calculations
			for (const punctuation of result.detectedOveruse) {
				const expectedFrequency = (punctuation.count / result.wordCount) * 1000;
				assert.ok(
					Math.abs(punctuation.frequency - expectedFrequency) < 0.01,
					"Frequency calculation should be accurate",
				);
			}
		});

		it("sorts punctuation by ratio when details included", () => {
			const text =
				"Furthermore—we must analyze complex systems; consequently (using comprehensive approaches) multiple implementations work efficiently... across different platforms; moreover—performance is substantial and reliable.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			// Check that punctuation is sorted by ratio (descending)
			for (let i = 1; i < result.detectedOveruse.length; i++) {
				assert.ok(
					result.detectedOveruse[i - 1].ratio >=
						result.detectedOveruse[i].ratio,
					"Punctuation should be sorted by ratio descending",
				);
			}
		});

		it("assigns appropriate overuse levels", () => {
			const text =
				"Text with extreme punctuation—overuse—patterns across different systems and platforms; including (multiple) types... of—marks; causing (severe) overuse... patterns—consistently throughout various implementations and environments.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			const hasOveruseLevels = result.detectedOveruse.some(
				(p) =>
					p.overuseLevel === "moderate" ||
					p.overuseLevel === "high" ||
					p.overuseLevel === "severe",
			);
			assert.ok(
				hasOveruseLevels,
				"Should assign appropriate overuse level categories",
			);
		});

		it("handles high punctuation density correctly", () => {
			const text =
				"Furthermore—moreover; consequently: thus (therefore) hence... notably—it's (important) to; note... that—various; numerous (multiple) comprehensive... substantial—patterns occur across different systems and platforms consistently.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.aiLikelihood > 0.7,
				"High punctuation density should result in high AI likelihood",
			);
			assert.ok(
				result.totalPunctuation > 5,
				"Should detect many overused punctuation marks",
			);
		});
	});

	describe("real-world examples", () => {
		it("analyzes AI-generated academic text", () => {
			const aiText = `
				Furthermore—it's important to note—that modern artificial intelligence systems utilize various
				comprehensive approaches; consequently, these implementations leverage substantial computational
				resources (including extensive datasets) and sophisticated methodologies... Therefore, we can
				conclude—based on empirical evidence—that these approaches facilitate considerable advancement.
			`;
			const result = detectEmDashEpidemic(aiText);

			assert.ok(
				result.aiLikelihood > 0.6,
				"AI academic text should show high AI likelihood",
			);
			assert.ok(
				result.totalPunctuation > 3,
				"Should detect multiple overused punctuation marks",
			);
			assert.ok(
				result.punctuationDensity > 15,
				"Should have high punctuation density",
			);
		});

		it("analyzes human-written academic text", () => {
			const humanText = `
				Recent research in machine learning has shown promising results across different applications.
				Scientists have developed novel algorithms that improve accuracy while reducing computational
				costs. These advances open new possibilities for practical deployment in real-world scenarios.
				The findings suggest that continued research in this direction will yield valuable insights.
			`;
			const result = detectEmDashEpidemic(humanText);

			assert.ok(
				result.aiLikelihood < 0.3,
				"Human academic text should show low AI likelihood",
			);
			assert.ok(
				result.totalPunctuation <= 2,
				"Should detect few or no overused punctuation",
			);
		});

		it("analyzes business communication", () => {
			const businessText = `
				Our team has identified several opportunities for improvement in the current process.
				We recommend implementing changes that will enhance efficiency and reduce costs.
				The proposed solution addresses key challenges while maintaining quality standards.
				We believe these modifications will deliver measurable benefits to the organization.
			`;
			const result = detectEmDashEpidemic(businessText);

			assert.ok(
				result.aiLikelihood < 0.4,
				"Business text should show low to moderate AI likelihood",
			);
		});

		it("analyzes AI-generated creative writing", () => {
			const creativeText = `
				The mysterious figure approached—slowly, deliberately—through the shadowy corridor;
				each footstep echoing ominously... The protagonist watched (heart pounding) as the
				stranger drew nearer—closer than before; consequently, tension filled the air...
				Moreover—and this was crucial—the outcome remained uncertain.
			`;
			const result = detectEmDashEpidemic(creativeText);

			assert.ok(
				result.aiLikelihood > 0.7,
				"AI creative writing should show high AI likelihood",
			);
			assert.ok(
				result.totalPunctuation > 5,
				"Should detect many overused punctuation marks",
			);
		});
	});

	describe("multilingual and special content", () => {
		it("handles mixed language content", () => {
			const mixedText =
				"Furthermore—the système funktioniert correctly across different platforms; moreover, различные approaches work well (using comprehensive methodologies) in this multilingual environment for global applications...";
			const result = detectEmDashEpidemic(mixedText);

			assert.ok(
				result.aiLikelihood > 0.4,
				"Should detect punctuation overuse in mixed content",
			);
			assert.ok(
				result.totalPunctuation >= 2,
				"Should find overused punctuation marks",
			);
		});

		it("processes text with special characters", () => {
			const text =
				"Furthermore—the system (v2.0) processes data efficiently across multiple environments; moreover, performance improved by 25%... compared to previous versions and implementations across different platforms.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.totalPunctuation >= 2,
				"Should detect punctuation despite special characters",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});

		it("handles text with URLs and code", () => {
			const text =
				"Furthermore—visit https://example.com for comprehensive documentation and detailed guides; moreover, the function calculateValue() works efficiently (using optimized algorithms) across different systems and platforms...";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.totalPunctuation >= 2,
				"Should detect punctuation in technical text",
			);
		});

		it("processes German text with punctuation patterns", () => {
			const germanText =
				"Außerdem—es ist wichtig zu bemerken—dass moderne Systeme verschiedene Ansätze nutzen für komplexe Probleme; folglich arbeiten multiple Implementierungen (mit umfassenden Methodologien) effektiv und zuverlässig...";
			const result = detectEmDashEpidemic(germanText);

			assert.ok(result.wordCount > 15, "Should process German text");
			assert.ok(
				result.totalPunctuation > 0,
				"Should detect punctuation overuse",
			);
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid metrics",
			);
		});

		it("handles Unicode punctuation correctly", () => {
			const text =
				"The analysis shows → that systems work efficiently ± 5%; moreover… performance is good (≥ 90%) across different environments consistently.";
			const result = detectEmDashEpidemic(text);

			assert.ok(result.wordCount > 15, "Should process Unicode text");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should handle Unicode punctuation",
			);
		});
	});

	describe("edge cases", () => {
		it("handles repeated punctuation correctly", () => {
			const text =
				"Furthermore——the system works efficiently across multiple environments; moreover—— performance is excellent and reliable... ... across different platforms; consequently—— reliability is maintained effectively.";
			const result = detectEmDashEpidemic(text, { includeDetails: true });

			assert.ok(
				result.totalPunctuation > 0,
				"Should handle repeated punctuation",
			);
		});

		it("processes very long text efficiently", () => {
			const baseText =
				"Furthermore—it's important to note—that comprehensive systems utilize various approaches; consequently, implementations (using methodologies) work... effectively. ";
			const longText = baseText.repeat(100);

			const start = performance.now();
			const result = detectEmDashEpidemic(longText);
			const duration = performance.now() - start;

			assert.ok(duration < 100, "Should process long text under 100ms");
			assert.ok(
				result.totalPunctuation > 20,
				"Should detect many punctuation marks in long text",
			);
		});

		it("handles text with only punctuation marks", () => {
			const text =
				"—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)";
			const result = detectEmDashEpidemic(text, { minWordCount: 1 });

			assert.ok(
				result.aiLikelihood > 0.8,
				"Text with only punctuation should have very high likelihood",
			);
		});

		it("processes text with balanced punctuation", () => {
			const text =
				"The author writes clearly. She uses punctuation appropriately and sparingly. Each sentence flows naturally without excessive marks or artificial sophistication patterns.";
			const result = detectEmDashEpidemic(text);

			assert.equal(
				result.totalPunctuation,
				0,
				"Should not detect overuse in balanced text",
			);
		});

		it("handles mathematical expressions", () => {
			const text =
				"The equation shows f(x) = y ± z; moreover, calculations indicate performance ≥ 90% across different scenarios (using comprehensive methodologies) effectively.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.totalPunctuation >= 1,
				"Should detect punctuation in mathematical text",
			);
		});

		it("processes text with formatting markup", () => {
			const text =
				"The analysis shows **important** results for comprehensive evaluation; moreover, _emphasis_ is used (with careful consideration) across different sections and implementations... effectively and consistently.";
			const result = detectEmDashEpidemic(text);

			assert.ok(
				result.totalPunctuation >= 2,
				"Should handle formatting punctuation",
			);
		});
	});

	describe("error handling", () => {
		it("throws TypeError for non-string input", () => {
			assert.throws(
				() => detectEmDashEpidemic(null),
				TypeError,
				"Should reject null",
			);
			assert.throws(
				() => detectEmDashEpidemic(undefined),
				TypeError,
				"Should reject undefined",
			);
			assert.throws(
				() => detectEmDashEpidemic(123),
				TypeError,
				"Should reject numbers",
			);
			assert.throws(
				() => detectEmDashEpidemic([]),
				TypeError,
				"Should reject arrays",
			);
			assert.throws(
				() => detectEmDashEpidemic({}),
				TypeError,
				"Should reject objects",
			);
		});

		it("throws Error for empty text", () => {
			assert.throws(
				() => detectEmDashEpidemic(""),
				Error,
				"Should reject empty string",
			);
			assert.throws(
				() => detectEmDashEpidemic("   "),
				Error,
				"Should reject whitespace-only",
			);
		});

		it("throws Error for insufficient text length", () => {
			const shortText = "Furthermore—short text.";
			assert.throws(
				() => detectEmDashEpidemic(shortText),
				Error,
				"Should reject text below default minimum",
			);
		});

		it("throws Error for invalid options", () => {
			const validText =
				"Furthermore—this text has enough words to meet the minimum requirements for analysis and should work properly with valid options.";

			assert.throws(
				() => detectEmDashEpidemic(validText, { minWordCount: 0 }),
				Error,
				"Should reject zero minimum word count",
			);
			assert.throws(
				() => detectEmDashEpidemic(validText, { minWordCount: -1 }),
				Error,
				"Should reject negative minimum word count",
			);
			assert.throws(
				() => detectEmDashEpidemic(validText, { minWordCount: 1.5 }),
				Error,
				"Should reject fractional minimum word count",
			);
			assert.throws(
				() => detectEmDashEpidemic(validText, { sensitivityThreshold: 0 }),
				Error,
				"Should reject zero sensitivity threshold",
			);
			assert.throws(
				() => detectEmDashEpidemic(validText, { sensitivityThreshold: -1 }),
				Error,
				"Should reject negative sensitivity threshold",
			);
		});
	});

	describe("performance characteristics", () => {
		it("processes medium text efficiently", () => {
			const mediumText =
				"Furthermore—it's important to note—that various comprehensive systems utilize substantial approaches; consequently, implementations work... effectively. ".repeat(
					50,
				);
			const start = performance.now();
			const result = detectEmDashEpidemic(mediumText);
			const duration = performance.now() - start;

			assert.ok(duration < 50, "Should process medium text under 50ms");
			assert.ok(
				typeof result.aiLikelihood === "number",
				"Should return valid result",
			);
		});

		it("scales well with text length", () => {
			const baseText =
				"Furthermore—comprehensive analysis requires various substantial approaches; consequently, methodologies (using implementations) work... effectively. ";
			const shortText = baseText.repeat(10);
			const longText = baseText.repeat(100);

			const shortStart = performance.now();
			detectEmDashEpidemic(shortText);
			const shortDuration = performance.now() - shortStart;

			const longStart = performance.now();
			detectEmDashEpidemic(longText);
			const longDuration = performance.now() - longStart;

			assert.ok(
				longDuration < shortDuration * 20,
				"Should scale reasonably with text length",
			);
		});

		it("handles punctuation-dense text efficiently", () => {
			const denseText =
				"—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)—;(...)".repeat(
					20,
				);

			const start = performance.now();
			const result = detectEmDashEpidemic(denseText, {
				includeDetails: true,
				minWordCount: 1,
			});
			const duration = performance.now() - start;

			assert.ok(
				duration < 100,
				"Should handle punctuation-dense text efficiently",
			);
			assert.ok(
				result.detectedOveruse.length > 0,
				"Should detect many punctuation types",
			);
		});
	});
});
