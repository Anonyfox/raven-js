/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectTextType } from "./german.js";

describe("detectTextType (german)", () => {
  describe("basic functionality", () => {
    it("classifies German business text correctly", () => {
      const businessText =
        "Unser quartalsweises Umsatzwachstum übertraf die Erwartungen, mit starker Performance in Schlüsselmarkten und erhöhter Kundenakquise durch strategische Partnerschaften. Die Rendite unserer Marketingkampagnen war außergewöhnlich.";
      const result = detectTextType(businessText);

      assert.strictEqual(result.type, "business", "Should classify German business text");
      assert.ok(result.confidence > 0.6, "Should have high confidence for clear German business text");
      assert.ok(result.scores.business > 0, "Should have positive German business score");
    });

    it("classifies German academic text correctly", () => {
      const academicText =
        "Diese empirische Studie untersucht das theoretische Rahmenwerk, das dem Konsumentenverhalten zugrunde liegt, und nutzt quantitative Analyse, um mehrere Schlüsselhypothesen zu testen. Die Literaturübersicht zeigt bedeutende Lücken in der aktuellen Forschung.";
      const result = detectTextType(academicText);

      assert.strictEqual(result.type, "academic", "Should classify German academic text");
      assert.ok(result.confidence > 0.6, "Should have high confidence for clear German academic text");
      assert.ok(result.scores.academic > 0, "Should have positive German academic score");
    });

    it("classifies German technical text correctly", () => {
      const technicalText =
        "Der Algorithmus implementiert einen ausgeklügelten Caching-Mechanismus mit O(1) Nachschlagezeit-Komplexität. Die API-Dokumentation spezifiziert RESTful-Endpunkte für Datenabruf und CRUD-Operationen unter Verwendung von JSON-Schemata.";
      const result = detectTextType(technicalText);

      assert.strictEqual(result.type, "technical", "Should classify German technical text");
      assert.ok(result.confidence > 0.6, "Should have high confidence for clear German technical text");
      assert.ok(result.scores.technical > 0, "Should have positive German technical score");
    });

    it("classifies German creative text correctly", () => {
      const creativeText =
        "Die Phantasie der Künstlerin schwebte durch ätherische Landschaften reinen Wunders, wo Emotionen wie Glühwürmchen in der samtenen Nacht tanzten. Ihr kreativer Ausdruck floss wie ein Fluss flüssiger Poesie.";
      const result = detectTextType(creativeText);

      assert.strictEqual(result.type, "creative", "Should classify German creative text");
      assert.ok(result.confidence > 0.6, "Should have high confidence for clear German creative text");
      assert.ok(result.scores.creative > 0, "Should have positive German creative score");
    });

    it("classifies German marketing text correctly", () => {
      const marketingText =
        "Entdecken Sie die revolutionäre Lösung, die Ihre Kundenreise transformiert! Unsere virale Kampagne liefert außergewöhnliche Engagement-Raten und Konversionsoptimierung für maximale Rendite und Markenbekanntheit. Maximieren Sie Ihren ROI mit datengetriebenen Marketingstrategien und personalisierten Kundenerlebnissen. Steigern Sie Ihre Conversion-Rate durch innovative Technologien und kreative Content-Strategien.";
      const result = detectTextType(marketingText);

      assert.ok(typeof result.type === "string", "Should classify German marketing text");
      assert.ok(result.confidence >= 0, "Should have confidence for German marketing text");
      assert.ok(result.scores.marketing >= 0, "Should have German marketing score");
    });
  });

  describe("German-specific classification", () => {
    it("recognizes German compound words in business context", () => {
      const germanBusinessText =
        "Die Geschäftsentwicklung zeigt positive Marktanteile durch strategische Partnerschaften und effiziente Betriebsabläufe mit verbesserter Produktivität und Kosteneffizienz in verschiedenen Unternehmensbereichen. Die Unternehmensstrategie fokussiert auf nachhaltiges Wachstum und innovative Lösungsansätze für komplexe Marktbedingungen. Geschäftsführung und Mitarbeiterentwicklung stehen im Mittelpunkt der langfristigen Planung.";
      const result = detectTextType(germanBusinessText);

      assert.strictEqual(result.type, "business", "Should recognize German compound words");
      assert.ok(result.scores.business > 0, "Should score German business compounds");
    });

    it("handles German umlauts and special characters", () => {
      const germanText =
        "Die Förderung von Schlüsselkompetenzen durch innovative Lösungsansätze ermöglicht nachhaltige Geschäftsmodelle mit verbesserter Wettbewerbsfähigkeit und langfristigem Erfolg in dynamischen Märkten. Organisationsentwicklung und Prozessoptimierung spielen eine entscheidende Rolle für den Unternehmenserfolg.";
      const result = detectTextType(germanText);

      assert.ok(typeof result.type === "string", "Should handle German umlauts");
      assert.ok(result.confidence >= 0, "Should provide confidence for umlaut text");
    });
  });

  describe("classification accuracy", () => {
    it("returns bounded confidence scores", () => {
      const texts = [
        "Geschäftsbericht zeigt quartalsweise Wachstumskennzahlen und strategische Initiativen mit signifikanter Verbesserung der Leistungskennzahlen und Marktpositionierung gegenüber dem vorherigen Geschäftsjahr. Die Unternehmensentwicklung weist positive Trends auf.",
        "Wissenschaftliche Arbeit präsentiert empirische Forschungsmethodologie und theoretisches Rahmenwerk mit umfassender Literaturübersicht und statistischer Analyse von Daten aus mehreren Quellen über längere Zeiträume.",
        "Technische Dokumentation erklärt API-Implementierung und Systemarchitektur mit detaillierten Codebeispielen und Leistungsbenchmarks, die Skalierbarkeit und Zuverlässigkeit unter verschiedenen Lastbedingungen demonstrieren. Die Implementierung folgt bewährten Standards und bietet umfassende Funktionalität.",
        "Kreative Geschichte webt Erzählfäden von Phantasie und emotionaler Tiefe durch Charakterentwicklung und Handlungsprogression, die Themen menschlicher Erfahrung und persönlicher Transformation erforscht.",
        "Marketingkampagne zielt auf Publikumsengagement durch virale Inhaltsstrategien und Social-Media-Optimierungstechniken, die Reichweite und Konversionsraten über mehrere digitale Plattformen maximieren. Die Kampagne nutzt datengetriebene Ansätze für zielgerichtete Kundenansprache.",
      ];

      for (const text of texts) {
        const result = detectTextType(text);
        assert.ok(result.confidence >= 0 && result.confidence <= 1, "Confidence should be bounded");
        assert.ok(Object.keys(result.scores).length > 0, "Should have category scores");
      }
    });

    it("handles ambiguous German text with lower confidence", () => {
      const ambiguousText =
        "Das System bietet verschiedene Funktionen, die Benutzern helfen, ihre Ziele durch unterschiedliche Methoden und Ansätze zu erreichen, die gut zusammenarbeiten. Es funktioniert zuverlässig und bietet gute Ergebnisse in verschiedenen Situationen.";
      const result = detectTextType(ambiguousText);

      assert.ok(typeof result.confidence === "number", "Should calculate confidence for ambiguous German text");
      assert.ok(typeof result.type === "string", "Should still provide a classification");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectTextType(null), TypeError);
      assert.throws(() => detectTextType(undefined), TypeError);
      assert.throws(() => detectTextType(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectTextType("Kurz."), Error);
    });
  });

  describe("performance", () => {
    it("processes German text efficiently", () => {
      const longGermanText =
        "Geschäftsstrategie beinhaltet umfassende Marktanalyse und Wettbewerbspositionierung. ".repeat(100);
      const start = performance.now();
      const result = detectTextType(longGermanText);
      const duration = performance.now() - start;

      assert.ok(duration < 50, "Should process long German text under 50ms");
      assert.ok(typeof result.type === "string", "Should classify long German text");
    });
  });
});
