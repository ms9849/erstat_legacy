import Router from "koa-router";
import { pool } from "../app";
import { Context, DefaultState } from "koa";
const router = new Router<DefaultState, Context>();

router.get("/", async (ctx) => {
  const connection = await pool.getConnection();
  try {
    let latestVersion: string | undefined;
    if (!ctx.query.tier) ctx.query.tier = "all";
    let resultPacket: any, result: any;
    if (ctx.query.range === "1") {
      resultPacket = await connection.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection
          .escape(ctx.query.tier)
          .replace(
            /'/g,
            ""
          )}' AND table_name LIKE '%-%' ORDER BY table_name DESC LIMIT 14;`
      );
      result = resultPacket[0];
    } else if (ctx.query.range === "2") {
      resultPacket = await connection.execute(
        `SELECT version FROM versionlist order by version desc limit 1;`
      );
      latestVersion = resultPacket[0][0]["version"];

      resultPacket = await connection.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection
          .escape(ctx.query.tier)
          .replace(
            /'/g,
            ""
          )}' AND table_name LIKE '%_10days_%' ORDER BY table_name DESC LIMIT 3;`
      );
      result = resultPacket[0];
    } else if (ctx.query.range === "3") {
      resultPacket = await connection.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection
          .escape(ctx.query.tier)
          .replace(
            /'/g,
            ""
          )}' AND table_name LIKE '%_all_%' ORDER BY table_name DESC LIMIT 3;`
      );
      result = resultPacket[0];
    } else if (ctx.query.range === "4") {
      resultPacket = await connection.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection
          .escape(ctx.query.tier)
          .replace(
            /'/g,
            ""
          )}' AND table_name LIKE 'latest_3days%' ORDER BY table_name DESC LIMIT 3;`
      );
      result = resultPacket[0];
    } else {
      connection.release();
      await ctx.render("error");
      return;
    }
    connection.release();
    await ctx.render("statusList", {
      latestVersion: latestVersion,
      result: result,
      range: ctx.query.range,
      tier: ctx.query.tier,
    });
  } catch {
    connection.release();
    await ctx.render("error");
    return;
  }
});

export default router;
