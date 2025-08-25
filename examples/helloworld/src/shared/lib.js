/**
 * Shared greeting library
 * Demonstrates ES module imports and @raven-js/beak usage
 */

import { html } from "@raven-js/beak/html";

/**
 * Generate a personalized greeting message with dynamic HTML
 * @param {string} name - The name to greet
 * @returns {Promise<string>} HTML string for the greeting
 */
export async function generateGreeting(name) {
	// Validate input
	if (!name || typeof name !== "string") {
		throw new Error("Name must be a non-empty string");
	}

	// Clean the name (basic sanitization)
	const cleanName = name.trim().replace(/[<>]/g, "");

	// Generate various greeting styles based on name characteristics
	const greetingData = analyzeAndGreet(cleanName);

	// Use beak/html to generate the response
	const greetingHTML = html`
		<div style="text-align: center;">
			<h3 style="color: #2d3748; margin: 0 0 1rem 0; font-size: 1.5rem;">
				${greetingData.emoji} ${greetingData.greeting}
			</h3>

			<div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
						color: white;
						padding: 1rem;
						border-radius: 0.5rem;
						margin: 1rem 0;
						font-size: 1.1rem;
						font-weight: 500;">
				${greetingData.message}
			</div>

			<div style="color: #718096; font-size: 0.9rem; margin-top: 1rem;">
				<strong>Fun fact:</strong> ${greetingData.funFact}
			</div>

			<div style="color: #4a5568; font-size: 0.8rem; margin-top: 0.5rem; font-style: italic;">
				Generated using RavenJS Beak templating ✨
			</div>
		</div>
	`;

	return greetingHTML;
}

/**
 * Analyze the name and generate appropriate greeting data
 * @param {string} name - The clean name to analyze
 * @returns {Object} Greeting data object
 */
function analyzeAndGreet(name) {
	const nameLength = name.length;
	const firstLetter = name.charAt(0).toUpperCase();
	const isLongName = nameLength > 8;
	const hasVowelStart = /^[aeiouAEIOU]/.test(name);

	// Choose greeting style based on name characteristics
	let greeting, message, emoji, funFact;

	if (isLongName) {
		greeting = `Welcome, ${name}!`;
		message = `What a magnificent name you have! ${name} has such a wonderful sound to it.`;
		emoji = "👑";
		funFact = `Your name has ${nameLength} letters - that's quite distinguished!`;
	} else if (hasVowelStart) {
		greeting = `Hello there, ${name}!`;
		message = `Names starting with vowels like yours are said to bring good fortune!`;
		emoji = "🌟";
		funFact = `Did you know that names starting with "${firstLetter}" are often associated with creativity?`;
	} else {
		greeting = `Hey ${name}!`;
		message = `Nice to meet you! ${name} is such a cool name.`;
		emoji = "👋";
		funFact = `The letter "${firstLetter}" is the ${getAlphabetPosition(firstLetter)} letter of the alphabet!`;
	}

	// Add some randomness for fun
	const compliments = [
		"You have excellent taste in names!",
		"Your name has a really nice ring to it!",
		"What a fantastic name choice!",
		"Your name sounds very sophisticated!",
		"That's a name with character!",
	];

	const randomCompliment =
		compliments[Math.floor(Math.random() * compliments.length)];
	message += ` ${randomCompliment}`;

	return {
		greeting,
		message,
		emoji,
		funFact,
	};
}

/**
 * Get the position of a letter in the alphabet
 * @param {string} letter - Single letter
 * @returns {string} Position with ordinal suffix
 */
function getAlphabetPosition(letter) {
	const position = letter.toUpperCase().charCodeAt(0) - 64;
	const suffix = getOrdinalSuffix(position);
	return `${position}${suffix}`;
}

/**
 * Get ordinal suffix for a number (1st, 2nd, 3rd, etc.)
 * @param {number} num - The number
 * @returns {string} Ordinal suffix
 */
function getOrdinalSuffix(num) {
	const j = num % 10;
	const k = num % 100;

	if (j === 1 && k !== 11) return "st";
	if (j === 2 && k !== 12) return "nd";
	if (j === 3 && k !== 13) return "rd";
	return "th";
}

/**
 * Example of an additional utility function that could be shared
 * @param {string} text - Text to capitalize
 * @returns {string} Capitalized text
 */
export function capitalizeWords(text) {
	return text
		.split(" ")
		.map((word) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
		.join(" ");
}

// Export some constants that might be useful
export const GREETING_STYLES = {
	FORMAL: "formal",
	CASUAL: "casual",
	FUN: "fun",
};

export const SUPPORTED_LANGUAGES = ["en", "es", "fr", "de"];

// Log module loading for development
console.log("📚 Shared greeting library loaded with beak/html templating");
