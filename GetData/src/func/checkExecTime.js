"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkExecTime = void 0;
function checkExecTime(startDtm, ms) {
    while (1) {
        const endDtm = Date.now();
        if (endDtm > startDtm + ms)
            break;
    }
}
exports.checkExecTime = checkExecTime;
