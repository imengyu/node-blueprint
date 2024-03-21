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
export function createMiniTimer(interval: number, cb: () => void) {
  let timerId = 0;

  return {
    start() {
      if (timerId > 0)
        clearInterval(timerId);
      timerId = setInterval(() => {
        timerId = 0;
        cb();
      }, interval);
    },
    stop() {
      if (timerId > 0) {
        clearInterval(timerId);
        timerId = 0;
      }
    },
  }
}