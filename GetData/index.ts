import axios from "axios";
import { Queue } from "./src/Queue";
import { getFormattedDate } from "./src/func/getFormattedDate";
import { Mysql } from "./src/Mysql";
import { GameData } from "./src/GameData";
import fs from "fs";
import { checkExecTime } from "./src/func/checkExecTime";
const apiKey: string[] = [ "tCYNVF3Zwu1iUnM2g2doQ4F8VOXwhOmr7FzwbN3E" , "OH5e3EFhinaVP2SQW29Cc9u538rEhP6I8H4aNwQo" ];
let startId: number = JSON.parse(fs.readFileSync("./lastGameId.json",'utf8')).id;
// startid 가져오는 전역
let lastGameFound: boolean = false;
// lastGame 찾았는지 여부
let database: Mysql = new Mysql();
// 전역 database 객체
let keyIdx = 0;
//api 배열 접근 변수
let failedAll = 0;
let recoveredAll = 0;
//20629445; 마지막으로 체크한 게임 ID. +1부터 체크해준다.//
let failedGameId: number[] = [];
let gameDataList: GameData[] = [];
const reqNum: number = 50;
// 1싸이클마다 요청하는 api 수
let checkDate = new Date("2022-10-13T15:00Z"); 
// 추후 시간 체크해서 자동으로 UTC 시 세팅이 필요함.
let checkDateKr = new Date(checkDate);
checkDateKr.setUTCHours(checkDate.getUTCHours() + 9);
console.log(checkDate.toUTCString() + "\n\n" + "in Korean Local Time:\n" + checkDateKr.toUTCString());

async function getFailedGameData(): Promise<void> {
  let gameData = [];
  let PromiseArr = [];
  let recovered: number = 0;
  while(failedGameId.length != 0) {
    for (let i = 0; i < failedGameId.length; i++) {
      PromiseArr.push(
        axios
          .get(`https://open-api.bser.io/v1/games/${failedGameId[i]}`, {
            headers: {
              accept: "application/json",
              "x-api-key": `${apiKey[keyIdx]}`,
            },
          })
          .then((res) => {
            return new GameData(res.data);
          })
      );
    }
    gameData = await Promise.all(PromiseArr.map((promise: Promise<GameData>) =>
      promise.catch((err) => { 
        console.log(err);
        return new GameData({code: 429, message: "Too Many Requests"});
      }) 
    ));

    failedGameId = [];

    for (let i = 0; i < gameData.length; i++) {
      if (gameData[i].code === 200) {
        // 성공
        console.log("SUCCESSFULLY RECOVERED " + gameData[i].code  + " " +  gameData[i].gameId + "\n");
        recovered++;
        gameDataList.splice(gameData[i].gameId - startId - reqNum, 0, gameData[i]);
      }
      else if(gameData[i].code === 404) {
        console.log("SUCCESSFULLY RECOVERED " + gameData[i].code  + "\n");
        recovered++;
      }
      else {
        failedGameId.push(gameData[i].gameId);
      }
    }
  }
  failedGameId = [];
  recoveredAll += recovered;
}

async function getGameData(): Promise<Queue<number>> {
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
            "x-api-key": `${apiKey[keyIdx]}`,
          },
        })
        .then((res) => {
          return new GameData(res.data);
        })
    );
  }

  gameData = await Promise.all(PromiseArr.map((promise: Promise<GameData>) =>
    promise.catch((err) => { 
      console.log(err);
      return new GameData({code: 429, message: "Too Many Requests"});
    }) 
  ));

  for (let i = 0; i < gameData.length; i++) {
    if (gameData[i].startDtm != null && gameData[i].startDtm >= checkDate) {
      // 성공했을때, 게임 시작시간이 정해진 시간을 넘겼을 경우
      console.log("Check Test Ended\nlast game ID: " + gameData[i].gameId);
      console.log("Date: " + gameData[i].startDtm.toUTCString() );
      lastGameFound = true;
      startId = gameData[i].gameId;
      break;
    }

    if (gameData[i].code === 200) {
      // 성공
      maxSuccess = gameData[i].gameId;
      gameDataList.push(gameData[i]);
    }
    else if(gameData[i].code === 404) {
      console.log(gameData[i]);
    } 
    else {
      // 실패 404,200는 실패한 것으로 취급하지 않음
      console.log(gameData[i]);
      failedList.push(startId + i);
      failed++;
    }
  }
  
  if(!lastGameFound) {
    console.log("started at: " + startId);
    console.log("Max Success id: " + maxSuccess);
    console.log("failed: " + failed);
    startId += reqNum;
  }
  fs.writeFileSync('./lastGameId.json', JSON.stringify({"id":startId}, null, 2));
  return failedList;
}

async function saveGameData(): Promise<void> {
  let promiseList: Promise<void>[] = [];
  let mmrCutline: number; // in1000 cutline
  let dataCount: number = gameDataList.length;
  let userCount: number;
  let versionName: string;
  let dataTblName: string;
  let userTblName: string;
  let latestVersion = await database.getLatestVersion('versionList');

  for (let i = 0; i < dataCount; i++) {
    promiseList = [];
    userCount = gameDataList[i].userData.length;
    if (gameDataList[i].matchingMode === 3 && gameDataList[i].matchingTeamMode === 1) {
      
      versionName = "v0." + String(gameDataList[i].userData[0].versionMajor) + "." + String(gameDataList[i].userData[0].versionMinor);
      if(versionName != latestVersion) {
        latestVersion = versionName;
        await database.saveVersion('versionList', versionName ,getFormattedDate(gameDataList[i].startDtm));
      }
      dataTblName = versionName + "_" + getFormattedDate(gameDataList[i].startDtm);
      userTblName = "solo_" + String(gameDataList[i].seasonId); // 임시. 추후 스쿼드 듀오 솔로 코발트 추가 가능성 있으나 일단 하드코딩...
      await database.createUserTable(userTblName);
      mmrCutline = await database.getCutline(userTblName);

      await database.createDataTable(versionName + "_all" + "_all");
      await database.createDataTable(versionName + "_all" + "_demigod+");
      await database.createDataTable(versionName + "_all"+ "_diamond+");
      await database.createDataTable(versionName + "_all"+ "_platinum+");
      await database.createDataTable(versionName + "_all"+ "_in1000");
      //create version status table
      await database.createDataTable(dataTblName + "_all");
      await database.createDataTable(dataTblName + "_demigod+");
      await database.createDataTable(dataTblName + "_diamond+");
      await database.createDataTable(dataTblName + "_platinum+");
      await database.createDataTable(dataTblName + "_in1000");
      //create daily status table
      //create user mmr table

      //1 cycle per 1 game
      for (let j = 0; j < userCount; j++) {
        promiseList.push(
          database.insertUserData(
            userTblName,
            gameDataList[i].userData[j].userNum,
            gameDataList[i].userData[j].mmrAfter,
            gameDataList[i].userData[j].mmrGain
          )
        );
        
        promiseList.push( // daily data
          database.insertGameData(
            dataTblName + "_all",
            gameDataList[i].userData[j]
          )
        );

        promiseList.push( // version data
          database.insertGameData(
            versionName + "_all" + "_all",
            gameDataList[i].userData[j]
          )
        );

        if (gameDataList[i].userData[j].mmrBefore >= 2400) {
          promiseList.push( // daily data
            database.insertGameData(
              dataTblName + "_demigod+",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push( // version data
            database.insertGameData(
              versionName + "_all" + "_demigod+",
              gameDataList[i].userData[j]
            )
          );
        }

        if (gameDataList[i].userData[j].mmrBefore >= 2000) {
          promiseList.push( // daily data
            database.insertGameData(
              dataTblName + "_diamond+",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push( // version data
            database.insertGameData(
              versionName + "_all"+ "_diamond+",
              gameDataList[i].userData[j]
            )
          );
        }

        if (gameDataList[i].userData[j].mmrBefore >= 1600) {
          promiseList.push( // daily data
            database.insertGameData(
              dataTblName + "_platinum+",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push( // version data
            database.insertGameData(
              versionName + "_all" + "_platinum+",
              gameDataList[i].userData[j]
            )
          );
        }

        if (gameDataList[i].userData[j].mmrBefore > mmrCutline) {
          promiseList.push( // daily data
            database.insertGameData(
              dataTblName + "_in1000",
              gameDataList[i].userData[j]
            )
          );

          promiseList.push( // version data
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

async function Update(): Promise<void> {
  let startDtm: number;

  database.init();
  while(1) {
    // get Data
    gameDataList = [];
    keyIdx = 1 - keyIdx; // key swap
    let failedGameIdQueue: Queue<number> = await getGameData();
    failedGameId.push(...failedGameIdQueue.toArray());
    startDtm = Date.now();
    checkExecTime(startDtm, 300); // 최소 0.5초 보장

    //get failed Data
    startDtm = Date.now();
    keyIdx = 1 - keyIdx; // key swap
    await getFailedGameData();
    //save data
    await saveGameData();
    console.log("Recovered ALL: " + recoveredAll);
    if (lastGameFound) {
      console.log("next Start Id is : " + startId);
      lastGameFound = false;
      console.log("Succeed Game Id count: " + gameDataList.length);
      console.log("Failed All: " + failedAll );
      console.log("Recovered Game Id count: " + recoveredAll);
      break;
    }
    checkExecTime(startDtm, 300); // 최소 0.3초 보장
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
  await Update();
  await Create10DayTable();
  await create3DayTable();
  database.close();
  console.log("ALL TASK HAS ENDED!");
}

Task();

