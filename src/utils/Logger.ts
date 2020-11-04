export class Logger {
  public logLevel = "info";

  public error(msg) {
    if (this.shouldLog('error'))
      console.error(msg)
  }
  public info(msg) {
    if (this.shouldLog('info'))
      console.info(msg)
  }
  public log(msg) {
    if (this.shouldLog('info'))
      console.log(msg)
  }
  public warning(msg) {
    if (this.shouldLog('warning'))
      console.warn(msg)
  }
  public exception(msg : string, e) {
    if (this.shouldLog('error'))
      console.exception(msg +  ' ' + this.formatError(e))
  }

  formatError(err) {
    var message = err.message;
    var stack = err.stack;
    if (!stack) {
      return message;
    } else if (stack.indexOf(message) < 0) {
      return message + "\n" + stack;
    } else {
      return stack;
    }
  }
  shouldLog(level) {
    var shouldLog =
      (this.logLevel === "info" && level === "info") ||
      (["info", "warning"].indexOf(this.logLevel) >= 0 && level === "warning") ||
      (["info", "warning", "error"].indexOf(this.logLevel) >= 0 && level === "error");
    return shouldLog;
  }
}

let logger = new Logger();

export default logger;