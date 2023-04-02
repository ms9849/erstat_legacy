import { UserData } from "./UserData";

interface IGameData {}

export class GameData implements IGameData {
  code: number;
  message: string;
  gameId: number;
  matchingMode: number;
  matchingTeamMode: number;
  seasonId: number;
  startDtm: Date;
  userData: UserData[];

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
        this.userData.push(new UserData(gameData.userGames[i]));
      }
    } else {
      this.code = gameData.code;
      this.message = gameData.message;
    }
  }
}
