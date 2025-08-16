import { Router } from "@ravenjs/wings";
import { Index } from "./pages/index.js";

export const router = new Router();

router.get("/", (ctx) => {
	ctx.html(Index);
});
