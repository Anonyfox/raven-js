/**
 * Todos Battleground - Pure client-side reflex implementation
 * Three operations. Zero excuses. Framework apocalypse.
 */

import { mount } from "@raven-js/reflex/dom";
import { Todos } from "../shared/todos.js";

// Initialize the battleground
document.addEventListener("DOMContentLoaded", () => {
	// Mount reactive components
	mount(Todos, "#todos-app", { replace: true });

	// Load initial examples using effect for clean reactive side effect
	// effect(() => {
	// 	loadExamples();
	// });

	console.log("🦅 Todos Battleground initialized");
	console.log("⚔️ Three operations. Zero excuses. Framework apocalypse.");
	console.log("📡 Loading example todos from API...");
});
