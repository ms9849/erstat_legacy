import Router from "koa-router";
import { pool, character, weapon } from "../app";
import { Context, DefaultState } from "koa";
const router = new Router<DefaultState, Context>();

router.get("/:tblName", async (ctx, next) => {
  const connection = await pool.getConnection();
  try {
    const [tableVersion, tableDate, tableTier] = ctx.params.tblName.split("_");
    let resultPacket: any, tableRange: any;

    if (tableDate != "3days") {
      resultPacket = await connection.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '${connection
          .escape(tableVersion)
          .replace(/'/g, "")}%' and table_name like '%${connection
          .escape(tableTier)
          .replace(
            /'/g,
            ""
          )}' and table_name like '%-%' order by table_name asc;`
      );
      tableRange = resultPacket[0];
    } else {
      resultPacket = await connection.execute(
        `SELECT table_name FROM information_schema.tables WHERE table_name LIKE "%-%" AND table_name LIKE "%_all" order by table_name DESC limit 3`
      );
      tableRange = resultPacket[0];
    }

    resultPacket = await connection.execute(`SELECT 
                characterNum, 
                bestWeapon, 
                sum(top1) as top1, 
                sum(top3) as top3, 
                sum(top5) as top5, 
                sum(gameRank) as gameRank, 
                sum(monsterKill) as monsterKill, 
                sum(playerKill) as playerKill, 
                sum(mmrGain) as mmrGain, 
                sum(cnt) as cnt FROM \`${connection
                  .escape(ctx.params.tblName)
                  .replace(/'/g, "")}\` 
                GROUP BY characterNum, bestWeapon;`);
    const result = resultPacket[0];

    resultPacket = await connection.execute(
      `SELECT SUM(cnt) FROM \`${connection
        .escape(ctx.params.tblName)
        .replace(/'/g, "")}\``
    );
    const cnt = await resultPacket[0][0]["SUM(cnt)"];

    connection.release();
    await ctx.render("status", {
      character: character,
      weapon: weapon,
      characterData: result,
      allCnt: cnt,
      tableVersion: tableVersion,
      tableDate: tableDate,
      tableTier: tableTier,
      tableRange: tableRange,
    });
  } catch {
    connection.release();
    await ctx.render("error");
    return;
  }
});

export default router;
