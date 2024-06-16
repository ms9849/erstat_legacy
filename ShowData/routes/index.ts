import Router from "koa-router";
import { Context, DefaultState } from "koa";
const router = new Router<DefaultState, Context>();

router.get("/", async (ctx) => {
  await ctx.render("index");
});

export default router;
