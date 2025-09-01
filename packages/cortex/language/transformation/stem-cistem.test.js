/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file Tests for CISTEM German stemmer functionality.
 */

import { strictEqual } from "node:assert";
import { describe, it } from "node:test";
import { stemCistem } from "./stem-cistem.js";

describe("stemCistem", () => {
	it("handles basic German verbs", () => {
		strictEqual(stemCistem("laufen"), "lauf");
		strictEqual(stemCistem("gehen"), "geh");
		strictEqual(stemCistem("kommen"), "komm");
		strictEqual(stemCistem("sprechen"), "sprech");
	});

	it("handles German nouns with common endings", () => {
		strictEqual(stemCistem("Hunde"), "hund");
		strictEqual(stemCistem("Katzen"), "kat"); // More aggressive stemming
		strictEqual(stemCistem("Häuser"), "haeus");
		strictEqual(stemCistem("Bäume"), "baeum");
	});

	it("handles German umlauts correctly", () => {
		strictEqual(stemCistem("schön"), "scho"); // Normalized then stemmed
		strictEqual(stemCistem("größer"), "groess");
		strictEqual(stemCistem("müssen"), "muess");
		strictEqual(stemCistem("wäre"), "waer");
	});

	it("handles German ß (eszett)", () => {
		strictEqual(stemCistem("weiß"), "weis"); // Final s removed
		strictEqual(stemCistem("Straße"), "strass");
		strictEqual(stemCistem("größte"), "groesst");
	});

	it("handles derivational suffixes", () => {
		strictEqual(stemCistem("Möglichkeit"), "moeglich"); // Normalized umlaut preserved
		strictEqual(stemCistem("Freundlichkeit"), "freundlich"); // -keit removed, -lich preserved
		strictEqual(stemCistem("Regierung"), "regier");
		strictEqual(stemCistem("Entwicklung"), "entwickl");
	});

	it("handles -lich suffix", () => {
		strictEqual(stemCistem("freundlich"), "freund");
		strictEqual(stemCistem("natürlich"), "natuer"); // -lich removed
		strictEqual(stemCistem("möglich"), "moeg"); // -lich removed
	});

	it("handles -isch suffix", () => {
		strictEqual(stemCistem("technisch"), "techn");
		strictEqual(stemCistem("logisch"), "log");
		strictEqual(stemCistem("praktisch"), "prakt");
	});

	it("handles -ig suffix", () => {
		strictEqual(stemCistem("wichtig"), "wicht");
		strictEqual(stemCistem("richtig"), "richt");
		strictEqual(stemCistem("lustig"), "lust");
	});

	it("handles plural forms", () => {
		strictEqual(stemCistem("Kinder"), "kind");
		strictEqual(stemCistem("Menschen"), "mensch");
		strictEqual(stemCistem("Frauen"), "frau");
		strictEqual(stemCistem("Männer"), "maenn");
	});

	it("handles verb conjugations", () => {
		strictEqual(stemCistem("spielen"), "spiel");
		strictEqual(stemCistem("spielte"), "spielt");
		strictEqual(stemCistem("gespielt"), "gespiel"); // -t removed
		strictEqual(stemCistem("spielst"), "spiels");
	});

	it("handles compound words", () => {
		// Note: CISTEM focuses on suffix removal rather than compound splitting
		strictEqual(stemCistem("Computertechnik"), "computertechnik");
		strictEqual(stemCistem("Regierungsgebäude"), "regierungsgebaeud");
		strictEqual(stemCistem("Weihnachtsbaum"), "weihnachtsbaum");
	});

	it("handles adjective forms", () => {
		strictEqual(stemCistem("gute"), "gut");
		strictEqual(stemCistem("schöne"), "schoen");
		strictEqual(stemCistem("große"), "gross");
		strictEqual(stemCistem("kleine"), "klein");
	});

	it("handles comparative and superlative", () => {
		strictEqual(stemCistem("größer"), "groess");
		strictEqual(stemCistem("kleiner"), "klein");
		strictEqual(stemCistem("beste"), "best");
		strictEqual(stemCistem("schönste"), "schoenst");
	});

	it("preserves short words", () => {
		strictEqual(stemCistem("ich"), "ich");
		strictEqual(stemCistem("er"), "er");
		strictEqual(stemCistem("wir"), "wir");
		strictEqual(stemCistem("zu"), "zu");
	});

	it("handles empty and invalid inputs", () => {
		strictEqual(stemCistem(""), "");
		strictEqual(stemCistem("a"), "a");
		strictEqual(stemCistem("ab"), "ab");
	});

	it("handles mixed case input", () => {
		strictEqual(stemCistem("LAUFEN"), "lauf");
		strictEqual(stemCistem("Sprechen"), "sprech");
		strictEqual(stemCistem("HÄUSER"), "haeus"); // Consistent with normalization
	});

	it("handles German articles", () => {
		strictEqual(stemCistem("der"), "der");
		strictEqual(stemCistem("die"), "die"); // Too short to stem
		strictEqual(stemCistem("das"), "das");
		strictEqual(stemCistem("eine"), "ein"); // -e removed
	});

	it("handles German prepositions", () => {
		strictEqual(stemCistem("unter"), "unt");
		strictEqual(stemCistem("über"), "ueb");
		strictEqual(stemCistem("durch"), "durch");
		strictEqual(stemCistem("zwischen"), "zwisch");
	});

	it("handles German modal verbs", () => {
		strictEqual(stemCistem("können"), "koenn");
		strictEqual(stemCistem("müssen"), "muess");
		strictEqual(stemCistem("wollen"), "woll");
		strictEqual(stemCistem("sollen"), "soll");
	});

	it("handles German business terminology", () => {
		strictEqual(stemCistem("Unternehmen"), "unternehm");
		strictEqual(stemCistem("Geschäft"), "geschaef");
		strictEqual(stemCistem("Wirtschaft"), "wirtschaf");
		strictEqual(stemCistem("Verwaltung"), "verwalt");
	});

	it("handles German academic vocabulary", () => {
		strictEqual(stemCistem("Wissenschaft"), "wissenschaf");
		strictEqual(stemCistem("Forschung"), "forsch");
		strictEqual(stemCistem("Bildung"), "bild");
		strictEqual(stemCistem("Studium"), "studium");
	});

	it("handles technical German terms", () => {
		strictEqual(stemCistem("Technologie"), "technologi");
		strictEqual(stemCistem("Computer"), "comput");
		strictEqual(stemCistem("Software"), "softwar");
		strictEqual(stemCistem("Internet"), "intern");
	});

	it("handles German time expressions", () => {
		strictEqual(stemCistem("Jahre"), "jahr");
		strictEqual(stemCistem("Monate"), "monat");
		strictEqual(stemCistem("Wochen"), "woch");
		strictEqual(stemCistem("Tage"), "tag");
	});

	it("handles minimum stem length rule", () => {
		// Very short words should not be over-stemmed
		strictEqual(stemCistem("es"), "es");
		strictEqual(stemCistem("an"), "an");
		strictEqual(stemCistem("um"), "um");
	});

	it("handles consonant cluster cleanup", () => {
		strictEqual(stemCistem("Druck"), "druk"); // ck -> k
		strictEqual(stemCistem("Platz"), "plat"); // tz -> t
		strictEqual(stemCistem("Sitz"), "sit"); // tz -> t
	});

	it("handles words with numbers and punctuation", () => {
		strictEqual(stemCistem("Wort123"), "wor"); // Numbers removed, then 't' suffix removed
		strictEqual(stemCistem("Test-Fall"), "testfall"); // Hyphen removed
		strictEqual(stemCistem("E-Mail"), "email"); // Hyphen removed
	});
});
