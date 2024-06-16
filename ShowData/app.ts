import Koa from "koa";
import Router from "koa-router";
import views from "koa-views";
import path from "path";
import mysql from "mysql2/promise";
import indexRouter from "./routes/index";
import statusListRouter from "./routes/statusList";
import statusRouter from "./routes/status";
import characterRouter from "./routes/character";
import fs from "fs";
import { Context, DefaultState } from "koa";

// 일부 필요한 데이터들은 로컬로 저장 및 로드한 뒤 수행.
const character = JSON.parse(
  fs.readFileSync("./public/js/character.json").toString()
);
const weapon = JSON.parse(
  fs.readFileSync("./public/js/weapon.json").toString()
);
const trait = JSON.parse(fs.readFileSync("./public/js/trait.json").toString());
const characterMastery = JSON.parse(
  fs.readFileSync("./public/js/characterMastery.json").toString()
);
const pool = mysql.createPool({
  /* database config */
});

const app = new Koa();
const router = new Router<DefaultState, Context>();
app.use(views(path.join(__dirname, "public/views"), { extension: "pug" }));

router.use("/", indexRouter.routes());
router.use("/statusList", statusListRouter.routes());
router.use("/status", statusRouter.routes());
router.use("/status/:tblName/character", characterRouter.routes());

app.use(router.routes()).use(router.allowedMethods());

app.listen(3000, () => {
  console.log("Server is running");
});

export { pool, character, weapon, trait, characterMastery };
