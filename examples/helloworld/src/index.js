import { Router } from "@raven-js/wings";
import { Greet } from "./server/pages/greet.js";
import { Index } from "./server/pages/index.js";
import { TodosPage } from "./server/pages/todos.js";

export const router = new Router();

router.get("/", (ctx) => {
	ctx.html(Index);
});

router.get("/greet", (ctx) => {
	ctx.html(Greet);
});

router.get("/todos", (ctx) => {
	ctx.html(TodosPage());
});

router.get("/api/todos/examples", (ctx) => {
	const examples = [
		"Buy milk and eggs from the grocery store",
		"Call mom about weekend plans",
		"Fix the leaky kitchen faucet",
		"Read chapter 3 of JavaScript: The Good Parts",
		"Water the plants on the balcony",
		"Schedule dentist appointment for next month",
		"Organize desk drawer and throw away old receipts",
		"Learn the basics of Node.js streams",
		"Plan next weekend's hiking trip route",
		"Update resume with recent project experience",
		"Clean out email inbox and unsubscribe from spam",
		"Research best practices for API security",
		"Buy birthday gift for sister",
		"Practice guitar for 30 minutes",
		"Backup important files to cloud storage",
	];

	// Select 5 random examples
	const selected = [];
	const used = new Set();

	while (selected.length < 5 && selected.length < examples.length) {
		const index = Math.floor(Math.random() * examples.length);
		if (!used.has(index)) {
			used.add(index);
			selected.push({
				id: Date.now() + Math.random(), // Unique ID
				text: examples[index],
				completed: Math.random() < 0.3, // 30% chance of being completed
			});
		}
	}

	ctx.json(selected);
});

router.get("/russian-roulette", (ctx) => {
	if (Math.random() < 0.5) {
		ctx.html(Index);
	} else {
		throw new Error("You died");
	}
});
