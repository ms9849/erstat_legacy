"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const promise_1 = __importDefault(require("mysql2/promise"));
const json2excel_1 = __importDefault(require("json2excel"));
const fs_1 = __importDefault(require("fs"));
const version = "v0.68.0";
const tierList = ['all', 'platinum+', 'diamond+', 'demigod+', 'in1000'];
const date = "10days";
function createTblName(version, date, tier) {
    return version + "_" + date + "_" + tier;
}
function DataToExcel(tblName) {
    return __awaiter(this, void 0, void 0, function* () {
        let connection, rows, cols, chrData, allCnt;
        let character = JSON.parse(fs_1.default.readFileSync("./json/character.json").toString());
        let weapon = JSON.parse(fs_1.default.readFileSync("./json/weapon.json").toString());
        const Pool = yield promise_1.default.createPool({
            host: "localhost",
            user: "root",
            password: "wat331331",
            database: "userdata",
        });
        connection = yield Pool.getConnection();
        [rows, cols] = yield connection.query(`SELECT 
                characterNum, 
                bestWeapon, 
                sum(top1) as top1, 
                sum(top3) as top3, 
                sum(top5) as top5, 
                sum(gameRank) as gameRank, 
                sum(monsterKill) as monsterKill, 
                sum(playerKill) as playerKill, 
                sum(mmrGain) as mmrGain, 
                sum(omegaKilled) as omegaKilled,
                sum(alphaKilled) as alphaKilled,
                sum(wickelineKilled) as wickelineKilled,
                sum(gotMeteor) as gotMeteor,
                sum(gotMeteorFlag) as gotMeteorFlag,
                sum(gotTreeOfLife) as gotTreeOfLife,
                sum(gotTreeOfLifeFlag) as gotTreeOfLifeFlag,
				sum(cnt) as cnt 
                FROM \`${tblName}\` 
                GROUP BY characterNum, bestWeapon`);
        chrData = rows;
        [rows, cols] = yield connection.query(`SELECT
                sum(cnt) from \`${tblName}\`
                `);
        allCnt = rows[0]["sum(cnt)"];
        for (let i = 0; i < chrData.length; i++) {
            chrData[i]['characterNum'] = character[chrData[i]['characterNum'] - 1]["name_ko"];
            chrData[i]['bestWeapon'] = weapon[chrData[i]['bestWeapon']];
            chrData[i]['top1'] = Math.round(chrData[i]['top1'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['top3'] = Math.round(chrData[i]['top3'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['top5'] = Math.round(chrData[i]['top5'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['gameRank'] = Math.round(chrData[i]['gameRank'] / chrData[i]['cnt'] * 100) / 100;
            chrData[i]['playerKill'] = Math.round(chrData[i]['playerKill'] / chrData[i]['cnt'] * 100) / 100;
            chrData[i]['monsterKill'] = Math.round(chrData[i]['monsterKill'] / chrData[i]['cnt'] * 100) / 100;
            chrData[i]['mmrGain'] = Math.round(chrData[i]['mmrGain'] / chrData[i]['cnt'] * 100) / 100;
            chrData[i]['omegaKilled'] = Math.round(chrData[i]['omegaKilled'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['alphaKilled'] = Math.round(chrData[i]['alphaKilled'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['wickelineKilled'] = Math.round(chrData[i]['wickelineKilled'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['gotMeteorFlag'] = Math.round(chrData[i]['gotMeteorFlag'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['gotTreeOfLifeFlag'] = Math.round(chrData[i]['gotTreeOfLifeFlag'] / chrData[i]['cnt'] * 10000) / 100 + "%";
            chrData[i]['pickRate'] = Math.round(chrData[i]['cnt'] / allCnt * 10000) / 100 + "%";
            delete chrData[i]['cnt'];
        }
        console.log(chrData);
        let data = {
            sheets: [{
                    header: {
                        'characterNum': '캐릭터',
                        'bestWeapon': '무기군',
                        'pickRate': '픽률',
                        'playerKill': '평균 킬',
                        'gameRank': '평균 등수',
                        'top1': '승률',
                        'top3': 'TOP3',
                        'top5': 'TOP5',
                        'monsterKill': '평균 동물 처치',
                        'mmrGain': '평균 MMR 획득량',
                        'omegaKilled': '오메가 처치 비율',
                        'alphaKilled': '알파 처치 비율',
                        'wickelineKilled': '위클라인 처치 비율',
                        'gotMeteorFlag': '운석 획득 판 비율',
                        'gotTreeOfLifeFlag': '생나 획득 판 비율',
                        'gotMeteor': '운석 획득 수',
                        'gotTreeOfLife': '생명의 나무 획득 수',
                    },
                    items: chrData,
                    sheetName: tblName + " 10일치 통계",
                }],
            filepath: 'xlsx/' + tblName + '.xlsx'
        };
        yield json2excel_1.default.j2e(data, function (err) {
            console.log(`${tblName} has finished`);
        });
        yield connection.release();
        yield Pool.end();
    });
}
for (let i = 0; i < tierList.length; i++) {
    const tblName = createTblName(version, date, tierList[i]);
    DataToExcel(tblName);
}
