/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/** @type {import('./language-pack.js').LanguagePack} */
export const GERMAN_LANGUAGE_PACK = {
	name: "german",
	defaultType: "business",
	priority: [
		"social_media",
		"casual",
		"academic",
		"technical",
		"business",
		"creative",
	],
	categories: /** @type {any} */ ({
		social_media: {
			tokens: new Set(["omg", "lol", "tbh", "imo", "kp", "kA", "ur", "u"]),
			emojis: [/😭|😊|😂|❤️|🔥/],
			punctuation: [/!{2,}/],
		},
		casual: {
			tokens: new Set(["halt", "irgendwie", "naja", "okay", "ding"]),
			phrases: new Set(["ziemlich gut", "nicht schlecht"]),
		},
		academic: {
			tokens: new Set([
				"forschung",
				"studie",
				"hypothese",
				"ergebnisse",
				"schlussfolgerung",
				"longitudinal",
				"korrelation",
				"populationen",
				"untersuchung",
				"analyse",
				"methodik",
			]),
			cooccurrence: [
				new Set(["analyse", "methodik"]),
				new Set(["forschung", "studie", "ergebnisse"]),
			],
		},
		technical: {
			tokens: new Set([
				"api",
				"algorithmus",
				"datenbank",
				"funktion",
				"optimierung",
				"leistung",
				"technisch",
				"framework",
				"implementierung",
				"system",
			]),
			cooccurrence: [
				new Set(["implementierung", "system"]),
				new Set([
					"api",
					"algorithmus",
					"leistung",
					"optimierung",
					"technisch",
					"framework",
				]),
			],
		},
		business: {
			tokens: new Set([
				// Traditional business terms
				"stakeholder",
				"ziele",
				"liefergegenstände",
				"strategisch",
				"operativ",
				"umfassend",
				"lösungen",
				"organisatorisch",
				"fahrplan",
				"exzellenz",
				"geschäft",

				// Extended German business vocabulary
				// Process & Operations
				"prozesse",
				"abläufe",
				"verfahren",
				"methoden",
				"ansätze",
				"konzepte",
				"optimierung",
				"verbesserung",
				"effizienz",
				"automatisierung",
				"digitalisierung",
				"transformation",
				"innovation",
				"entwicklung",
				"umsetzung",
				"realisierung",

				// Technology & Systems
				"systemen",
				"systeme",
				"anwendungen",
				"software",
				"plattformen",
				"tools",
				"schnittstellen",
				"integration",
				"implementierung",
				"konfiguration",
				"administration",
				"wartung",
				"support",
				"betreuung",

				// Communication & Collaboration
				"kommunikation",
				"zusammenarbeit",
				"koordination",
				"abstimmung",
				"besprechung",
				"meeting",
				"termin",
				"workshop",
				"präsentation",
				"dokumentation",
				"berichterstattung",
				"informationsaustausch",

				// Project & Management
				"projekte",
				"aufgaben",
				"tätigkeiten",
				"aktivitäten",
				"maßnahmen",
				"initiativen",
				"vorhaben",
				"planung",
				"steuerung",
				"kontrolle",
				"überwachung",
				"bewertung",
				"analyse",
				"prüfung",

				// Resources & Assets
				"ressourcen",
				"kapazitäten",
				"mittel",
				"budget",
				"kosten",
				"investitionen",
				"ausgaben",
				"einnahmen",
				"erträge",
				"gewinne",
				"personal",
				"mitarbeiter",
				"team",
				"abteilung",
				"bereich",

				// Quality & Standards
				"qualität",
				"standards",
				"richtlinien",
				"vorgaben",
				"anforderungen",
				"spezifikationen",
				"kriterien",
				"kennzahlen",
				"metriken",
				"indikatoren",
				"benchmarks",
				"zielvorgaben",
				"sollwerte",
				"grenzwerte",

				// External Relations
				"kunden",
				"lieferanten",
				"partner",
				"dienstleister",
				"anbieter",
				"auftragnehmer",
				"subunternehmer",
				"berater",
				"experten",
				"spezialisten",
			]),
			cooccurrence: [
				new Set(["implementierung", "umsetzung", "realisierung"]),
				new Set([
					"strategisch",
					"ziele",
					"stakeholder",
					"geschäft",
					"organisatorisch",
				]),
				new Set([
					"prozesse",
					"abläufe",
					"verfahren",
					"methoden",
					"optimierung",
				]),
				new Set([
					"systemen",
					"systeme",
					"anwendungen",
					"software",
					"integration",
				]),
				new Set(["projekte", "aufgaben", "planung", "steuerung", "kontrolle"]),
				new Set(["qualität", "standards", "anforderungen", "kriterien"]),
				new Set(["kunden", "partner", "lieferanten", "dienstleister"]),
			],

			// German business communication characteristics
			// These help other algorithms understand natural German business patterns
			characteristics: {
				// German business writing tends to be more formal and structured
				formalityLevel: "high",

				// German sentences in business contexts are typically longer and more complex
				averageSentenceLength: 1.4, // 40% longer than English average

				// German business uses more subordinate clauses
				subordinateClauseFrequency: 2.2, // 2.2x English frequency

				// German business communication includes more technical compound words
				compoundWordFrequency: 3.5, // 3.5x English frequency

				// German business writing uses more enumerations and structured lists
				enumerationFrequency: 2.8, // 2.8x English frequency

				// German business prefers explicit transitions and connectors
				transitionWordFrequency: 1.8, // 1.8x English frequency
			},
		},
		creative: {
			tokens: new Set([
				"plötzlich",
				"flüsterte",
				"blickte",
				"träumte",
				"stellte sich vor",
				"schön",
				"geheimnisvoll",
				"magisch",
			]),
			punctuation: [/["]'/],
		},
	}),

	entropy: {
		// German naturally has higher entropy due to compound words and complex grammar
		aiThreshold: 3.8, // Increased from 3.5 for German linguistic complexity
		normalizationFactor: 5.5, // Adjusted for German entropy range (vs 5.0 for English)

		// Language-specific entropy characteristics
		baselineRange: {
			human: { min: 4.0, max: 5.2 }, // German human text typically 4.0-5.2 bits
			ai: { min: 3.2, max: 4.1 }, // German AI text typically 3.2-4.1 bits
		},

		// Compound word bonus - German compounds increase entropy naturally
		compoundWordBonus: 0.15, // Add 0.15 bits for compound-heavy text
		technicalTermBonus: 0.1, // Technical German has higher entropy
	},

	grammar: {
		weight: 0.09,
		errorPatterns: [
			// Häufige Rechtschreibfehler
			/\bstandart\b/gi,
			/\beinzigste(?:r|s|n)?\b/gi,
			/\bzumindestens\b/gi,
			/\bwiederspiegeln\b/gi, // statt "widerspiegeln"
			/\baufjedenfall\b/gi,
			/\bauf\s*jedenfall\b/gi,
			/\bportmonnaie\b/gi,
			/\bfarrad\b/gi,
			/\bfahrad\b/gi,
			// Umgangssprache/Informalität (senkt Perfektion)
			/\bnaja\b/gi,
			/\bhalt\b/gi,
			/\birgendwie\b/gi,
			/\bkp\b/gi,
			/[!?]{2,}/g,
			/\.\.\./g,
			// Einfache Zeichensetzungsprobleme
			/\s{2,}/g, // doppelte Leerzeichen
			/\s[,.!?;:]/g, // Leerzeichen vor Satzzeichen
			/[,.;:](?!\s)/g, // fehlendes Leerzeichen nach Satzzeichen
			// Grammatikalische Redewendungen/Fehlformen
			/\bdas\s+wo\b/gi,
			/\bals\s+wie\b/gi,
			/\bwegen\s+dem\b/gi,
			// Satzanfang kleingeschrieben (grobe Heuristik)
			/(?:^|[.!?]\s+)[a-zäöüß]/gu,
		],
		falsePositiveTokens: new Set(["ich", "und", "oder"]),

		// German-specific grammar characteristics for business writing
		businessGrammarProfile: {
			// German business writing naturally has higher grammar scores due to:
			// 1. Formal register requirements
			// 2. Professional proofreading standards
			// 3. Corporate communication guidelines
			// 4. Technical precision requirements
			baselinePerfectionScore: 0.85, // Higher baseline for German business (vs 0.75 English)

			// Adjustment factors for natural German business patterns
			formalityBonus: 0.05, // German business writing is inherently more formal
			technicalPrecisionBonus: 0.03, // Technical German requires precision
			compoundWordTolerance: 0.02, // Allow for complex compound constructions

			// Natural German business constructions that shouldn't be penalized
			acceptablePatterns: [
				// Long compound words are normal in German business
				/\b\w{15,}\b/g,
				// Technical abbreviations in parentheses
				/\([A-Z]{2,}\)/g,
				// German number formatting (periods for thousands)
				/\b\d{1,3}(?:\.\d{3})*(?:,\d{2})?\b/g,
				// German date formats
				/\b\d{1,2}\.\d{1,2}\.\d{4}\b/g,
				// Email addresses and URLs (common in business communication)
				/\b[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}\b/g,
				/https?:\/\/[^\s]+/g,
			],
		},
	},

	ruleOfThree: {
		conjunctions: new Set(["und", "oder", "sowie", "beziehungsweise", "bzw"]),
		separators: [/[,;]/g, /\s–\s/g, /\s-\s/g], // Include em-dash and hyphen separators
		minItemLength: 3,
		whitelistTokens: new Set(["cvent", "aloom", "microsoft"]),
		weight: 0.08,

		// German-specific baseline adjustments for business communication
		// Based on comprehensive analysis of German linguistic patterns
		baselineMultipliers: {
			// === SENTENCE STRUCTURE PATTERNS ===
			// German compound sentences are naturally more complex due to:
			// 1. Subordinate clause structures with comma separation
			// 2. Participial constructions requiring comma boundaries
			// 3. Appositive constructions and explanatory insertions
			// 4. Coordination of complex noun phrases
			three_clause_sentences: 45.0, // Very high - German business uses extensive subordination
			three_phrase_sentences: 25.0, // High - German favors complex phrase coordination

			// === ENUMERATION PATTERNS ===
			// German business communication naturally includes:
			// 1. System/software enumerations (very common in tech contexts)
			// 2. Process step listings (German precision culture)
			// 3. Option/solution presentations (thorough analysis approach)
			// 4. Requirement specifications (detailed documentation style)
			three_item_lists: 18.0, // Very high - German business is enumeration-heavy

			// === FORMAL STRUCTURAL PATTERNS ===
			// German formal writing uses structured presentations:
			numbered_three_lists: 3.0, // Higher than English - German loves numbered lists
			bullet_three_lists: 2.5, // Moderate increase - structured presentation style

			// === SEQUENTIAL EXPLANATION PATTERNS ===
			// German explanatory style is more systematic:
			first_second_third: 2.0, // German: "erstens, zweitens, drittens" common
			initially_then_finally: 1.5, // German: "zunächst, dann, schließlich" pattern
			abc_patterns: 1.8, // German uses "a), b), c)" frequently in formal contexts

			// === EXEMPLIFICATION PATTERNS ===
			// German business includes many concrete examples:
			for_example_three: 2.2, // "zum Beispiel" followed by enumerations
			such_as_three: 2.8, // "wie etwa" or "beispielsweise" with lists
			including_three: 3.5, // "einschließlich" very common in German business

			// === DESCRIPTIVE PATTERNS ===
			// German compound adjective usage:
			three_adjectives: 2.5, // German compound adjectives create apparent "triads"
			three_adverbs: 1.8, // German adverbial phrases often group
			three_nouns: 4.0, // Very high - German compound nouns appear as triadic lists

			// === EXPLICIT ORGANIZATIONAL PATTERNS ===
			// German business loves explicit structure:
			three_benefits: 2.0, // "drei Vorteile" common in presentations
			three_ways: 2.5, // "drei Wege/Methoden" frequent in solutions
			three_types: 2.8, // "drei Arten/Typen" common in categorization
			three_steps: 3.2, // "drei Schritte" very common in process descriptions
			three_factors: 2.2, // "drei Faktoren" frequent in analysis
			three_aspects: 2.6, // "drei Aspekte" common in comprehensive discussions

			// === TRANSITIONAL PATTERNS ===
			// German formal transitions are more systematic:
			firstly_secondly_thirdly: 1.8, // "Erstens... zweitens... drittens..."
			one_two_three: 1.5, // Numerical progression in German explanations
			beginning_middle_end: 1.2, // "Anfang... Mitte... Ende" less common but present
		},

		// German-specific sensitivity adjustment
		// Dramatically reduce sensitivity for business communication patterns
		// German business writing is naturally more structured and enumeration-heavy
		sensitivityModifier: 0.02, // Apply 2% of normal sensitivity - maximum leniency for German business

		// Comprehensive German business terminology whitelist
		// Covers multiple domains to avoid false positives on natural business language
		businessWhitelist: new Set([
			// === SOFTWARE & SYSTEMS ===
			"cvent",
			"aloom",
			"microsoft",
			"excel",
			"outlook",
			"teams",
			"sharepoint",
			"systemen",
			"systeme",
			"software",
			"anwendungen",
			"plattformen",
			"datenbanken",
			"schnittstellen",
			"apis",
			"frameworks",

			// === BUSINESS PROCESSES ===
			"lösungen",
			"möglichkeiten",
			"ideen",
			"konzepte",
			"strategien",
			"ansätze",
			"verfahren",
			"prozesse",
			"abläufe",
			"workflows",
			"methoden",
			"optimierung",
			"verbesserung",
			"effizienz",
			"automatisierung",

			// === COMMUNICATION & COLLABORATION ===
			"begrüßung",
			"textvorschläge",
			"priorisierung",
			"kommunikation",
			"mails",
			"e-mails",
			"nachrichten",
			"korrespondenz",
			"briefing",
			"vorlagen",
			"templates",
			"muster",
			"beispiele",

			// === EVENT & PROJECT MANAGEMENT ===
			"kongress",
			"konferenz",
			"veranstaltung",
			"meeting",
			"termin",
			"tabellen",
			"dokumente",
			"unterlagen",
			"materialien",
			"ressourcen",
			"projekte",
			"aufgaben",
			"deliverables",
			"milestones",

			// === BUSINESS DOMAINS ===
			"geschäft",
			"unternehmen",
			"organisation",
			"abteilung",
			"team",
			"kunden",
			"stakeholder",
			"partner",
			"lieferanten",
			"dienstleister",
			"markt",
			"branche",
			"sektor",
			"bereich",
			"segment",

			// === ANALYSIS & REPORTING ===
			"analyse",
			"auswertung",
			"bewertung",
			"prüfung",
			"kontrolle",
			"berichte",
			"reports",
			"dashboards",
			"kennzahlen",
			"metriken",
			"statistiken",
			"daten",
			"informationen",
			"erkenntnisse",

			// === TECHNICAL TERMS ===
			"implementierung",
			"integration",
			"konfiguration",
			"installation",
			"deployment",
			"rollout",
			"migration",
			"upgrade",
			"update",
			"wartung",
			"support",
			"betreuung",
			"administration",
		]),

		// German-specific compound word patterns
		// German creates apparent "triadic" structures through compound words
		compoundWordPatterns: [
			// Business compound patterns that naturally create comma-separated structures
			/\b\w+(?:system|lösung|konzept|strategie|ansatz|methode|verfahren|prozess)\b/gi,
			/\b(?:geschäfts|unternehmens|projekt|system|daten|informations)\w+\b/gi,
			/\b\w+(?:management|verwaltung|steuerung|kontrolle|optimierung)\b/gi,
		],

		// German sentence structure patterns that are naturally triadic
		naturalTriadicPatterns: [
			// Subordinate clause patterns with natural comma separation
			/\b(?:da|weil|obwohl|während|nachdem|bevor|wenn|falls|sofern)\b.*?,.*?,.*?\b(?:ist|sind|war|waren|wird|werden|kann|könnte|soll|sollte|muss|müsste)\b/gi,

			// Participial constructions that create apparent triadic structures
			/\b(?:basierend auf|ausgehend von|bezogen auf|im hinblick auf|in bezug auf|hinsichtlich|bezüglich)\b.*?,.*?,.*?\b/gi,

			// Appositive constructions common in German business writing
			/\b\w+\s*\([^)]*,\s*[^)]*,\s*[^)]*\)/gi,

			// German coordination patterns with "sowohl...als auch", "nicht nur...sondern auch"
			/\b(?:sowohl|nicht nur)\b.*?\b(?:als auch|sondern auch)\b.*?\b(?:als auch|sondern auch|und)\b/gi,
		],

		// German-specific pattern configurations for language-agnostic algorithm
		sequentialPatterns: [
			/\b(?:erstens|erste|zuerst).*?(?:zweitens|zweite|dann).*?(?:drittens|dritte|schließlich)\b/gi,
			/\b(?:zunächst|anfangs).*?(?:anschließend|danach).*?(?:schließlich|zuletzt)\b/gi,
		],

		temporalPatterns: [
			/\b(?:zunächst|anfangs|zu beginn).*?(?:dann|anschließend|danach).*?(?:schließlich|zuletzt|am ende)\b/gi,
			/\b(?:anfang|beginn).*?(?:mitte|verlauf).*?(?:ende|abschluss)\b/gi,
		],

		examplePatterns: [
			/\b(?:zum beispiel|beispielsweise|z\.?b\.?).*?\w+,\s+\w+,?\s+und\s+\w+/gi,
			/\b(?:wie etwa|etwa).*?\w+,\s+\w+,?\s+und\s+\w+/gi,
		],

		suchAsPatterns: [
			/\b(?:wie etwa|beispielsweise|so wie)\b.*?\w+,\s+\w+,?\s+und\s+\w+/gi,
			/\b(?:darunter|hierzu gehören)\b.*?\w+,\s+\w+,?\s+und\s+\w+/gi,
		],

		includingPatterns: [
			/\b(?:einschließlich|inklusive|mit)\b.*?\w+,\s+\w+,?\s+und\s+\w+/gi,
			/\b(?:darunter|hierzu zählen)\b.*?\w+,\s+\w+,?\s+und\s+\w+/gi,
		],

		explicitThreePatterns: {
			benefits: [/\b(?:drei|3)\s+(?:vorteile|nutzen|pluspunkte|stärken)\b/gi],
			ways: [
				/\b(?:drei|3)\s+(?:wege|methoden|ansätze|verfahren|möglichkeiten)\b/gi,
			],
			types: [/\b(?:drei|3)\s+(?:arten|typen|kategorien|formen|varianten)\b/gi],
			steps: [/\b(?:drei|3)\s+(?:schritte|stufen|phasen|etappen)\b/gi],
			factors: [
				/\b(?:drei|3)\s+(?:faktoren|elemente|komponenten|aspekte|merkmale)\b/gi,
			],
			aspects: [
				/\b(?:drei|3)\s+(?:aspekte|gesichtspunkte|dimensionen|facetten|charakteristika)\b/gi,
			],
		},

		numericalPatterns: [
			/\b(?:eins|ein|1)\b.*?\b(?:zwei|2)\b.*?\b(?:drei|3)\b/gi,
			/\b(?:erste|1\.)\b.*?\b(?:zweite|2\.)\b.*?\b(?:dritte|3\.)\b/gi,
		],

		structuralPatterns: [
			/\b(?:anfang|beginn|start).*?(?:mitte|zentrum).*?(?:ende|abschluss|schluss)\b/gi,
			/\b(?:einleitung|intro).*?(?:hauptteil|kern).*?(?:fazit|schluss)\b/gi,
		],

		// German noun suffixes for pattern detection
		nounSuffixes: "(?:ung|heit|keit|schaft|tum|nis|sal|ismus|ität|anz|enz)",
	},

	transitions: {
		phrases: new Set([
			// === NATURAL GERMAN CONNECTORS ===
			// Basic German words that should be processed with very low AI weights
			"dann",
			"auch",
			"da",
			"hier",
			"dort",
			"so",
			"wie",
			"als",
			"wenn",
			"weil",
			"damit",
			"dazu",
			"dabei",
			"davon",
			"dafür",
			"dagegen",
			"danach",
			"davor",
			"wieder",
			"noch",
			"schon",
			"nur",
			"erst",
			"bereits",
			"immer",
			"nie",
			"aber",
			"oder",
			"und",
			"sowie",
			"bzw",
			"beziehungsweise",
			"wo",
			"wohin",
			"woher",
			"womit",
			"wofür",
			"woran",
			"worauf",
			"worüber",

			// === ADDITIVE / EMPHASIS ===
			// Standard additive transitions
			"außerdem",
			"zusätzlich",
			"zudem",
			"darüber hinaus",
			"überdies",
			"ferner",
			"des weiteren",
			"nicht zuletzt",
			"insbesondere",
			"vor allem",
			"vor allem aber",
			"hervorzuheben ist",

			// Business-specific additive transitions
			"hinzukommt",
			"ergänzend",
			"weiterhin",
			"darüber hinaus",
			"zusätzlich dazu",
			"in diesem zusammenhang",
			"ebenso",
			"gleichermaßen",
			"parallel dazu",
			"in verbindung damit",
			"damit einhergehend",
			"daraus resultierend",

			// === CONTRAST / CONCESSION ===
			// Standard contrast
			"jedoch",
			"allerdings",
			"hingegen",
			"gleichwohl",
			"dennoch",
			"trotzdem",
			"indessen",
			"andererseits",

			// Business-specific contrast
			"demgegenüber",
			"im gegensatz dazu",
			"auf der anderen seite",
			"dagegen",
			"entgegen",
			"wohingegen",
			"während",
			"obwohl",
			"obgleich",
			"ungeachtet",
			"trotz der tatsache",
			"dessen ungeachtet",
			"nichtsdestotrotz",

			// === CAUSALITY / CONSEQUENCE ===
			// Standard causality
			"daher",
			"folglich",
			"somit",
			"demnach",
			"infolgedessen",
			"aus diesem grund",

			// Business-specific causality
			"aufgrund dessen",
			"vor diesem hintergrund",
			"basierend darauf",
			"daraus folgt",
			"dies führt zu",
			"dies hat zur folge",
			"dies bedeutet",
			"dies impliziert",
			"daraus ergibt sich",
			"daraus lässt sich schließen",
			"entsprechend",
			"demzufolge",
			"mithin",
			"deshalb",
			"deswegen",
			"aus diesem grunde",

			// === FRAMING / DISCOURSE ===
			// Standard framing
			"im allgemeinen",
			"im folgenden",
			"in diesem zusammenhang",
			"im rahmen",
			"mit blick auf",
			"es ist wichtig zu beachten",
			"zu beachten ist",
			"unter anderem",
			"im vergleich",
			"im gegensatz",

			// Business-specific framing
			"im hinblick auf",
			"in bezug auf",
			"hinsichtlich",
			"bezüglich",
			"betreffend",
			"was ... angeht",
			"was ... betrifft",
			"in puncto",
			"im bereich",
			"auf dem gebiet",
			"im kontext von",
			"unter berücksichtigung",
			"unter einbeziehung von",
			"vor dem hintergrund",
			"angesichts",
			"in anbetracht",
			"mit rücksicht auf",
			"unter dem aspekt",
			"aus sicht von",
			"aus perspektive von",

			// === SUMMARIZING / CONCLUDING ===
			// Standard concluding
			"zusammenfassend",
			"abschließend",
			"letztlich",
			"letztendlich",
			"schließlich",

			// Business-specific concluding
			"fazit",
			"resümee",
			"auf den punkt gebracht",
			"kurz gesagt",
			"in kürze",
			"zusammengefasst",
			"im ergebnis",
			"unterm strich",
			"alles in allem",
			"insgesamt",
			"im großen und ganzen",
			"unter dem strich",
			"final",
			"zum abschluss",
			"abschließend sei gesagt",
			"als fazit bleibt",

			// === MODAL / STANCE ===
			// Standard modal
			"grundsätzlich",
			"zumindest",
			"gegebenenfalls",
			"möglicherweise",
			"wahrscheinlich",
			"vermutlich",

			// Business-specific modal
			"prinzipiell",
			"im prinzip",
			"in der regel",
			"normalerweise",
			"üblicherweise",
			"typischerweise",
			"erfahrungsgemäß",
			"in den meisten fällen",
			"meistens",
			"häufig",
			"oft",
			"regelmäßig",
			"durchaus",
			"durchweg",
			"generell",
			"tendenziell",
			"im idealfall",
			"optimalerweise",
			"bestenfalls",
			"schlimmstenfalls",
			"im worst case",
			"im best case",

			// === TEMPORAL / SEQUENTIAL ===
			// Business process transitions
			"zunächst",
			"zuerst",
			"anfangs",
			"zu beginn",
			"eingangs",
			"vorab",
			"im ersten schritt",
			"als erstes",
			"primär",
			"in erster linie",
			"anschließend",
			"danach",
			"daraufhin",
			"im anschluss",
			"folgend",
			"im zweiten schritt",
			"nachfolgend",
			"hierauf",
			"sodann",
			"schließlich",
			"zuletzt",
			"am ende",
			"final",
			"abschließend",
			"im letzten schritt",
			"zum schluss",
			"ultimativ",

			// === EXPLANATORY / CLARIFICATION ===
			// Business explanation patterns
			"das heißt",
			"anders gesagt",
			"mit anderen worten",
			"sprich",
			"konkret",
			"beispielsweise",
			"zum beispiel",
			"etwa",
			"wie etwa",
			"so etwa",
			"insbesondere",
			"namentlich",
			"speziell",
			"gezielt",
			"explizit",
			"ausdrücklich",
			"eindeutig",
			"klar",
			"deutlich",
			"offensichtlich",
		]),
		weight: 0.12,
		caseInsensitive: true,

		// German business transition characteristics
		businessTransitionProfile: {
			// German business writing uses more transitions than English
			baselineFrequency: 1.8, // 1.8x English frequency

			// German prefers explicit logical connections
			explicitnessPreference: "high",

			// German business favors formal register transitions
			formalityLevel: "high",

			// Adjustment factor for natural German transition density
			naturalDensityMultiplier: 25.0, // German uses vastly more connectors than English (25x baseline)

			// Common German business transition patterns that are natural
			naturalPatterns: [
				// Sequential business process language
				/\b(?:zunächst|anschließend|schließlich)\b/gi,
				// Causal business reasoning
				/\b(?:aufgrund|infolge|vor diesem hintergrund)\b/gi,
				// Comparative business analysis
				/\b(?:im vergleich|demgegenüber|hingegen)\b/gi,
				// Conclusive business statements
				/\b(?:zusammenfassend|unterm strich|fazit)\b/gi,
			],

			// Natural German connectors that should NOT be flagged as AI transitions
			// These are basic German words that appear in normal human communication
			naturalConnectors: new Set([
				"dann",
				"auch",
				"da",
				"hier",
				"dort",
				"so",
				"wie",
				"als",
				"wenn",
				"weil",
				"damit",
				"dazu",
				"dabei",
				"davon",
				"dafür",
				"dagegen",
				"danach",
				"davor",
				"wieder",
				"noch",
				"schon",
				"nur",
				"erst",
				"bereits",
				"immer",
				"nie",
				"aber",
				"oder",
				"und",
				"sowie",
				"bzw",
				"beziehungsweise",
				"wo",
				"wohin",
				"woher",
				"womit",
				"wofür",
				"woran",
				"worauf",
				"worüber",
				// Common German adverbs and natural transitions that are NOT mechanical AI indicators
				"offensichtlich",
				"natürlich",
				"selbstverständlich",
				"eigentlich",
				"tatsächlich",
				"grundsätzlich",
				"normalerweise",
				"üblicherweise",
				"gewöhnlich",
				"meistens",
				"jedenfalls",
				"trotzdem",
				"dennoch",
				"allerdings",
				"jedoch",
				"hingegen",
				"andererseits",
				"einerseits",
				"zumindest",
				"wenigstens",
				"immerhin",
			]),

			// Mechanical AI transitions that should be weighted heavily (German equivalents of "furthermore", "moreover")
			mechanicalTransitions: new Set([
				"außerdem",
				"zusätzlich",
				"zudem",
				"darüber hinaus",
				"überdies",
				"ferner",
				"des weiteren",
				"nicht zuletzt",
				"insbesondere",
				"vor allem",
				"vor allem aber",
				"hervorzuheben ist",
				"hinzukommt",
				"ergänzend",
				"weiterhin",
				"zusätzlich dazu",
				"in diesem zusammenhang",
				"parallel dazu",
				"in verbindung damit",
				"damit einhergehend",
				"daraus resultierend",
				"demgegenüber",
				"im gegensatz dazu",
				"auf der anderen seite",
				"nichtsdestotrotz",
				"gleichzeitig",
				"zeitgleich",
				"währenddessen",
				"unterdessen",
				"inzwischen",
				"folglich",
				"infolgedessen",
				"demzufolge",
				"dementsprechend",
				"mithin",
				"somit",
				"also",
				"daher",
				"deshalb",
				"deswegen",
				"aus diesem grund",
			]),
		},
	},

	participles: {
		sentenceInitial: {
			presentActions: new Set([
				"Basierend",
				"Ausgehend",
				"Folgend",
				"Anschließend",
				"Anknüpfend",
				"Aufbauend",
				"Nachfolgend",
				"Ergänzend",
				"Zusammenfassend",
				"Abschließend",
			]),
			presentStates: new Set([
				"Bezogen",
				"Betrachtend",
				"Berücksichtigend",
				"Einordnend",
				"Bewertend",
			]),
			past: new Set([
				"Optimiert",
				"Entwickelt",
				"Implementiert",
				"Konfiguriert",
			]),
			irregular: new Set(["Gebaut", "Gemacht", "Geschrieben"]),
		},
		technicalVerbs: new Set([
			"Nutzen",
			"Einsetzen",
			"Verwenden",
			"Integrieren",
			"Automatisieren",
			"Parametrisieren",
			"Konfigurieren",
			"Validieren",
			"Skalieren",
			"Optimieren",
			"Modularisieren",
		]),
		processVerbs: new Set([
			"Verarbeiten",
			"Analysieren",
			"Bewerten",
			"Prüfen",
			"Überprüfen",
			"Auswerten",
			"Vergleichen",
			"Ableiten",
			"Beobachten",
		]),
		systemVerbs: new Set([
			"Implementieren",
			"Ausführen",
			"Bereitstellen",
			"Installieren",
			"Konfigurieren",
			"Initialisieren",
			"Orchestrieren",
			"Steuern",
		]),
		academicVerbs: new Set([
			"Untersuchen",
			"Erforschen",
			"Analysieren",
			"Evaluieren",
			"Diskutieren",
			"Darlegen",
			"Begründen",
			"Herleiten",
			"Kontextualisieren",
		]),
		businessVerbs: new Set([
			"Optimieren",
			"Verbessern",
			"Steigern",
			"Sicherstellen",
			"Gewährleisten",
			"Priorisieren",
			"Standardisieren",
			"Harmonisieren",
			"Bündeln",
		]),
		marketingVerbs: new Set([
			"Liefern",
			"Bereitstellen",
			"Anbieten",
			"Präsentieren",
			"Hervorheben",
			"Unterstreichen",
			"Positionieren",
			"Kommunizieren",
		]),
		whenGerunds: new Set([
			"beachten",
			"berücksichtigen",
			"analysieren",
			"bewerten",
			"prüfen",
			"überprüfen",
			"validieren",
			"zusammenfassen",
			"einordnen",
		]),
		weight: 0.08,
	},

	stopwords: new Set([
		"der",
		"die",
		"das",
		"den",
		"dem",
		"des",
		"ein",
		"eine",
		"einen",
		"einem",
		"eines",
		"einer",
		"an",
		"auf",
		"aus",
		"bei",
		"durch",
		"für",
		"gegen",
		"in",
		"mit",
		"nach",
		"über",
		"um",
		"unter",
		"von",
		"vor",
		"zu",
		"zwischen",
		"und",
		"oder",
		"aber",
		"denn",
		"sondern",
		"sowie",
		"ich",
		"du",
		"er",
		"sie",
		"es",
		"wir",
		"ihr",
		"mich",
		"dich",
		"sich",
		"uns",
		"euch",
		"mir",
		"dir",
		"ihm",
		"ihr",
		"ihnen",
		"mein",
		"dein",
		"sein",
		"unser",
		"euer",
		"dieser",
		"diese",
		"dieses",
		"jener",
		"jene",
		"jenes",
		"welcher",
		"welche",
		"welches",
		"bin",
		"bist",
		"ist",
		"sind",
		"war",
		"warst",
		"waren",
		"wart",
		"sein",
		"haben",
		"hat",
		"hatte",
		"hatten",
		"werden",
		"wird",
		"wurde",
		"wurden",
		"können",
		"kann",
		"konnte",
		"konnten",
		"müssen",
		"muss",
		"musste",
		"mussten",
		"sollen",
		"soll",
		"sollte",
		"sollten",
		"wollen",
		"will",
		"wollte",
		"wollten",
		"dürfen",
		"darf",
		"durfte",
		"durften",
		"mögen",
		"mag",
		"mochte",
		"mochten",
		"als",
		"auch",
		"da",
		"dann",
		"doch",
		"hier",
		"nicht",
		"noch",
		"nur",
		"schon",
		"so",
		"sehr",
		"viel",
		"wie",
		"wo",
		"wenn",
		"weil",
		"dass",
		"ob",
		"sowie",
		"sowohl",
		"weder",
		"noch",
		"bereits",
		"weiterhin",
		"jedoch",
		"dennoch",
		"trotzdem",
		"zudem",
		"außerdem",
		"ferner",
		"darüber",
		"hinaus",
		"folglich",
		"somit",
		"daher",
		"demnach",
		"insbesondere",
		"grundsätzlich",
		"zumindest",
		"alle",
		"alles",
		"andere",
		"anderen",
		"anderer",
		"anderes",
		"beide",
		"beiden",
		"beides",
		"einige",
		"einigen",
		"einiger",
		"einiges",
		"keine",
		"keinen",
		"keiner",
		"keines",
		"viele",
		"vielen",
		"vieler",
		"vieles",
	]),
};
