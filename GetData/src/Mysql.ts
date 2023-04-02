import mysql2 from "mysql2/promise";
import { UserData } from "./UserData";
import { GameData } from "./GameData";

interface IMysql {
  init(): void;
  createDataTable(table: string): Promise<void>;
  createUserTable(table: string): Promise<void>;
  insertGameData(table: string, data: UserData): Promise<void>;
  insertUserData(table: string, userNum: number, mmrBefore: number, mmrGain: number): Promise<void>;
}

export class Mysql implements IMysql {
  Pool: mysql2.Pool;
  // create pool
  init(): void {
    this.Pool = mysql2.createPool({
      host: "localhost",
      user: "root",
      password: "wat331331",
      database: "userdata",
    });
    console.log("Pool has created");
  }

  close(): void {
    this.Pool.end();
  }

  async getCutline(table: string): Promise<number> {
    let result: number;
    const connection = await this.Pool.getConnection();
    const resultPacket = await connection.query(`SELECT * FROM 
    ( 
      SELECT mmr,ROW_NUMBER() over(order by mmr desc) as 'ranking'
      FROM ${table}
    ) ranked WHERE ranked.ranking = 1000;`);

    if(resultPacket[0][0] != undefined) {
      result = resultPacket[0][0]['mmr'];
    }
    else{
      result = 0 ;
    }
    
    connection.release();
    return result;
  }

  async getLatestVersion(table: string): Promise<string> {
    const connection = await this.Pool.getConnection();
    const resultPacket = await connection.query(`SELECT version FROM ${table} ORDER BY version DESC LIMIT 1;`);
    const result = resultPacket[0][0]['version'];
    connection.release();
    return result;
  }

  async saveVersion(table: string, version: string, startedAt: string): Promise<void> {
    const connection = await this.Pool.getConnection();
    await connection.query(`INSERT INTO \`${table}\` VALUES(\'${version}\', \'${startedAt}\', 0);
    `)
    connection.release();
  }

  async createUserTable(table: string): Promise<void> {
    const connection = await this.Pool.getConnection();
    await connection.query(`CREATE TABLE IF NOT EXISTS \`${table}\` (
        userNum INT NOT NULL,
        mmr INT,
        PRIMARY KEY(userNum)
    );`);
    connection.release();
  }

  async insertUserData(table: string, userNum: number, mmrAfter: number, mmrGain: number): Promise<void> {
    const connection = await this.Pool.getConnection();
    await connection.query(`INSERT INTO \`${table}\`(userNum, mmr)
        VALUES(${userNum}, ${mmrAfter})
        ON DUPLICATE KEY UPDATE
        mmr = mmr + ${mmrGain}
    ;`);
    connection.release();
  }
  // create table like "v0.66.0_2022-09-10_all"
  async createDataTable(table: string): Promise<void> {
    const connection = await this.Pool.getConnection();
    await connection.query(`CREATE TABLE IF NOT EXISTS \`${table}\`(
                characterNum INT NOT NULL DEFAULT 0, 
                bestWeapon INT NOT NULL DEFAULT 0, 
                traitFirstCore VARCHAR(255) NOT NULL DEFAULT "0", 
                top1 INT NOT NULL DEFAULT 0, 
                top3 INT NOT NULL DEFAULT 0, 
                top5 INT NOT NULL DEFAULT 0, 
                gameRank INT NOT NULL DEFAULT 0, 
                monsterKill INT NOT NULL DEFAULT 0, 
                playerKill INT NOT NULL DEFAULT 0, 
                mmrGain INT NOT NULL DEFAULT 0, 
                playTime INT NOT NULL DEFAULT 0, 
                omegaKilled INT NOT NULL DEFAULT 0,
                alphaKilled INT NOT NULL DEFAULT 0,
                wickelineKilled INT NOT NULL DEFAULT 0,
                gotMeteor INT NOT NULL DEFAULT 0,
                gotMeteorFlag INT NOT NULL DEFAULT 0,
                gotTreeOfLife INT NOT NULL DEFAULT 0,
                gotTreeOfLifeFlag INT NOT NULL DEFAULT 0,
                cnt INT NOT NULL DEFAULT 0,
                PRIMARY KEY(characterNum, bestWeapon, traitFirstCore)
            );`);
    connection.release();
  }

  async insertGameData(table: string, data: UserData): Promise<void> {
    const connection = await this.Pool.getConnection();
    await connection.query(`INSERT INTO \`${table}\`(characterNum, bestWeapon, traitFirstCore, top1, top3, top5, gameRank, monsterkill, playerKill, mmrGain, playTime, omegaKilled, alphaKilled, wickelineKilled, gotMeteor, gotMeteorFlag, gotTreeOfLife, gotTreeOfLifeFlag, cnt)
            VALUES(${data.characterNum}, ${data.bestWeapon},  ${data.traitFirstCore}, ${data.top1}, ${data.top3}, ${data.top5}, ${data.gameRank}, ${data.monsterKill}, ${data.playerKill}, ${data.mmrGain}, ${data.playTime}, ${data.omegaKilled}, ${data.alphaKilled}, ${data.wickelineKilled}, ${data.gotMeteor}, ${data.gotMeteorFlag}, ${data.gotTreeOfLife}, ${data.gotTreeOfLifeFlag}, 1)
            ON DUPLICATE KEY UPDATE
            top1 = top1 + ${data.top1},
            top3 = top3 + ${data.top3},
            top5 = top5 + ${data.top5},
            gameRank = gameRank + ${data.gameRank},
            monsterKill = monsterKill + ${data.monsterKill},
            playerKill = playerKill + ${data.playerKill},
            mmrGain = mmrGain + ${data.mmrGain},
            playTime = playTime + ${data.playTime},
            omegaKilled = omegaKilled + ${data.omegaKilled},
            alphaKilled = alphaKilled + ${data.alphaKilled},
            wickelineKilled = wickelineKilled + ${data.wickelineKilled},
            gotTreeOfLife = gotTreeOfLife + ${data.gotTreeOfLife},
            gotMeteor = gotMeteor + ${data.gotMeteor},
            gotMeteorFlag = gotMeteorFlag + ${data.gotMeteorFlag},
            gotTreeOfLifeFlag = gotTreeOfLifeFlag + ${data.gotTreeOfLifeFlag},
            cnt = cnt + 1
        ;`);
    connection.release();
  }

  async update3daysTable(table: string): Promise<void> {
    const connection = await this.Pool.getConnection();
    let result = await connection.query(`SELECT * FROM (select table_name from information_schema.tables where table_name like "%_all" and table_name like "%-%" order by table_name desc LIMIT 3) as a;`);
    console.log(result);
    connection.release;
  }

  async create10DaysTable(): Promise<void> {
    let row, cols, result: any, tblList;
    const tierList = [ "all" , "platinum+" , "diamond+", "demigod+" , "in1000" ];
    const connection = await this.Pool.getConnection();
    [ row, cols ] = await connection.query('SELECT version FROM versionlist where 10dayCreated = 0 order by version asc;');
    tblList = row;

    for(let i=0; i<tblList.length; i++) {
      for(let j=0; j<tierList.length; j++) {
        let tblName = tblList[i]['version'] + "_10days_" + tierList[j];
        [ row, cols ] = await connection.query(`select table_name from information_schema.tables where table_name like "${tblList[i]['version']}%" and table_name like "%-%" and table_name like "%_${tierList[j]}" order by table_name asc LIMIT 10;`);
        result = row;
    
        if(result.length >= 10) {
          await this.createDataTable(tblName)
          for(let i = 0; i < 10; i++) {
            await connection.query(`INSERT INTO \`${tblName}\`(characterNum, bestWeapon, traitFirstCore, top1, top3, top5, gameRank, monsterkill, playerKill, mmrGain, playTime, omegaKilled, alphaKilled, wickelineKilled, gotMeteor, gotMeteorFlag, gotTreeOfLife, gotTreeOfLifeFlag, cnt) 
                SELECT characterNum, bestWeapon, traitFirstCore, top1, top3, top5, gameRank, monsterkill, playerKill, mmrGain, playTime, omegaKilled, alphaKilled, wickelineKilled, gotMeteor, gotMeteorFlag, gotTreeOfLife, gotTreeOfLifeFlag, cnt FROM \`${result[i]['TABLE_NAME']}\`
                ON DUPLICATE KEY UPDATE
                \`${tblName}\`.top1 = \`${tblName}\`.top1 + \`${result[i]['TABLE_NAME']}\`.top1,
                \`${tblName}\`.top3 = \`${tblName}\`.top3 + \`${result[i]['TABLE_NAME']}\`.top3,
                \`${tblName}\`.top5 = \`${tblName}\`.top5 + \`${result[i]['TABLE_NAME']}\`.top5,
                \`${tblName}\`.gameRank = \`${tblName}\`.gameRank + \`${result[i]['TABLE_NAME']}\`.gameRank,
                \`${tblName}\`.monsterKill = \`${tblName}\`.monsterKill + \`${result[i]['TABLE_NAME']}\`.monsterKill,
                \`${tblName}\`.playerKill = \`${tblName}\`.playerKill + \`${result[i]['TABLE_NAME']}\`.playerKill,
                \`${tblName}\`.mmrGain = \`${tblName}\`.mmrGain + \`${result[i]['TABLE_NAME']}\`.mmrGain,
                \`${tblName}\`.playTime = \`${tblName}\`.playTime + \`${result[i]['TABLE_NAME']}\`.playTime,
                \`${tblName}\`.omegaKilled = \`${tblName}\`.omegaKilled + \`${result[i]['TABLE_NAME']}\`.omegaKilled,
                \`${tblName}\`.alphaKilled = \`${tblName}\`.alphaKilled + \`${result[i]['TABLE_NAME']}\`.alphaKilled,
                \`${tblName}\`.wickelineKilled = \`${tblName}\`.wickelineKilled + \`${result[i]['TABLE_NAME']}\`.wickelineKilled,
                \`${tblName}\`.gotTreeOfLife = \`${tblName}\`.gotTreeOfLife + \`${result[i]['TABLE_NAME']}\`.gotTreeOfLife,
                \`${tblName}\`.gotMeteor = \`${tblName}\`.gotMeteor + \`${result[i]['TABLE_NAME']}\`.gotMeteor,
                \`${tblName}\`.gotMeteorFlag = \`${tblName}\`.gotMeteorFlag + \`${result[i]['TABLE_NAME']}\`.gotMeteorFlag,
                \`${tblName}\`.gotTreeOfLifeFlag = \`${tblName}\`.gotTreeOfLifeFlag + \`${result[i]['TABLE_NAME']}\`.gotTreeOfLifeFlag,
                \`${tblName}\`.cnt = \`${tblName}\`.cnt + \`${result[i]['TABLE_NAME']}\`.cnt;
            `)
          }
  
          await connection.query(`update versionlist set 10dayCreated = 1 where version = "${tblList[i]['version']}"`);
          console.log(tblList[i]['version'] + " " + tierList[j] +" DONE");
        }
      }
    }
    connection.release;
  }

  async create3DaysTable(): Promise<void> {
    let row, cols, result: any, tblName;
    const tierList = [ "all" , "platinum+" , "diamond+", "demigod+" , "in1000" ];
    const connection = await this.Pool.getConnection();
    for(let i=0; i<tierList.length; i++) {
      tblName =  "latest_3days_" + tierList[i];
      [ row, cols ] = await connection.query(`select table_name from information_schema.tables where table_name like "%-%" and table_name like "%${tierList[i]}" order by table_name desc LIMIT 3;`);
      result = row;
      await connection.query(`DROP TABLE IF EXISTS \`${tblName}\``); // delete to create new
      await this.createDataTable(tblName);

      for(let j=0; j<result.length; j++) {
        await connection.query(`INSERT INTO \`${tblName}\` (characterNum, bestWeapon, traitFirstCore, top1, top3, top5, gameRank, monsterkill, playerKill, mmrGain, playTime, omegaKilled, alphaKilled, wickelineKilled, gotMeteor, gotMeteorFlag, gotTreeOfLife, gotTreeOfLifeFlag, cnt)
        SELECT characterNum, bestWeapon, traitFirstCore, top1, top3, top5, gameRank, monsterkill, playerKill, mmrGain, playTime, omegaKilled, alphaKilled, wickelineKilled, gotMeteor, gotMeteorFlag, gotTreeOfLife, gotTreeOfLifeFlag, cnt FROM \`${result[j]['TABLE_NAME']}\`
        ON DUPLICATE KEY UPDATE
        \`${tblName}\`.top1 = \`${tblName}\`.top1 + \`${result[j]['TABLE_NAME']}\`.top1,
        \`${tblName}\`.top3 = \`${tblName}\`.top3 + \`${result[j]['TABLE_NAME']}\`.top3,
        \`${tblName}\`.top5 = \`${tblName}\`.top5 + \`${result[j]['TABLE_NAME']}\`.top5,
        \`${tblName}\`.gameRank = \`${tblName}\`.gameRank + \`${result[j]['TABLE_NAME']}\`.gameRank,
        \`${tblName}\`.monsterKill = \`${tblName}\`.monsterKill + \`${result[j]['TABLE_NAME']}\`.monsterKill,
        \`${tblName}\`.playerKill = \`${tblName}\`.playerKill + \`${result[j]['TABLE_NAME']}\`.playerKill,
        \`${tblName}\`.mmrGain = \`${tblName}\`.mmrGain + \`${result[j]['TABLE_NAME']}\`.mmrGain,
        \`${tblName}\`.playTime = \`${tblName}\`.playTime + \`${result[j]['TABLE_NAME']}\`.playTime,
        \`${tblName}\`.omegaKilled = \`${tblName}\`.omegaKilled + \`${result[j]['TABLE_NAME']}\`.omegaKilled,
        \`${tblName}\`.alphaKilled = \`${tblName}\`.alphaKilled + \`${result[j]['TABLE_NAME']}\`.alphaKilled,
        \`${tblName}\`.wickelineKilled = \`${tblName}\`.wickelineKilled + \`${result[j]['TABLE_NAME']}\`.wickelineKilled,
        \`${tblName}\`.gotTreeOfLife = \`${tblName}\`.gotTreeOfLife + \`${result[j]['TABLE_NAME']}\`.gotTreeOfLife,
        \`${tblName}\`.gotMeteor = \`${tblName}\`.gotMeteor + \`${result[j]['TABLE_NAME']}\`.gotMeteor,
        \`${tblName}\`.gotMeteorFlag = \`${tblName}\`.gotMeteorFlag + \`${result[j]['TABLE_NAME']}\`.gotMeteorFlag,
        \`${tblName}\`.gotTreeOfLifeFlag = \`${tblName}\`.gotTreeOfLifeFlag + \`${result[j]['TABLE_NAME']}\`.gotTreeOfLifeFlag,
        \`${tblName}\`.cnt = \`${tblName}\`.cnt + \`${result[j]['TABLE_NAME']}\`.cnt;
        `)
        console.log("used " + result[j]['TABLE_NAME']);
      }
      console.log(tblName);
    }
    connection.release;
  }
}
