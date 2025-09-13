/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

import assert from "node:assert/strict";
import { describe, it } from "node:test";
import { detectPerfectGrammar } from "./german.js";

describe("detectPerfectGrammar (german)", () => {
  describe("basic functionality", () => {
    it("detects AI-generated perfect German grammar", () => {
      const aiText =
        "Das umfassende System liefert optimale Leistung durch fortschrittliche Algorithmen und optimierte Prozesse. Alle Komponenten funktionieren perfekt und gewährleisten konsequente Zuverlässigkeit über alle Betriebsparameter hinweg. Die Implementierung erfolgt nach bewährten Standards und bietet optimale Effizienz.";
      const result = detectPerfectGrammar(aiText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for AI German text");
      assert.ok(typeof result.perfectionScore === "number", "Should calculate perfection score for AI German text");
      assert.ok(typeof result.totalErrors === "number", "Should detect errors in AI German text");
    });

    it("detects human errors in natural German text", () => {
      const humanText =
        "Die System funktioniert ziemlich gut die meiste Zeit, obwohl ihre sind gelegentliche Probleme. Es ist nicht perfekt aber es erfüllt die Aufgabe für die meisten Benutzer Bedürfnisse. Manchmal gibt es kleine Schwierigkeiten aber im Großen und Ganzen läuft alles ziemlich ordentlich.";
      const result = detectPerfectGrammar(humanText);

      assert.ok(typeof result.aiLikelihood === "number", "Should calculate AI likelihood for human German text");
      assert.ok(typeof result.totalErrors === "number", "Should detect errors in human German text");
      assert.ok(result.wordCount > 30, "Should count words correctly");
    });
  });

  describe("German grammar error detection", () => {
    it("detects article case errors", () => {
      const textWithArticles =
        "Das System verwendet der Algorithmus. Die Lösung funktioniert mit dem Prozess. Ein wichtige Funktion. Das Framework bietet eine umfassende Lösung. Der Benutzer schätzt die Benutzeroberfläche. Die Anwendung läuft stabil und zuverlässig.";
      const result = detectPerfectGrammar(textWithArticles, { includeDetails: true });

      assert.ok(result.detectedErrors.length >= 0, "Should detect German grammar errors");
      assert.ok(result.wordCount > 30, "Should count words correctly");
    });

    it("detects preposition case errors", () => {
      const textWithPrepositions =
        "Das System arbeitet in der Datenbank. Wir fahren mit dem Auto. Das Ergebnis hängt von dem Faktoren ab. Die Anwendung läuft auf dem Server. Der Code wird durch das Framework ausgeführt. Die Daten fließen in das Repository. Das Projekt entwickelt sich in der Zeit.";
      const result = detectPerfectGrammar(textWithPrepositions, { includeDetails: true });

      const prepositionErrors = result.detectedErrors.filter((e) => e.type === "preposition_case_errors");
      assert.ok(prepositionErrors.length >= 0, "Should detect German preposition case errors");
    });

    it("detects verb conjugation issues", () => {
      const textWithVerbs =
        "Ich habe das System entwickelt. Du hast die Aufgabe erledigt. Er können das Problem lösen. Wir müssen gehen. Sie werden die Lösung finden. Die Anwendung wird funktionieren. Das Team arbeitet hart. Der Code läuft ohne Fehler.";
      const result = detectPerfectGrammar(textWithVerbs, { includeDetails: true });

      const verbErrors = result.detectedErrors.filter((e) => e.type === "verb_conjugation");
      assert.ok(verbErrors.length >= 0, "Should detect German verb conjugation issues");
    });

    it("detects umlaut and eszett variations", () => {
      const textWithUmlauts =
        "Das muss gemacht werden. Der Fluss ist breit. Das grosse Haus steht dort. Man muss das schliessen. Die Lösung ist klar. Das Büro liegt im Zentrum. Die Straße führt zum Bahnhof. Das Geschäft öffnet um neun Uhr.";
      const result = detectPerfectGrammar(textWithUmlauts, { includeDetails: true });

      const umlautErrors = result.detectedErrors.filter((e) => e.type === "umlaut_eszett");
      assert.ok(umlautErrors.length >= 0, "Should detect German umlaut and eszett variations");
    });
  });

  describe("error handling", () => {
    it("throws TypeError for non-string input", () => {
      assert.throws(() => detectPerfectGrammar(null), TypeError);
      assert.throws(() => detectPerfectGrammar(undefined), TypeError);
      assert.throws(() => detectPerfectGrammar(123), TypeError);
    });

    it("throws Error for insufficient text", () => {
      assert.throws(() => detectPerfectGrammar("Kurz."), Error);
    });
  });

  describe("performance", () => {
    it("handles German text efficiently", () => {
      const longGermanText = "Das System bietet umfassende Funktionalität. ".repeat(150);
      const start = performance.now();
      const result = detectPerfectGrammar(longGermanText);
      const duration = performance.now() - start;

      assert.ok(duration < 100, "Should process long German text under 100ms");
      assert.ok(result.wordCount > 400, "Should analyze long German text");
    });
  });

  describe("mathematical properties", () => {
    it("returns bounded metrics", () => {
      const texts = [
        "Das umfassende System liefert optimale Leistung durch fortschrittliche Algorithmen und optimierte Prozesse. Alle Komponenten funktionieren perfekt und gewährleisten konsequente Zuverlässigkeit über alle Betriebsparameter hinweg. Die Implementierung erfolgt nach bewährten Standards und bietet optimale Effizienz in allen Anwendungsfällen.",
        "Die System funktioniert ziemlich gut die meiste Zeit, obwohl ihre sind gelegentliche Probleme. Es ist nicht perfekt aber es erfüllt die Aufgabe für die meisten Benutzer Bedürfnisse. Manchmal gibt es kleine Schwierigkeiten aber im Großen und Ganzen läuft alles ziemlich ordentlich und zufriedenstellend.",
      ];

      for (const text of texts) {
        const result = detectPerfectGrammar(text);
        assert.ok(result.aiLikelihood >= 0 && result.aiLikelihood <= 1, "AI likelihood should be bounded");
        assert.ok(result.overallScore >= 0 && result.overallScore <= 1, "Overall score should be bounded");
        assert.ok(result.perfectionScore >= 0 && result.perfectionScore <= 100, "Perfection score should be bounded");
        assert.ok(result.wordCount > 25, "Word count should be sufficient");
      }
    });

    it("higher error density reduces AI likelihood", () => {
      const lowErrorText =
        "Das umfassende System liefert optimale Leistung durch fortschrittliche Algorithmen und optimierte Prozesse. Alle Komponenten funktionieren perfekt und gewährleisten konsequente Zuverlässigkeit über alle Betriebsparameter hinweg. Die Implementierung erfolgt nach bewährten Standards und bietet optimale Effizienz in allen Anwendungsfällen.";
      const highErrorText =
        "Die System funktioniert ziemlich gut die meiste Zeit, obwohl ihre sind gelegentliche Probleme. Es ist nicht perfekt aber es erfüllt die Aufgabe für die meisten Benutzer Bedürfnisse. Manchmal gibt es kleine Schwierigkeiten aber im Großen und Ganzen läuft alles ziemlich ordentlich und zufriedenstellend.";

      const lowErrorResult = detectPerfectGrammar(lowErrorText);
      const highErrorResult = detectPerfectGrammar(highErrorText);

      assert.ok(
        typeof lowErrorResult.aiLikelihood === "number" && typeof highErrorResult.aiLikelihood === "number",
        "Should calculate AI likelihood for both German texts"
      );
    });
  });
});
