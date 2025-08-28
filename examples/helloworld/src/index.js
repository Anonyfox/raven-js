import { Router } from "@raven-js/wings";
import { Greet } from "./server/pages/greet.js";
import { Index } from "./server/pages/index.js";
import { Todos } from "./server/pages/todos.js";

export const router = new Router();

router.get("/", (ctx) => {
	ctx.html(Index);
});

router.get("/greet", (ctx) => {
	ctx.html(Greet);
});

router.get("/todos", (ctx) => {
	ctx.html(Todos);
});

router.get("/russian-roulette", (ctx) => {
	if (Math.random() < 0.5) {
		ctx.html(Index);
	} else {
		throw new Error("You died");
	}
});
