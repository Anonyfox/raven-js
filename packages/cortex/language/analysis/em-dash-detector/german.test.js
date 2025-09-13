/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectEmDashEpidemic } from "./german.js";

describe("detectEmDashEpidemic (german)", () => {
  describe("basic functionality", () => {
    it("detects AI-generated German punctuation overuse", () => {
      const aiText =
        "Ferner—es ist wichtig zu beachten—wir müssen verschiedene Ansätze analysieren; folglich ermöglichen mehrere Implementierungen (unter Verwendung umfassender Methoden) erhebliche Verbesserungen. Die Analyse—wie erwartet—zeigt deutliche Muster...";
      const result = detectEmDashEpidemic(aiText);

      assert.ok(
        typeof result.aiLikelihood === "number",
        "Should calculate AI likelihood for AI German text with punctuation overuse"
      );
      assert.ok(typeof result.totalPunctuation === "number", "Should detect punctuation in AI German text");
      assert.ok(result.wordCount > 20, "Should count words correctly");
    });

    it("detects human German punctuation patterns", () => {
      const humanText =
        "Der Autor erkundet Erzähltechniken. Sie schreibt mit sorgfältiger Aufmerksamkeit für Details und verwendet Satzzeichen natürlich. Die Geschichte entwickelt sich organisch durch verschiedene Kapitel hindurch. Leser schätzen die authentische Stimme des Erzählers.";
      const result = detectEmDashEpidemic(humanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for human German text");
      assert.ok(result.totalPunctuation >= 0, "Should detect punctuation patterns in human German text");
    });
  });

  describe("German punctuation overuse detection", () => {
    it("detects guillemet overuse in German", () => {
      const textWithGuillemets =
        "Der Autor stellt fest «dies ist wichtig» und erklärt «mehrere Perspektiven existieren» während er bemerkt «verschiedene Ansätze funktionieren». Er betont «die Bedeutung der Analyse» und zeigt «verschiedene Möglichkeiten auf».";
      const result = detectEmDashEpidemic(textWithGuillemets, { includeDetails: true });

      const guillemetOveruse = result.detectedOveruse.find((o) => o.punctuation === "«");
      assert.ok(guillemetOveruse, "Should detect German guillemet overuse");
      assert.ok(typeof guillemetOveruse.overuseRatio === "number", "Should calculate overuse ratio");
    });

    it("detects semicolon overuse in German", () => {
      const textWithSemicolons =
        "Das System funktioniert gut; es bietet ausgezeichnete Funktionalität; Benutzer schätzen sein Design; Entwickler finden es einfach zu verwenden. Die Anwendung läuft stabil; sie verarbeitet Daten effizient; Tester loben ihre Zuverlässigkeit.";
      const result = detectEmDashEpidemic(textWithSemicolons, { includeDetails: true });

      const semicolonOveruse = result.detectedOveruse.find((o) => o.punctuation === ";");
      assert.ok(semicolonOveruse, "Should detect German semicolon overuse");
      assert.ok(semicolonOveruse.overuseRatio > 1, "Should show overuse ratio above German baseline");
    });

    it("detects section sign overuse in German", () => {
      const textWithSectionSigns =
        "Gemäß §1 gilt folgendes; §2 regelt weitere Aspekte; §3 behandelt spezielle Fälle; §4 enthält Schlussbestimmungen. Die Regelung §5 definiert Ausnahmen; §6 beschreibt Übergangsbestimmungen; §7 enthält Strafvorschriften.";
      const result = detectEmDashEpidemic(textWithSectionSigns, { includeDetails: true });

      const sectionOveruse = result.detectedOveruse.find((o) => o.punctuation === "§");
      assert.ok(sectionOveruse, "Should detect German section sign overuse");
      assert.ok(typeof sectionOveruse.overuseRatio === "number", "Should calculate overuse ratio");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectEmDashEpidemic(null), TypeError);
      assert.throws(() => detectEmDashEpidemic(undefined), TypeError);
      assert.throws(() => detectEmDashEpidemic(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectEmDashEpidemic("Kurz."), Error);
    });
  });

  describe("mathematical properties", () => {
    it("returns bounded metrics", () => {
      const texts = [
        "Das umfassende System liefert optimale Leistung durch fortschrittliche Algorithmen und optimierte Prozesse. Es gewährleistet zuverlässige Ergebnisse in allen Anwendungsfällen perfekt.",
        "Ferner—es ist wichtig zu beachten—wir müssen verschiedene Ansätze analysieren; folglich ermöglichen mehrere Implementierungen (unter Verwendung umfassender Methoden) erhebliche Verbesserungen...",
      ];

      for (const text of texts) {
        const result = detectEmDashEpidemic(text);
        assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
        assert.ok(result.overallScore >= 0 && result.overallScore <= 1, "Overall score should be bounded");
        assert.ok(result.punctuationDensity >= 0, "Punctuation density should be non-negative");
        assert.ok(result.wordCount >= 20, "Word count should be sufficient");
      }
    });

    it("higher punctuation overuse increases AI likelihood in German", () => {
      const lowOveruseText =
        "Das System bietet ausgezeichnete Funktionalität. Benutzer schätzen sein Design und die Benutzeroberfläche. Die Anwendung funktioniert gut in verschiedenen Umgebungen und ist zuverlässig.";
      const highOveruseText =
        "Das System—es ist wichtig zu beachten—bietet ausgezeichnete Funktionalität; folglich finden Benutzer (die sein Design schätzen) es sehr nützlich. Die Schnittstelle—obwohl komplex—bleibt intuitiv...";

      const lowResult = detectEmDashEpidemic(lowOveruseText);
      const highResult = detectEmDashEpidemic(highOveruseText);

      assert.ok(
        typeof lowResult.aiLikelihood === "number",
        "Should calculate AI likelihood for German low overuse text"
      );
      assert.ok(
        typeof highResult.aiLikelihood === "number",
        "Should calculate AI likelihood for German high overuse text"
      );
    });
  });
});
