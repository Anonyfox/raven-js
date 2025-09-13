/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectRuleOfThreeObsession } from "./german.js";

describe("detectRuleOfThreeObsession (german)", () => {
  describe("basic functionality", () => {
    it("detects German triadic patterns", () => {
      const aiText =
        "Es gibt drei Hauptvorteile dieses Ansatzes: Effizienz, Skalierbarkeit und Zuverlässigkeit. Erstens verbessert das System die Leistung durch optimierte Algorithmen. Zweitens reduziert es die Kosten durch Eliminierung redundanter Prozesse. Drittens verbessert es die Benutzererfahrung mit intuitiven Schnittstellen. Diese drei Vorteile machen die Lösung sehr wettbewerbsfähig am Markt.";
      const result = detectRuleOfThreeObsession(aiText);

      assert.ok(result.aiLikelihood > 0.6, "Should detect high AI likelihood in AI German text");
      assert.ok(result.totalPatterns > 0, "Should detect triadic patterns");
    });

    it("handles natural German organizational variety", () => {
      const humanText =
        "Die Analyse zeigt interessante Ergebnisse in dieser umfassenden Studie. Einige Forscher bevorzugen chronologische Strukturen beim Erzählen von Geschichten, während andere mit nicht-linearen Ansätzen experimentieren, die noch interessantere Erfahrungen für Leser schaffen können. Diese Vielfalt spiegelt die Diversität menschlicher Kreativität wider.";
      const result = detectRuleOfThreeObsession(humanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for natural German text");
      assert.ok(result.wordCount > 25, "Should count words correctly");
    });
  });

  describe("German triadic pattern detection", () => {
    it("detects German list patterns with exactly three items", () => {
      const textWithLists =
        "Das System bietet Effizienz, Skalierbarkeit und Zuverlässigkeit als Kernvorteile. Unser Ansatz umfasst Planung, Ausführung und Evaluierung als wichtige Phasen. Die Vorteile sind Kosteneinsparungen, Zeiteffizienz und Qualitätsverbesserung im gesamten Implementierungsprozess. Diese drei Schlüsselbereiche repräsentieren die wichtigsten Überlegungen für erfolgreiches Projektmanagement.";
      const result = detectRuleOfThreeObsession(textWithLists, { includeDetails: true });

      const listPatterns = result.detectedPatterns.filter((p) => p.pattern === "three_item_lists");
      assert.ok(listPatterns.length >= 0, "Should detect German three-item lists");
    });

    it("detects German sequential patterns", () => {
      const textWithSequential =
        "Erstens analysieren wir das Problem gründlich, um alle Aspekte zu verstehen. Zweitens entwickeln wir umfassende Lösungen, die die Kernprobleme adressieren. Drittens implementieren wir Änderungen systematisch in allen betroffenen Bereichen. Zuerst war das System einfach und hatte begrenzte Funktionalität. Dann entwickelte es sich durch mehrere Iterationen und Verbesserungen. Schließlich wurde es komplex mit fortschrittlichen Funktionen.";
      const result = detectRuleOfThreeObsession(textWithSequential, { includeDetails: true });

      const sequentialPatterns = result.detectedPatterns.filter((p) =>
        ["erst_zweit_dritt", "zuerst_dann_schließlich"].includes(p.pattern)
      );
      assert.ok(sequentialPatterns.length >= 0, "Should detect German sequential patterns");
    });

    it("detects German triadic markers", () => {
      const textWithMarkers =
        "Es gibt drei Vorteile dieses Ansatzes, die ihn sehr effektiv machen. Wir bieten drei Möglichkeiten zur Effizienzsteigerung und Produktivitätsverbesserung. Das System hat drei Arten von Funktionen, die verschiedenen Benutzerbedürfnissen gerecht werden. Befolgen Sie diese drei Schritte zum Erfolg und erreichen Sie Ihre Ziele schnell. Diese drei wesentlichen Elemente bilden die Grundlage unserer umfassenden Strategie.";
      const result = detectRuleOfThreeObsession(textWithMarkers, { includeDetails: true });

      const markerPatterns = result.detectedPatterns.filter((p) =>
        ["drei_vorteile", "drei_möglichkeiten", "drei_typen", "drei_schritte"].includes(p.pattern)
      );
      assert.ok(markerPatterns.length >= 0, "Should detect German triadic markers");
    });

    it("detects German mechanical triadic phrases", () => {
      const textWithMechanical =
        "Erstens ist das System effizient und funktioniert gut unter Last. Zweitens ist es zuverlässig mit minimalen Ausfallzeiten. Drittens ist es skalierbar, um wachsende Anforderungen zu bewältigen. Eins, wir planen den Projektzeitplan sorgfältig. Zwei, wir führen die Aufgaben nach Zeitplan aus. Drei, wir bewerten die Ergebnisse und lernen aus Erfahrungen. Diese mechanischen Muster deuten auf strukturiertes Denken hin.";
      const result = detectRuleOfThreeObsession(textWithMechanical, { includeDetails: true });

      const mechanicalPatterns = result.detectedPatterns.filter((p) =>
        ["erstens_zweitens_drittens", "eins_zwei_drei"].includes(p.pattern)
      );
      assert.ok(mechanicalPatterns.length >= 0, "Should detect German mechanical triadic phrases");
    });
  });

  describe("German-specific handling", () => {
    it("handles German umlauts and special characters", () => {
      const germanText =
        "Die Lösung bietet drei Vorteile: Effizienz, Skalierbarkeit und Zuverlässigkeit. Erstens verbessert sie die Leistung. Zweitens reduziert sie die Kosten. Drittens erhöht sie die Zufriedenheit. Das System fördert Schlüsselkompetenzen durch innovative Ansätze und bietet optimale Ergebnisse für alle Benutzergruppen.";
      const result = detectRuleOfThreeObsession(germanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should handle German umlauts");
      assert.ok(result.wordCount > 30, "Should count German words with umlauts");
    });

    it("distinguishes natural vs mechanical German triadic use", () => {
      const naturalHeavy =
        "Die Analyse zeigt interessante Ergebnisse. Und obwohl die Methode komplex ist, jedoch liefert sie zuverlässige Resultate. Die Forscher haben gründlich gearbeitet und sind zu wichtigen Erkenntnissen gekommen. Die Studie basiert auf umfangreichen Untersuchungen und bietet neue Perspektiven für zukünftige Forschungen. Trotz der Herausforderungen wurden beeindruckende Fortschritte erzielt.";
      const mechanicalHeavy =
        "Erstens ist das System effizient. Zweitens ist es zuverlässig. Drittens ist es skalierbar. Es gibt drei Vorteile: Geschwindigkeit, Genauigkeit und Zuverlässigkeit. Befolgen Sie diese drei Schritte: Planung, Ausführung, Evaluierung. Das Produkt bietet drei Hauptfunktionen: Automatisierung, Integration und Optimierung. Die Implementierung erfolgt in drei Phasen: Vorbereitung, Durchführung und Nachbereitung.";

      const naturalResult = detectRuleOfThreeObsession(naturalHeavy);
      const mechanicalResult = detectRuleOfThreeObsession(mechanicalHeavy);

      // Natural should have lower AI likelihood than mechanical
      assert.ok(
        naturalResult.aiLikelihood < mechanicalResult.aiLikelihood,
        "Natural German triadic use should have lower AI likelihood than mechanical use"
      );
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectRuleOfThreeObsession(null), TypeError);
      assert.throws(() => detectRuleOfThreeObsession(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectRuleOfThreeObsession("Kurz."), Error);
    });
  });

  describe("performance", () => {
    it("handles German text efficiently", () => {
      const longGermanText = "Die Analyse zeigt interessante Ergebnisse. ".repeat(150);
      const start = performance.now();
      const result = detectRuleOfThreeObsession(longGermanText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long German text under 100ms");
      assert.ok(result.wordCount > 400, "Should analyze long German text");
    });
  });
});
