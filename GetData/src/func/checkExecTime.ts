export function checkExecTime(startDtm, ms) {
    while(1) {
        const endDtm = Date.now();
        if(endDtm > startDtm + ms) break;
      }
}