export function getFormattedDate(startDtm: Date): string {
  let date: Date = new Date(startDtm);
  date.setUTCHours(date.getUTCHours() + 9); // gmt로 변환

  let year: string = date.getUTCFullYear().toString();

  let month: string =
    date.getUTCMonth() + 1 <= 9
      ? "0" + (date.getUTCMonth() + 1).toString()
      : (date.getUTCMonth() + 1).toString();

  let day: string =
    date.getUTCDate() <= 9
      ? "0" + date.getUTCDate().toString()
      : date.getUTCDate().toString();

  let dateFormat: string = year + "-" + month + "-" + day;

  return dateFormat;
}
