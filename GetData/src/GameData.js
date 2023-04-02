"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.GameData = void 0;
const UserData_1 = require("./UserData");
class GameData {
    constructor(gameData) {
        if (gameData.code === 200) {
            this.userData = [];
            this.code = gameData.code;
            this.message = gameData.message;
            this.gameId = gameData.userGames[0].gameId;
            this.startDtm = new Date(gameData.userGames[0].startDtm);
            this.matchingMode = gameData.userGames[0].matchingMode;
            this.matchingTeamMode = gameData.userGames[0].matchingTeamMode;
            this.seasonId = gameData.userGames[0].seasonId;
            for (let i in gameData.userGames) {
                this.userData.push(new UserData_1.UserData(gameData.userGames[i]));
            }
        }
        else {
            this.code = gameData.code;
            this.message = gameData.message;
        }
    }
}
exports.GameData = GameData;
