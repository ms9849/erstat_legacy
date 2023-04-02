export function getFormattedDate(): string {
    const date: Date = new Date();
    const year: string = date.getFullYear().toString();
    const month: string =
        date.getMonth() + 1 <= 9
            ? '0' + (date.getMonth() + 1).toString()
            : (date.getMonth() + 1).toString();
    const day: string =
        date.getDate() <= 9
            ? '0' + date.getDate().toString()
            : date.getDate().toString();
    const formatted: string = year + '-' + month + '-' + day;

    return formatted;
}
