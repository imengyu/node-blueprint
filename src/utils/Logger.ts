export type LogLevel = 'info'|'warning'|'error'|'unknow'

export class Logger {
  public logLevel : LogLevel = "info";

  public error(msg : any) {
    if (this.shouldLog('error'))
      console.error(msg)
  }
  public info(msg : any) {
    if (this.shouldLog('info'))
      console.info(msg)
  }
  public log(msg : any) {
    if (this.shouldLog('info'))
      console.log(msg)
  }
  public warning(msg : any) {
    if (this.shouldLog('warning'))
      console.warn(msg)
  }
  public exception(msg : string, e : Error) {
    if (this.shouldLog('error'))
      console.exception(msg +  ' ' + this.formatError(e))
  }

  formatError(err : Error) {
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
  shouldLog(level : LogLevel) {
    var shouldLog =
      (this.logLevel === "info" && level === "info") ||
      (["info", "warning"].indexOf(this.logLevel) >= 0 && level === "warning") ||
      (["info", "warning", "error"].indexOf(this.logLevel) >= 0 && level === "error");
    return shouldLog;
  }
}

let logger = new Logger();

export default logger;