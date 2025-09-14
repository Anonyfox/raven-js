/**
 * Client-side application for interactive greeting
 * Demonstrates zero-build ESM development with @raven-js/beak
 */

import { generateGreeting } from "../shared/lib.js";

// Initialize the application when DOM is loaded
document.addEventListener("DOMContentLoaded", initializeApp);

function initializeApp() {
	const form = document.getElementById("greet-form");
	const nameInput = document.getElementById("name");
	const submitBtn = form.querySelector(".submit-btn");
	const btnText = submitBtn.querySelector(".btn-text");
	const loading = submitBtn.querySelector(".loading");
	const resultContainer = document.getElementById("result");

	// Handle form submission
	form.addEventListener("submit", async (event) => {
		event.preventDefault();

		const name = nameInput.value.trim();
		if (!name) {
			showError("Please enter your name!");
			return;
		}

		// Show loading state
		setLoadingState(true);

		try {
			// Simulate some async processing (e.g., API call)
			await new Promise((resolve) => setTimeout(resolve, 500));

			// Generate greeting using shared library
			const greetingHTML = await generateGreeting(name);

			// Display the result
			showResult(greetingHTML);
		} catch (error) {
			console.error("Error generating greeting:", error);
			showError("Something went wrong! Please try again.");
		} finally {
			setLoadingState(false);
		}
	});

	// Handle Enter key in input field
	nameInput.addEventListener("keypress", (event) => {
		if (event.key === "Enter") {
			form.dispatchEvent(new Event("submit"));
		}
	});

	// Focus the input field on page load
	nameInput.focus();

	function setLoadingState(isLoading) {
		submitBtn.disabled = isLoading;
		btnText.style.display = isLoading ? "none" : "inline";
		loading.classList.toggle("show", isLoading);
	}

	function showResult(htmlContent) {
		resultContainer.innerHTML = htmlContent;
		resultContainer.classList.add("show");

		// Scroll to result
		resultContainer.scrollIntoView({
			behavior: "smooth",
			block: "nearest",
		});
	}

	function showError(message) {
		const errorHTML = `
			<div style="color: #e53e3e; font-weight: 500;">
				❌ ${message}
			</div>
		`;
		showResult(errorHTML);
	}
}

// Optional: Add some debug logging for development
// Note: Always log in development since this is a demo/example
console.log("🦅 RavenJS Interactive Greeting App loaded");
console.log("✨ Using zero-build ESM development with resolve middleware");
