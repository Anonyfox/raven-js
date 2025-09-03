import assert from "node:assert";
import { describe, it } from "node:test";
import { ENGLISH_SIGNATURE_PHRASES } from "../signaturephrases/english.js";
import { MINIMAL_SIGNATURE_PHRASES } from "../signaturephrases/minimal.js";
import { detectTextType } from "./detect-text-type.js";

describe("detectTextType", () => {
	it("detects social media with emojis and punctuation", () => {
		const text = "omg cant believe this happened!! 😂🔥";
		const result = detectTextType(text, {
			signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
		});
		assert.equal(result.type, "social_media");
		assert.ok(result.confidence >= 0);
	});

	it("detects technical via co-occurrence", () => {
		const text =
			"The implementation ensures API performance optimization across the system.";
		const result = detectTextType(text, {
			signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
		});
		assert.equal(result.type, "technical");
	});

	it("detects academic via tokens and co-occurrence", () => {
		const text =
			"This study presents an analysis of findings with a clear methodology.";
		const result = detectTextType(text, {
			signaturePhrases: ENGLISH_SIGNATURE_PHRASES,
		});
		assert.equal(result.type, "academic");
	});

	it("falls back to defaultType when minimal matches", () => {
		const text = "Neutral content with little signal.";
		const result = detectTextType(text, {
			signaturePhrases: MINIMAL_SIGNATURE_PHRASES,
		});
		assert.equal(result.type, MINIMAL_SIGNATURE_PHRASES.defaultType);
	});

	it("throws on missing signaturePhrases", () => {
		assert.throws(() => detectTextType("text", {}), /signaturePhrases/);
	});
});
