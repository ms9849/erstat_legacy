import koa from 'koa';
import Router from 'koa-router';
import bodyParser from 'koa-bodyparser';
import Pug from 'koa-pug';
import mysql2 from 'mysql2/promise';
import serve from 'koa-static';
import fs from 'fs';
import { getFormattedDate } from './public/ts/getFormattedDate';
import { createContext } from 'vm';
import { Console } from 'console';
import { mysqlConfig } from './mysqlConfig';
import { Port } from './portConfig';
const app = new koa();
const router = new Router();
const port = Port;
const pool = mysql2.createPool(mysqlConfig);

const character = JSON.parse(
    fs.readFileSync('./public/js/character.json').toString(),
);

const weapon = JSON.parse(
    fs.readFileSync('./public/js/weapon.json').toString(),
);

const trait = JSON.parse(
    fs.readFileSync('./public/js/trait.json').toString(),
);

const characterMastery = JSON.parse(
    fs.readFileSync('./public/js/characterMastery.json').toString(),
);

const pug = new Pug({
    app: app,
    viewPath: __dirname + '/public/views',
});

router.get('/', async(ctx) => {
    await ctx.render('index');
});

router.get('/statusList', async(ctx) => {
    const connection = await pool.getConnection();
    try {
        let latestVersion;
        if(!ctx.query.tier) ctx.query.tier = "all"
        //range는 1,2,3 .... 순으로 이어짐 1은 일일, 2는 10일, 3은 버전별통계임
        let resultPacket, result;
        if(ctx.query.range === "1") {
            resultPacket = await connection.execute(
                `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection.escape(ctx.query.tier).replace(/'/g,"")}' AND table_name LIKE '%-%' ORDER BY table_name DESC LIMIT 14;`
            );
            result = resultPacket[0];
        }
        else if(ctx.query.range ==="2") {
            resultPacket = await connection.execute(
                `SELECT version FROM versionlist order by version desc limit 1;`
            )
            latestVersion = resultPacket[0][0]['version'];
    
            resultPacket = await connection.execute(
                `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection.escape(ctx.query.tier).replace(/'/g,"")}' AND table_name LIKE '%_10days_%' ORDER BY table_name DESC LIMIT 3;`
            )
            result = resultPacket[0];
        }
        else if(ctx.query.range ==="3") {
            resultPacket = await connection.execute(
                `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection.escape(ctx.query.tier).replace(/'/g,"")}' AND table_name LIKE '%_all_%' ORDER BY table_name DESC LIMIT 3;`
            )
            result = resultPacket[0];
        }
        else if(ctx.query.range ==="4") {
            resultPacket = await connection.execute(
                `SELECT table_name FROM information_schema.tables WHERE table_name LIKE '%${connection.escape(ctx.query.tier).replace(/'/g,"")}' AND table_name LIKE 'latest_3days%' ORDER BY table_name DESC LIMIT 3;`
            )
            result = resultPacket[0];
        }
        else {
            connection.release();
            await ctx.render('error');
            return;
        }
        connection.release();
        await ctx.render('statusList', {
            latestVersion: latestVersion,
            result: result,
            range: ctx.query.range,
            tier: ctx.query.tier
        });
    } catch {
        connection.release();
        await ctx.render('error');
        return;
    }
});

router.get('/status/:tblName', async (ctx, next) => {
    const connection = await pool.getConnection();
    try {
        const [tableVersion, tableDate, tableTier] = ctx.params.tblName.split('_');
        let resultPacket, tableRange;

        if(tableDate != "3days") {
            resultPacket =  await connection.execute(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE '${connection.escape(tableVersion).replace(/'/g,"")}%' and table_name like '%${connection.escape(tableTier).replace(/'/g,"")}' and table_name like '%-%' order by table_name asc;`);
            tableRange = resultPacket[0];
        }
        else {
            resultPacket =  await connection.execute(`SELECT table_name FROM information_schema.tables WHERE table_name LIKE "%-%" AND table_name LIKE "%_all" order by table_name DESC limit 3`);
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
                sum(cnt) as cnt FROM \`${connection.escape(ctx.params.tblName).replace(/'/g,"")}\` 
                GROUP BY characterNum, bestWeapon;`,
            )
            const result = resultPacket[0];

            resultPacket = await connection.execute(
                `SELECT SUM(cnt) FROM \`${connection.escape(ctx.params.tblName).replace(/'/g,"")}\``,
                );
            const cnt = await resultPacket[0][0]['SUM(cnt)'];
        
            connection.release();
            await ctx.render('status', {
                character: character,
                weapon: weapon,
                characterData: result,
                allCnt: cnt,
                tableVersion: tableVersion,
                tableDate: tableDate,
                tableTier: tableTier,
                tableRange: tableRange
            });
    } catch {
        connection.release();
        await ctx.render('error');
        return;
    }
});

router.get('/status/:tblName/character', async (ctx, next) => {
    try {
        if(ctx.query.bestWeapon == "default") ctx.query.bestWeapon = characterMastery[Number(ctx.query.characterNum)-1]['weapon1'];

        if(!ctx.query.characterNum || characterMastery.filter(function(e){ return (e.code == ctx.query.characterNum && (e.weapon1 == ctx.query.bestWeapon || e.weapon2 == ctx.query.bestWeapon || e.weapon3 == ctx.query.bestWeapon || e.weapon4 == ctx.query.bestWeapon))})[0] == undefined) {
            await ctx.render('error');
            return;
        }
        const connection = await pool.getConnection();
        const [tableVersion, tableDate, tableTier] = ctx.params.tblName.split('_');
        let result: any = [];
        let resultPacket = await connection.execute(
            `SELECT table_name FROM information_schema.tables WHERE table_name LIKE ?;`,
            [ ctx.params.tblName ]
        );
        const tableName = resultPacket[0][0]['TABLE_NAME'];
        
        resultPacket = await connection.execute(
            'SELECT * FROM \`' + connection.escape(tableName).replace(/'/g,"") + '\` WHERE characterNum = ? AND bestWeapon = ? ORDER BY cnt DESC;',
            [ ctx.query.characterNum, ctx.query.bestWeapon ]
        );
        result = resultPacket[0];
        if(result[0] === undefined) result = [ {"characterNum": ctx.query.characterNum, "bestWeapon": ctx.query.bestWeapon, "top1": 0, "top3": 0, "top5": 0, "gameRank":0, "monsterKill":0, "playerKill":0, "mmrGain":0, "playTime":0, "cnt":0} ];
    
        resultPacket = await connection.execute(
            'SELECT SUM(cnt) FROM \`' + connection.escape(tableName).replace(/'/g,"") + '\`',
        );
        const cnt = await resultPacket[0][0]['SUM(cnt)'];
    
        resultPacket = await connection.execute(
            'SELECT traitFirstCore,cnt FROM \`' + connection.escape(tableName).replace(/'/g,"") + '\` WHERE characterNum = ? AND bestWeapon = ? ORDER BY cnt DESC LIMIT 3;',
            [ ctx.query.characterNum, ctx.query.bestWeapon ]
        );
        const traitData = resultPacket[0];
    
        connection.release();
        await ctx.render('character', {
            character: character,
            weapon: weapon,
            weaponList: characterMastery,
            trait: trait,
            traitData: traitData,
            data: result,
            characterNum: ctx.query.characterNum,
            bestWeapon: ctx.query.bestWeapon,
            allCnt: cnt,
            tableVersion: tableVersion,
            tableTier: tableTier,
            tableDate: tableDate
         });
    }
    catch {
        await ctx.render('error');
    }
});
//static file
app.use(serve(__dirname + '/static'));
app.use(serve(__dirname + '/public'));
//routing
app.use(router.routes());

//bodyparser
app.use(bodyParser());

app.listen(port, () => {
    console.log('server has started on ' + port)
})