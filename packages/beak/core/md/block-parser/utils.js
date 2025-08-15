/**
 * Splits text into lines for block parsing
 * @param {string} text - The text to split
 * @returns {string[]} - Array of lines
 */
export const splitIntoLines = (text) => {
	if (typeof text !== "string") return [];
	return text.split(/\r?\n/);
};
