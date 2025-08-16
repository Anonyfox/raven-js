import { Router } from "@raven-js/wings";
import { Index } from "./pages/index.js";

export const router = new Router();

router.get("/", (ctx) => {
	ctx.html(Index);
});

router.get("/russion-roulette", (ctx) => {
	if (Math.random() < 0.5) {
		ctx.html(Index);
	} else {
		throw new Error("You died");
	}
});
