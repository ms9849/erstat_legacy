import { Context, DefaultState } from "koa";
import Router from "koa-router";
import { pool, characterMastery, character, weapon, trait } from "../app";

const router = new Router<DefaultState, Context>();

router.get("/", async (ctx, next) => {
  const connection = await pool.getConnection();
  try {
    if (ctx.query.bestWeapon == "default")
      ctx.query.bestWeapon =
        characterMastery[Number(ctx.query.characterNum) - 1]["weapon1"];

    if (
      !ctx.query.characterNum ||
      characterMastery.filter(function (e) {
        return (
          e.code == ctx.query.characterNum &&
          (e.weapon1 == ctx.query.bestWeapon ||
            e.weapon2 == ctx.query.bestWeapon ||
            e.weapon3 == ctx.query.bestWeapon ||
            e.weapon4 == ctx.query.bestWeapon)
        );
      })[0] == undefined
    ) {
      await ctx.render("error");
      return;
    }
    const [tableVersion, tableDate, tableTier] = ctx.params.tblName.split("_");
    let result: any = [];
    let resultPacket = await connection.execute(
      `SELECT table_name FROM information_schema.tables WHERE table_name LIKE ?;`,
      [ctx.params.tblName]
    );
    const tableName = resultPacket[0][0]["TABLE_NAME"];

    resultPacket = await connection.execute(
      "SELECT * FROM `" +
        connection.escape(tableName).replace(/'/g, "") +
        "` WHERE characterNum = ? AND bestWeapon = ? ORDER BY cnt DESC;",
      [ctx.query.characterNum, ctx.query.bestWeapon]
    );
    result = resultPacket[0];
    if (result[0] === undefined)
      result = [
        {
          characterNum: ctx.query.characterNum,
          bestWeapon: ctx.query.bestWeapon,
          top1: 0,
          top3: 0,
          top5: 0,
          gameRank: 0,
          monsterKill: 0,
          playerKill: 0,
          mmrGain: 0,
          playTime: 0,
          cnt: 0,
        },
      ];

    resultPacket = await connection.execute(
      "SELECT SUM(cnt) FROM `" +
        connection.escape(tableName).replace(/'/g, "") +
        "`"
    );
    const cnt = await resultPacket[0][0]["SUM(cnt)"];

    resultPacket = await connection.execute(
      "SELECT traitFirstCore,cnt FROM `" +
        connection.escape(tableName).replace(/'/g, "") +
        "` WHERE characterNum = ? AND bestWeapon = ? ORDER BY cnt DESC LIMIT 3;",
      [ctx.query.characterNum, ctx.query.bestWeapon]
    );
    const traitData = resultPacket[0];

    connection.release();
    await ctx.render("character", {
      character: character,
      weapon: weapon,
      weaponList: characterMastery,
      trait: trait,
      characterData: result,
      allCnt: cnt,
      traitData: traitData,
      tableVersion: tableVersion,
      tableDate: tableDate,
      tableTier: tableTier,
    });
  } catch {
    connection.release();
    await ctx.render("error");
    return;
  }
});

export default router;
