"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getFormattedDate = void 0;
function getFormattedDate() {
    const date = new Date();
    const year = date.getFullYear().toString();
    const month = date.getMonth() + 1 <= 9
        ? '0' + (date.getMonth() + 1).toString()
        : (date.getMonth() + 1).toString();
    const day = date.getDate() <= 9
        ? '0' + date.getDate().toString()
        : date.getDate().toString();
    const formatted = year + '-' + month + '-' + day;
    return formatted;
}
exports.getFormattedDate = getFormattedDate;
