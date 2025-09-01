/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import * as language from "./index.js";

describe("language module", () => {
	it("re-exports all analysis functions", () => {
		// Verify that all expected functions are available using static access
		assert.ok(
			typeof language.analyzeAITransitionPhrases === "function",
			"Should export analyzeAITransitionPhrases",
		);
		assert.ok(
			typeof language.analyzeNgramRepetition === "function",
			"Should export analyzeNgramRepetition",
		);
		assert.ok(
			typeof language.analyzeWithEnsemble === "function",
			"Should export analyzeWithEnsemble",
		);
		assert.ok(
			typeof language.analyzeZipfDeviation === "function",
			"Should export analyzeZipfDeviation",
		);
		assert.ok(
			typeof language.approximatePerplexity === "function",
			"Should export approximatePerplexity",
		);
		assert.ok(
			typeof language.calculateBurstiness === "function",
			"Should export calculateBurstiness",
		);
		assert.ok(
			typeof language.calculateShannonEntropy === "function",
			"Should export calculateShannonEntropy",
		);
		assert.ok(
			typeof language.detectEmDashEpidemic === "function",
			"Should export detectEmDashEpidemic",
		);
		assert.ok(
			typeof language.detectParticipalPhraseFormula === "function",
			"Should export detectParticipalPhraseFormula",
		);
		assert.ok(
			typeof language.detectPerfectGrammar === "function",
			"Should export detectPerfectGrammar",
		);
		assert.ok(
			typeof language.detectRuleOfThreeObsession === "function",
			"Should export detectRuleOfThreeObsession",
		);
		assert.ok(
			typeof language.isAIText === "function",
			"Should export isAIText",
		);
	});

	it("functions are callable", () => {
		// Test a few key functions to ensure they work through the re-export
		const testText =
			"The comprehensive system delivers optimal performance through advanced algorithms and streamlined processes. Furthermore, it provides comprehensive functionality that ensures reliable outcomes across diverse operational environments and modern infrastructure solutions.";

		// Test ensemble function
		const ensembleResult = language.analyzeWithEnsemble(testText);
		assert.ok(
			typeof ensembleResult === "object",
			"analyzeWithEnsemble should return an object",
		);
		assert.ok(
			typeof ensembleResult.aiLikelihood === "number",
			"Should return AI likelihood",
		);

		// Test burstiness function
		const burstinessResult = language.calculateBurstiness(testText);
		assert.ok(
			typeof burstinessResult === "number",
			"calculateBurstiness should return a number",
		);
		assert.ok(burstinessResult >= 0, "Should return non-negative burstiness");

		// Test entropy function
		const entropyResult = language.calculateShannonEntropy(testText);
		assert.ok(
			typeof entropyResult === "number",
			"calculateShannonEntropy should return a number",
		);
		assert.ok(entropyResult >= 0, "Should return non-negative entropy");

		// Test isAIText function
		const aiResult = language.isAIText(testText);
		assert.ok(typeof aiResult === "object", "isAIText should return an object");
		assert.ok(
			typeof aiResult.aiLikelihood === "number",
			"Should return AI likelihood",
		);
		assert.ok(
			aiResult.aiLikelihood >= 0 && aiResult.aiLikelihood <= 1,
			"AI likelihood should be between 0 and 1",
		);
		assert.ok(
			typeof aiResult.certainty === "number",
			"Should return certainty",
		);
		assert.ok(
			typeof aiResult.combinedScore === "number",
			"Should return combined score",
		);
		assert.ok(
			typeof aiResult.classification === "string",
			"Should return classification",
		);
	});
});
