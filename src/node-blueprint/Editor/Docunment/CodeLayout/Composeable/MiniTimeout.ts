export function createMiniTimeOut(interval: number, cb: () => void) {
  let timeOut = 0;

  return {
    start() {
      if (timeOut > 0)
        clearTimeout(timeOut);
      timeOut = setTimeout(() => {
        timeOut = 0;
        cb();
      }, interval);
    },
    stop() {
      if (timeOut > 0) {
        clearTimeout(timeOut);
        timeOut = 0;
      }
    },
  }
}