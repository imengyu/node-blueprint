import ArrayUtils from '../Utils/ArrayUtils';

export type LogExtendData = {
  [index: string]: any;
};

export type LogLevel = 'log'|'info'|'warning'|'error'|'unknow'
export type LogListener = (tag : string, level : LogLevel, content : string|number|boolean|unknown, extendObj ?: LogExtendData) => void;

export class Logger {
  public logLevel : LogLevel = 'log';
  public logList : { tag: string, level: LogLevel, content: string|number|boolean|unknown, extendObj?: LogExtendData }[] = [];
  
  public error(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
    if (this.shouldLog('error'))
      console.error(`[${tag}] ${msg}`)
    this.callListener(tag, 'error', msg, extendObj);
  }
  public info(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
    if (this.shouldLog('info'))
      console.info(`[${tag}] ${msg}`)
    this.callListener(tag, 'info', msg, extendObj);
  }
  public log(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
    if (this.shouldLog('log'))
      console.log(`[${tag}] ${msg}`)
    this.callListener(tag, 'log', msg, extendObj);
  }
  public warning(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
    if (this.shouldLog('warning'))
      console.warn(`[${tag}] ${msg}`)
    this.callListener(tag, 'warning', msg, extendObj);
  }
  public exception(tag : string, msg : string|number|boolean|unknown, e : Error, extendObj ?: LogExtendData) : void {
    if (this.shouldLog('error'))
      console.error(`[${tag}] ${msg} ${this.formatError(e)}`)
    this.callListener(tag, 'error', msg, extendObj);
  }

  private formatError(err : Error) {
    const message = err.message;
    const stack = err.stack;
    if (!stack) {
      return message;
    } else if (stack.indexOf(message) < 0) {
      return message + "\n" + stack;
    } else {
      return stack;
    }
  }
  private shouldLog(level : LogLevel) {
    const shouldLog =
      (this.logLevel === "info" && level === "info") ||
      (["info", "warning"].indexOf(this.logLevel) >= 0 && level === "warning") ||
      (["info", "warning", "error"].indexOf(this.logLevel) >= 0 && level === "error");
    return shouldLog;
  }

  private listeners : LogListener[] = [];

  public addListener(listener : LogListener) : void { this.listeners.push(listener); }
  public removeListener(listener : LogListener)  : void{ ArrayUtils.remove(this.listeners, listener); }
  public callListener(tag: string, level: LogLevel, content: string|number|boolean|unknown, extendObj?: LogExtendData) : void {
    this.logList.push({ tag, level, content, extendObj });
    this.listeners.forEach((c) => c(tag, level, content, extendObj));
    if (this.logList.length > 256)
      this.logList.splice(0, 1);
  }

  /**
   * 重新发送未发送的日志条目
   */
  public reSendLogs() : void {
    this.listeners.forEach((c) => {
      this.logList.forEach(({ tag, level, content, extendObj }) => c(tag, level, content, extendObj));
    })
  }
  /**
   * 重新发送未发送的日志条目
   */
  public clear() : void {
    ArrayUtils.clear(this.logList);
  }
}

const logger = new Logger();

export default logger;