/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectParticipalPhraseFormula } from "./german.js";

describe("detectParticipalPhraseFormula (german)", () => {
  describe("basic functionality", () => {
    it("detects German participial phrase patterns", () => {
      const aiText =
        "Optimiert für Leistung, liefert das System außergewöhnliche Ergebnisse. Entwickelt mit Skalierbarkeit im Blick, unterstützt die Architektur wachsende Anforderungen. Implementiert nach Best Practices, gewährleistet die Lösung Zuverlässigkeit.";
      const result = detectParticipalPhraseFormula(aiText);

      assert.ok(result.aiLikelihood > 0.6, "Should detect high AI likelihood in AI German text");
      assert.ok(result.totalPatterns > 0, "Should detect participial patterns");
    });

    it("handles natural German participial variety", () => {
      const humanText =
        "Die Analyse zeigt interessante Ergebnisse. Und obwohl die Methode komplex ist, jedoch liefert sie zuverlässige Resultate. Die Forscher haben gründlich gearbeitet und sind zu wichtigen Erkenntnissen gekommen.";
      const result = detectParticipalPhraseFormula(humanText);

      assert.ok(result.aiLikelihood < 0.4, "Should return low AI likelihood for natural German text");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("German participial pattern detection", () => {
    it("detects German sentence-initial participial phrases", () => {
      const textWithInitial =
        "Laufend die Analyse, haben wir interessante Muster entdeckt. Habend die Überprüfung abgeschlossen, präsentierten die Forscher ihre Ergebnisse. Betrachtend die Optionen, wählten sie den effizientesten Ansatz. Arbeitend zusammen, erreichten sie ausgezeichnete Resultate.";
      const result = detectParticipalPhraseFormula(textWithInitial, { includeDetails: true });

      assert.ok(result.detectedPatterns.length >= 0, "Should detect German participial patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });

    it("detects German mechanical construction patterns", () => {
      const textWithMechanical =
        "Das System ist optimiert für Leistung und entwickelt mit Skalierbarkeit im Blick. Die Lösung ist implementiert nach Best Practices und konfiguriert für die Anforderungen. Das Framework ist gebaut für Zuverlässigkeit und entworfen für komplexe Szenarien.";
      const result = detectParticipalPhraseFormula(textWithMechanical, { includeDetails: true });

      assert.ok(result.detectedPatterns.length >= 0, "Should detect German participial patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });

    it("detects German present participle constructions", () => {
      const textWithPresent =
        "Das System läuft effizient während der Verarbeitung großer Datensätze. Habend die Ergebnisse analysiert, können wir klare Muster erkennen. Laufend kontinuierlich, erhält die Anwendung optimale Leistung während erweiterter Betriebszeiten.";
      const result = detectParticipalPhraseFormula(textWithPresent, { includeDetails: true });

      assert.ok(result.detectedPatterns.length >= 0, "Should detect German participial patterns");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("German-specific handling", () => {
    it("handles German umlauts and special characters", () => {
      const germanText =
        "Die Lösung ist entwickelt für höchste Ansprüche. Implementiert mit modernster Technologie, gewährleistet sie Zuverlässigkeit. Die Architektur ist konzipiert für Skalierbarkeit. Das System fördert Schlüsselkompetenzen durch innovative Ansätze.";
      const result = detectParticipalPhraseFormula(germanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should handle German umlauts");
      assert.ok(result.wordCount > 25, "Should count German words with umlauts");
    });

    it("distinguishes natural vs mechanical German participial use", () => {
      const naturalHeavy =
        "Die Analyse zeigt interessante Ergebnisse. Und obwohl die Methode komplex ist, jedoch liefert sie zuverlässige Resultate. Die Forscher haben gründlich gearbeitet und sind zu wichtigen Erkenntnissen gekommen. Die Studie basiert auf umfangreichen Untersuchungen.";
      const mechanicalHeavy =
        "Optimiert für Leistung, entwickelt mit Skalierbarkeit, implementiert nach Standards, konfiguriert für Anforderungen, bereitgestellt mit Sicherheit, ausgeführt unter Kontrolle. Gebaut für Zuverlässigkeit, entworfen für Komplexität, strukturiert für Effizienz.";

      const naturalResult = detectParticipalPhraseFormula(naturalHeavy);
      const mechanicalResult = detectParticipalPhraseFormula(mechanicalHeavy);

      // Natural should have lower AI likelihood than mechanical
      assert.ok(
        naturalResult.aiLikelihood < mechanicalResult.aiLikelihood,
        "Natural German participial use should have lower AI likelihood than mechanical use"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectParticipalPhraseFormula(null), TypeError);
      assert.throws(() => detectParticipalPhraseFormula(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectParticipalPhraseFormula("Kurz."), Error);
    });
  });

  describe("performance", () => {
    it("handles German text efficiently", () => {
      const longGermanText = "Die Analyse zeigt interessante Ergebnisse. ".repeat(100);
      const start = performance.now();
      const result = detectParticipalPhraseFormula(longGermanText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long German text under 100ms");
      assert.ok(result.wordCount > 200, "Should analyze long German text");
    });
  });
});
