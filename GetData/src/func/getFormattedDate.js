"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattedDate = void 0;
function getFormattedDate(startDtm) {
    let date = new Date(startDtm);
    date.setUTCHours(date.getUTCHours() + 9); // gmt로 변환
    let year = date.getUTCFullYear().toString();
    let month = date.getUTCMonth() + 1 <= 9
        ? "0" + (date.getUTCMonth() + 1).toString()
        : (date.getUTCMonth() + 1).toString();
    let day = date.getUTCDate() <= 9
        ? "0" + date.getUTCDate().toString()
        : date.getUTCDate().toString();
    let dateFormat = year + "-" + month + "-" + day;
    return dateFormat;
}
exports.getFormattedDate = getFormattedDate;
