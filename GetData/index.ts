import axios from "axios";
import { Queue } from "./src/Queue";
import { getFormattedDate } from "./src/func/getFormattedDate";
import { Mysql } from "./src/Mysql";
import { GameData } from "./src/GameData";
import fs from "fs";
import { CheckExecTime } from "./src/func/checkExecTime";

const ApiKeyList: string[] = [
  "tCYNVF3Zwu1iUnM2g2doQ4F8VOXwhOmr7FzwbN3E",
  "OH5e3EFhinaVP2SQW29Cc9u538rEhP6I8H4aNwQo",
];

const tierList: string[] = [
  "_all",
  "_demigod+",
  "_diamond+",
  "_platinum+",
  "_in1000",
];

function swapKey(ApiKey, idx) {
  ApiKey = ApiKeyList[idx];
  return ApiKey;
}

// startid 가져오는 전역
let startId: number = JSON.parse(
  fs.readFileSync("./lastGameId.json", "utf8")
).id;

// 전역 database 객체
const database: Mysql = new Mysql();

// 1싸이클마다 요청하는 api 수
const reqNum: number = 50;

//탐색 시간 설정. 일단은 현재로 잡아둠
const limitDtm = new Date();

//api 배열 접근 변수
let failedGameId: number[] = [];
let gameDataList: GameData[] = [];
let lastGameFound = false;

async function GetFailedGameData(ApiKey): Promise<number> {
  let gameData = [];
  let PromiseArr = [];
  let recovered: number = 0;
  while (failedGameId.length != 0) {
    for (let i = 0; i < failedGameId.length; i++) {
      PromiseArr.push(
        axios
          .get(`https://open-api.bser.io/v1/games/${failedGameId[i]}`, {
            headers: {
              accept: "application/json",
              "x-api-key": `${ApiKey}`,
            },
          })
          .then((res) => {
            return new GameData(res.data);
          })
      );
    }
    gameData = await Promise.all(
      PromiseArr.map((promise: Promise<GameData>) =>
        promise.catch((err) => {
          console.log(err);
          return new GameData({ code: 429, message: "Too Many Requests" });
        })
      )
    );

    for (let i = 0; i < gameData.length; i++) {
      if (gameData[i].code === 200) {
        // 성공
        console.log(
          "SUCCESSFULLY RECOVERED " +
            gameData[i].code +
            " " +
            gameData[i].gameId +
            "\n"
        );
        recovered++;
        gameDataList.splice(
          gameData[i].gameId - startId - reqNum,
          0,
          gameData[i]
        );
      } else if (gameData[i].code === 404) {
        console.log("SUCCESSFULLY RECOVERED " + gameData[i].code + "\n");
        recovered++;
      } else {
        failedGameId.push(gameData[i].gameId);
      }
    }
  }
  failedGameId = [];
  return recovered;
}

async function GetGameData(ApiKey): Promise<Queue<number>> {
  // 고정적으로 startId ~ startId + 99 사이 reqNum개의 id에 대한 결과를 요청
  let gameData: GameData[];
  let PromiseArr = [];
  let failedList: Queue<number> = new Queue<number>();
  let failed: number = 0;
  let maxSuccess: number = startId;

  for (let i = 0; i < reqNum; i++) {
    PromiseArr.push(
      axios
        .get(`https://open-api.bser.io/v1/games/${startId + i}`, {
          headers: {
            accept: "application/json",
            "x-api-key": `${ApiKey}`,
          },
        })
        .then((res) => {
          return new GameData(res.data);
        })
    );
  }
  gameData = await Promise.all(
    PromiseArr.map((promise: Promise<GameData>) =>
      promise.catch((err) => {
        console.log(err);
        return new GameData({ code: 429, message: "Too Many Requests" });
      })
    )
  );

  for (let i = 0; i < gameData.length; i++) {
    if (gameData[i].startDtm != null && gameData[i].startDtm >= limitDtm) {
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
    } else if (gameData[i].code === 404) {
      console.log(gameData[i]);
    } else {
      // 실패 404,200는 실패한 것으로 취급하지 않음
      console.log(gameData[i]);
      failedList.push(startId + i);
      failed++;
    }
  }

  console.log("started at: " + startId);
  console.log("Max Success id: " + maxSuccess);
  console.log("failed: " + failed);
  startId += reqNum;

  fs.writeFileSync(
    "./lastGameId.json",
    JSON.stringify({ id: startId }, null, 2)
  );
  return failedList;
}

async function SaveGameData(): Promise<void> {
  let promiseList: Promise<void>[] = [];
  let mmrCutline: number; // in1000 cutline
  let dataCount: number = gameDataList.length;
  let userCount: number;
  let versionName: string;
  let dataTblName: string;
  let userTblName: string;
  let latestVersion = await database.getLatestVersion("versionList");

  for (let i = 0; i < dataCount; i++) {
    promiseList = [];
    userCount = gameDataList[i].userData.length;
    if (
      gameDataList[i].matchingMode === 3 &&
      gameDataList[i].matchingTeamMode === 1
    ) {
      versionName =
        "v0." +
        String(gameDataList[i].userData[0].versionMajor) +
        "." +
        String(gameDataList[i].userData[0].versionMinor);

      if (versionName != latestVersion) {
        latestVersion = versionName;
        await database.saveVersion(
          "versionList",
          versionName,
          getFormattedDate(gameDataList[i].startDtm)
        );
      }
      dataTblName =
        versionName + "_" + getFormattedDate(gameDataList[i].startDtm);
      userTblName = "solo_" + String(gameDataList[i].seasonId); // 임시. 추후 스쿼드 듀오 솔로 코발트 추가 가능성 있으나 일단 하드코딩...
      await database.createUserTable(userTblName);
      mmrCutline = await database.getCutline(userTblName);

      for (let tiers in tierList) {
        //버전별 테이블 및 일일 테이블 생성
        await database.createDataTable(versionName + "_all" + tiers);
        await database.createDataTable(dataTblName + tiers);
      }
      // 각 티어에 맞는 테이블에 데이터 추가.
      for (let j = 0; j < userCount; j++) {
        promiseList.push(
          database.insertUserData(
            userTblName,
            gameDataList[i].userData[j].userNum,
            gameDataList[i].userData[j].mmrAfter,
            gameDataList[i].userData[j].mmrGain
          )
        );

        promiseList.push(
          // daily data
          database.insertGameData(
            dataTblName + "_all",
            gameDataList[i].userData[j]
          )
        );

        promiseList.push(
          // version data
          database.insertGameData(
            versionName + "_all" + "_all",
            gameDataList[i].userData[j]
          )
        );

        if (gameDataList[i].userData[j].mmrBefore >= 2400) {
          promiseList.push(
            // daily data
            database.insertGameData(
              dataTblName + "_demigod+",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push(
            // version data
            database.insertGameData(
              versionName + "_all" + "_demigod+",
              gameDataList[i].userData[j]
            )
          );
        }

        if (gameDataList[i].userData[j].mmrBefore >= 2000) {
          promiseList.push(
            // daily data
            database.insertGameData(
              dataTblName + "_diamond+",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push(
            // version data
            database.insertGameData(
              versionName + "_all" + "_diamond+",
              gameDataList[i].userData[j]
            )
          );
        }

        if (gameDataList[i].userData[j].mmrBefore >= 1600) {
          promiseList.push(
            // daily data
            database.insertGameData(
              dataTblName + "_platinum+",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push(
            // version data
            database.insertGameData(
              versionName + "_all" + "_platinum+",
              gameDataList[i].userData[j]
            )
          );
        }

        if (gameDataList[i].userData[j].mmrBefore > mmrCutline) {
          promiseList.push(
            // daily data
            database.insertGameData(
              dataTblName + "_in1000",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push(
            // version data
            database.insertGameData(
              versionName + "_all" + "_in1000",
              gameDataList[i].userData[j]
            )
          );
        }
      }
    }
    await Promise.all(promiseList); // map으로 에러처리 하긴 해야할듯 일단은 보류.
  }
}

async function GetGameDataCycle(): Promise<void> {
  let startDtm: number;
  let recovered: number = 0;
  let ApiKey = ApiKeyList[0];
  database.init();

  while (1) {
    //게임 데이터 수집
    gameDataList = [];
    // key swap
    swapKey(ApiKey, 1);
    let failedGameIdQueue: Queue<number> = await GetGameData(ApiKey);
    failedGameId.push(...failedGameIdQueue.toArray());
    startDtm = Date.now();
    CheckExecTime(startDtm, 300); // 최소 0.5초 보장

    // 조회 실패한 데이터 재조회
    startDtm = Date.now();
    // 키 스왑
    swapKey(ApiKey, 0);
    recovered = await GetFailedGameData(ApiKey);
    await SaveGameData();

    if (lastGameFound == true) break;
    CheckExecTime(startDtm, 300); // 최소 0.3초 보장
  }
}

async function Create10DayTable() {
  console.log("STARTED create10DaysTable");
  await database.create10DaysTable();
}

async function create3DayTable() {
  console.log("STARTED create3DaysTable");
  await database.create3DaysTable();
}

async function Task() {
  await GetGameDataCycle();
  await Create10DayTable();
  await create3DayTable();
  database.close();
  console.log("ALL TASK HAS ENDED!");
}

Task();
