"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.UserData = void 0;
class UserData {
    constructor(userData) {
        this.userNum = userData.userNum;
        this.versionMajor = userData.versionMajor;
        this.versionMinor = userData.versionMinor;
        this.characterNum = userData.characterNum;
        this.bestWeapon = userData.bestWeapon;
        this.gameRank = userData.gameRank;
        this.playerKill = userData.playerKill;
        this.monsterKill = userData.monsterKill;
        this.mmrBefore = userData.mmrBefore;
        this.mmrGain = userData.mmrGain;
        this.mmrAfter = userData.mmrAfter;
        this.traitFirstCore = String(userData.traitFirstCore);
        this.playTime = userData.playTime;
        this.omegaKilled = userData.killMonsters.hasOwnProperty("9") ? 1 : 0;
        this.alphaKilled = userData.killMonsters.hasOwnProperty("8") ? 1 : 0;
        this.wickelineKilled = userData.killMonsters.hasOwnProperty("7") ? 1 : 0;
        this.gotMeteor = userData.collectItemForLog[4];
        this.gotTreeOfLife = userData.collectItemForLog[5];
        this.gotMeteorFlag = userData.collectItemForLog[4] > 0 ? 1 : 0;
        this.gotTreeOfLifeFlag = userData.collectItemForLog[5] > 0 ? 1 : 0;
        if (userData.gameRank === 1) {
            this.top1 = 1;
            this.top3 = this.top5 = 0;
        }
        else if (userData.gameRank <= 3) {
            this.top3 = 1;
            this.top1 = this.top5 = 0;
        }
        else if (userData.gameRank <= 5) {
            this.top5 = 1;
            this.top1 = this.top3 = 0;
        }
        else {
            this.top1 = this.top3 = this.top5 = 0;
        }
    }
}
exports.UserData = UserData;
