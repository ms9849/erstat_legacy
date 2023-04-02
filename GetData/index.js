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
const axios_1 = __importDefault(require("axios"));
const Queue_1 = require("./src/Queue");
const getFormattedDate_1 = require("./src/func/getFormattedDate");
const Mysql_1 = require("./src/Mysql");
const GameData_1 = require("./src/GameData");
const fs_1 = __importDefault(require("fs"));
const checkExecTime_1 = require("./src/func/checkExecTime");
const apiKey = ["tCYNVF3Zwu1iUnM2g2doQ4F8VOXwhOmr7FzwbN3E", "OH5e3EFhinaVP2SQW29Cc9u538rEhP6I8H4aNwQo"];
let startId = JSON.parse(fs_1.default.readFileSync("./lastGameId.json", 'utf8')).id;
// startid 가져오는 전역
let lastGameFound = false;
// lastGame 찾았는지 여부
let database = new Mysql_1.Mysql();
// 전역 database 객체
let keyIdx = 0;
//api 배열 접근 변수
let failedAll = 0;
let recoveredAll = 0;
//20629445; 마지막으로 체크한 게임 ID. +1부터 체크해준다.//
let failedGameId = [];
let gameDataList = [];
const reqNum = 50;
// 1싸이클마다 요청하는 api 수
let checkDate = new Date("2022-10-13T15:00Z");
// 추후 시간 체크해서 자동으로 UTC 시 세팅이 필요함.
let checkDateKr = new Date(checkDate);
checkDateKr.setUTCHours(checkDate.getUTCHours() + 9);
console.log(checkDate.toUTCString() + "\n\n" + "in Korean Local Time:\n" + checkDateKr.toUTCString());
function getFailedGameData() {
    return __awaiter(this, void 0, void 0, function* () {
        let gameData = [];
        let PromiseArr = [];
        let recovered = 0;
        while (failedGameId.length != 0) {
            for (let i = 0; i < failedGameId.length; i++) {
                PromiseArr.push(axios_1.default
                    .get(`https://open-api.bser.io/v1/games/${failedGameId[i]}`, {
                    headers: {
                        accept: "application/json",
                        "x-api-key": `${apiKey[keyIdx]}`,
                    },
                })
                    .then((res) => {
                    return new GameData_1.GameData(res.data);
                }));
            }
            gameData = yield Promise.all(PromiseArr.map((promise) => promise.catch((err) => {
                console.log(err);
                return new GameData_1.GameData({ code: 429, message: "Too Many Requests" });
            })));
            failedGameId = [];
            for (let i = 0; i < gameData.length; i++) {
                if (gameData[i].code === 200) {
                    // 성공
                    console.log("SUCCESSFULLY RECOVERED " + gameData[i].code + " " + gameData[i].gameId + "\n");
                    recovered++;
                    gameDataList.splice(gameData[i].gameId - startId - reqNum, 0, gameData[i]);
                }
                else if (gameData[i].code === 404) {
                    console.log("SUCCESSFULLY RECOVERED " + gameData[i].code + "\n");
                    recovered++;
                }
                else {
                    failedGameId.push(gameData[i].gameId);
                }
            }
        }
        failedGameId = [];
        recoveredAll += recovered;
    });
}
function getGameData() {
    return __awaiter(this, void 0, void 0, function* () {
        // 고정적으로 startId ~ startId + 99 사이 reqNum개의 id에 대한 결과를 요청
        let gameData;
        let PromiseArr = [];
        let failedList = new Queue_1.Queue();
        let failed = 0;
        let maxSuccess = startId;
        for (let i = 0; i < reqNum; i++) {
            PromiseArr.push(axios_1.default
                .get(`https://open-api.bser.io/v1/games/${startId + i}`, {
                headers: {
                    accept: "application/json",
                    "x-api-key": `${apiKey[keyIdx]}`,
                },
            })
                .then((res) => {
                return new GameData_1.GameData(res.data);
            }));
        }
        gameData = yield Promise.all(PromiseArr.map((promise) => promise.catch((err) => {
            console.log(err);
            return new GameData_1.GameData({ code: 429, message: "Too Many Requests" });
        })));
        for (let i = 0; i < gameData.length; i++) {
            if (gameData[i].startDtm != null && gameData[i].startDtm >= checkDate) {
                // 성공했을때, 게임 시작시간이 정해진 시간을 넘겼을 경우
                console.log("Check Test Ended\nlast game ID: " + gameData[i].gameId);
                console.log("Date: " + gameData[i].startDtm.toUTCString());
                lastGameFound = true;
                startId = gameData[i].gameId;
                break;
            }
            if (gameData[i].code === 200) {
                // 성공
                maxSuccess = gameData[i].gameId;
                gameDataList.push(gameData[i]);
            }
            else if (gameData[i].code === 404) {
                console.log(gameData[i]);
            }
            else {
                // 실패 404,200는 실패한 것으로 취급하지 않음
                console.log(gameData[i]);
                failedList.push(startId + i);
                failed++;
            }
        }
        if (!lastGameFound) {
            console.log("started at: " + startId);
            console.log("Max Success id: " + maxSuccess);
            console.log("failed: " + failed);
            startId += reqNum;
        }
        fs_1.default.writeFileSync('./lastGameId.json', JSON.stringify({ "id": startId }, null, 2));
        return failedList;
    });
}
function saveGameData() {
    return __awaiter(this, void 0, void 0, function* () {
        let promiseList = [];
        let mmrCutline; // in1000 cutline
        let dataCount = gameDataList.length;
        let userCount;
        let versionName;
        let dataTblName;
        let userTblName;
        let latestVersion = yield database.getLatestVersion('versionList');
        for (let i = 0; i < dataCount; i++) {
            promiseList = [];
            userCount = gameDataList[i].userData.length;
            if (gameDataList[i].matchingMode === 3 && gameDataList[i].matchingTeamMode === 1) {
                versionName = "v0." + String(gameDataList[i].userData[0].versionMajor) + "." + String(gameDataList[i].userData[0].versionMinor);
                if (versionName != latestVersion) {
                    latestVersion = versionName;
                    yield database.saveVersion('versionList', versionName, (0, getFormattedDate_1.getFormattedDate)(gameDataList[i].startDtm));
                }
                dataTblName = versionName + "_" + (0, getFormattedDate_1.getFormattedDate)(gameDataList[i].startDtm);
                userTblName = "solo_" + String(gameDataList[i].seasonId); // 임시. 추후 스쿼드 듀오 솔로 코발트 추가 가능성 있으나 일단 하드코딩...
                yield database.createUserTable(userTblName);
                mmrCutline = yield database.getCutline(userTblName);
                yield database.createDataTable(versionName + "_all" + "_all");
                yield database.createDataTable(versionName + "_all" + "_demigod+");
                yield database.createDataTable(versionName + "_all" + "_diamond+");
                yield database.createDataTable(versionName + "_all" + "_platinum+");
                yield database.createDataTable(versionName + "_all" + "_in1000");
                //create version status table
                yield database.createDataTable(dataTblName + "_all");
                yield database.createDataTable(dataTblName + "_demigod+");
                yield database.createDataTable(dataTblName + "_diamond+");
                yield database.createDataTable(dataTblName + "_platinum+");
                yield database.createDataTable(dataTblName + "_in1000");
                //create daily status table
                //create user mmr table
                //1 cycle per 1 game
                for (let j = 0; j < userCount; j++) {
                    promiseList.push(database.insertUserData(userTblName, gameDataList[i].userData[j].userNum, gameDataList[i].userData[j].mmrAfter, gameDataList[i].userData[j].mmrGain));
                    promiseList.push(// daily data
                    database.insertGameData(dataTblName + "_all", gameDataList[i].userData[j]));
                    promiseList.push(// version data
                    database.insertGameData(versionName + "_all" + "_all", gameDataList[i].userData[j]));
                    if (gameDataList[i].userData[j].mmrBefore >= 2400) {
                        promiseList.push(// daily data
                        database.insertGameData(dataTblName + "_demigod+", gameDataList[i].userData[j]));
                        promiseList.push(// version data
                        database.insertGameData(versionName + "_all" + "_demigod+", gameDataList[i].userData[j]));
                    }
                    if (gameDataList[i].userData[j].mmrBefore >= 2000) {
                        promiseList.push(// daily data
                        database.insertGameData(dataTblName + "_diamond+", gameDataList[i].userData[j]));
                        promiseList.push(// version data
                        database.insertGameData(versionName + "_all" + "_diamond+", gameDataList[i].userData[j]));
                    }
                    if (gameDataList[i].userData[j].mmrBefore >= 1600) {
                        promiseList.push(// daily data
                        database.insertGameData(dataTblName + "_platinum+", gameDataList[i].userData[j]));
                        promiseList.push(// version data
                        database.insertGameData(versionName + "_all" + "_platinum+", gameDataList[i].userData[j]));
                    }
                    if (gameDataList[i].userData[j].mmrBefore > mmrCutline) {
                        promiseList.push(// daily data
                        database.insertGameData(dataTblName + "_in1000", gameDataList[i].userData[j]));
                        promiseList.push(// version data
                        database.insertGameData(versionName + "_all" + "_in1000", gameDataList[i].userData[j]));
                    }
                }
            }
            yield Promise.all(promiseList); // map으로 에러처리 하긴 해야할듯 일단은 보류.
        }
    });
}
function Update() {
    return __awaiter(this, void 0, void 0, function* () {
        let startDtm;
        database.init();
        while (1) {
            // get Data
            gameDataList = [];
            keyIdx = 1 - keyIdx; // key swap
            let failedGameIdQueue = yield getGameData();
            failedGameId.push(...failedGameIdQueue.toArray());
            startDtm = Date.now();
            (0, checkExecTime_1.checkExecTime)(startDtm, 300); // 최소 0.5초 보장
            //get failed Data
            startDtm = Date.now();
            keyIdx = 1 - keyIdx; // key swap
            yield getFailedGameData();
            //save data
            yield saveGameData();
            console.log("Recovered ALL: " + recoveredAll);
            if (lastGameFound) {
                console.log("next Start Id is : " + startId);
                lastGameFound = false;
                console.log("Succeed Game Id count: " + gameDataList.length);
                console.log("Failed All: " + failedAll);
                console.log("Recovered Game Id count: " + recoveredAll);
                break;
            }
            (0, checkExecTime_1.checkExecTime)(startDtm, 300); // 최소 0.3초 보장
        }
    });
}
function Create10DayTable() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("STARTED create10DaysTable");
        yield database.create10DaysTable();
    });
}
function create3DayTable() {
    return __awaiter(this, void 0, void 0, function* () {
        console.log("STARTED create3DaysTable");
        yield database.create3DaysTable();
    });
}
function Task() {
    return __awaiter(this, void 0, void 0, function* () {
        yield Update();
        yield Create10DayTable();
        yield create3DayTable();
        database.close();
        console.log("ALL TASK HAS ENDED!");
    });
}
Task();
