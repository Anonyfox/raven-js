/**
 * @author Anonyfox <max@anonyfox.com>
 * @license MIT
 * @see {@link https://github.com/Anonyfox/ravenjs}
 * @see {@link https://ravenjs.dev}
 * @see {@link https://anonyfox.com}
 */

/**
 * @file English signature phrases for text-type detection.
 * Data-only; used by detectTextType.
 */

/** @type {import('./signature-phrase.js').SignaturePhraseProfile} */
export const ENGLISH_SIGNATURE_PHRASES = {
	name: "english",
	defaultType: "business",
	grammar: {
		weight: 0.09,
		errorPatterns: [],
	},
	ruleOfThree: {
		conjunctions: new Set(["and", "or"]),
		separators: [/[,;]/g],
		minItemLength: 3,
		whitelistTokens: new Set(),
		weight: 0.13,
	},
	transitions: {
		phrases: new Set([
			"furthermore",
			"moreover",
			"in conclusion",
			"as a result",
			"however",
			"consequently",
			"therefore",
			"thus",
			"it's important to note",
		]),
		weight: 0.15,
		caseInsensitive: true,
	},
	participles: {
		sentenceInitial: {
			presentActions: new Set([
				"Running",
				"Working",
				"Processing",
				"Operating",
				"Performing",
			]),
			presentStates: new Set([
				"Being",
				"Having",
				"Considering",
				"Maintaining",
				"Ensuring",
				"Providing",
			]),
			past: new Set([
				"Completed",
				"Finished",
				"Accomplished",
				"Achieved",
				"Realized",
				"Fulfilled",
			]),
			irregular: new Set([
				"Built",
				"Made",
				"Done",
				"Written",
				"Given",
				"Taken",
				"Shown",
				"Known",
			]),
		},
		technicalVerbs: new Set([
			"Leveraging",
			"Utilizing",
			"Employing",
			"Incorporating",
			"Integrating",
			"Adopting",
		]),
		processVerbs: new Set([
			"Processing",
			"Analyzing",
			"Evaluating",
			"Computing",
			"Calculating",
			"Determining",
		]),
		systemVerbs: new Set([
			"Implementing",
			"Executing",
			"Deploying",
			"Installing",
			"Configuring",
			"Initializing",
		]),
		academicVerbs: new Set([
			"Examining",
			"Investigating",
			"Exploring",
			"Researching",
			"Studying",
			"Analyzing",
		]),
		businessVerbs: new Set([
			"Streamlining",
			"Optimizing",
			"Enhancing",
			"Improving",
			"Maximizing",
			"Increasing",
		]),
		marketingVerbs: new Set([
			"Delivering",
			"Providing",
			"Offering",
			"Presenting",
			"Introducing",
			"Showcasing",
		]),
		whenGerunds: new Set([
			"considering",
			"analyzing",
			"evaluating",
			"examining",
			"reviewing",
			"assessing",
		]),
		weight: 0.11,
	},
	priority: [
		"social_media",
		"casual",
		"academic",
		"technical",
		"business",
		"creative",
	],
	categories: {
		social_media: {
			tokens: new Set([
				"omg",
				"lol",
				"tbh",
				"imo",
				"cant",
				"dont",
				"wont",
				"ur",
				"u",
			]),
			emojis: [/😭|😊|😂|❤️|🔥/],
			punctuation: [/!{2,}/],
		},
		casual: {
			tokens: new Set([
				"kinda",
				"gonna",
				"wanna",
				"yeah",
				"okay",
				"stuff",
				"thing",
			]),
			phrases: new Set(["pretty good", "not bad"]),
		},
		academic: {
			tokens: new Set([
				"research",
				"study",
				"hypothesis",
				"findings",
				"conclusion",
				"longitudinal",
				"correlation",
				"populations",
				"investigation",
				"analysis",
				"methodology",
			]),
			cooccurrence: [
				new Set(["analysis", "methodology"]),
				new Set(["research", "study", "findings"]),
			],
		},
		technical: {
			tokens: new Set([
				"api",
				"algorithm",
				"database",
				"function",
				"optimization",
				"performance",
				"technical",
				"framework",
				"implementation",
				"system",
			]),
			cooccurrence: [
				new Set(["implementation", "system"]),
				new Set([
					"api",
					"algorithm",
					"performance",
					"optimization",
					"technical",
					"framework",
				]),
			],
		},
		business: {
			tokens: new Set([
				"stakeholders",
				"objectives",
				"deliverables",
				"strategic",
				"operational",
				"comprehensive",
				"solutions",
				"organizational",
				"roadmap",
				"excellence",
				"business",
			]),
			cooccurrence: [
				new Set(["implementation"]),
				new Set([
					"strategic",
					"objectives",
					"stakeholders",
					"business",
					"organizational",
				]),
			],
		},
		creative: {
			tokens: new Set([
				"suddenly",
				"whispered",
				"gazed",
				"dreamed",
				"imagined",
				"beautiful",
				"mysterious",
				"magical",
			]),
			punctuation: [/["']/],
		},
	},
};
