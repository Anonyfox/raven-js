/**
 * Todos Battleground - Pure client-side reflex implementation
 * Three operations. Zero excuses. Framework apocalypse.
 */

import { mount } from "@raven-js/reflex/dom";
import { Todos } from "../shared/todos.js";

// Initialize the battleground
document.addEventListener("DOMContentLoaded", async () => {
	// Mount reactive components - call SSR component to get template function
	mount(Todos, "#todos-app", { replace: true });

	console.log("🦅 Todos Battleground initialized");
	console.log("⚔️ Three operations. Zero excuses. Framework apocalypse.");
	console.log("📡 Loading example todos from API...");
});
