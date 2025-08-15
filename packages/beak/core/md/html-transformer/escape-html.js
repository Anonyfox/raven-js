/**
 * Escapes HTML special characters
 * @param {any} text - The text to escape (will be converted to string if not already)
 * @returns {string} - The escaped text
 */
export const escapeHTML = (text) => {
	if (typeof text !== "string") {
		text = String(text);
	}

	const escapeMap = {
		"&": "&amp;",
		"<": "&lt;",
		">": "&gt;",
		'"': "&quot;",
		"'": "&#39;",
	};

	return text.replace(
		/[&<>"']/g,
		(/** @type {string} */ char) =>
			escapeMap[/** @type {keyof typeof escapeMap} */ (char)],
	);
};
