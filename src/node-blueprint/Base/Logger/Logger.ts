import ArrayUtils from '../Utils/ArrayUtils';

export type LogTraceData = {
  [index: string]: any;
};

export type LogContentType = string|number|boolean|object|unknown;
export type LogLevel = 'log'|'info'|'warning'|'error'|'unknow'
export type LogListener = (tag : string, level : LogLevel, trace: LogTraceData|null, ...content : LogContentType[]) => void;

const LogLevels : LogLevel[] = ["error", "warning", "info", "log" ];

/**
 * 日志监听器
 */
export class Logger {
  public logLevel : LogLevel = 'log';
  public logList : { tag: string, level: LogLevel, content: LogContentType[], trace: LogTraceData|null }[] = [];
  
  public error(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
    if (this.shouldLog('error'))
      this.callListener(tag, 'error', trace, ...content);
  }
  public info(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
    if (this.shouldLog('info'))
      this.callListener(tag, 'info', trace, ...content);
  }
  public log(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
    if (this.shouldLog('log'))
      this.callListener(tag, 'log', trace, ...content);
  }
  public warning(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
    if (this.shouldLog('warning'))
      this.callListener(tag, 'warning', trace, ...content);
  }
  public exception(tag : string, trace: LogTraceData|null, e: Error, ...content : LogContentType[]) : void {
    if (this.shouldLog('error'))
      this.callListener(tag, 'error', trace, ...content, this.formatError(e));
  }

  public formatContent(trace: LogTraceData|null, ...content : LogContentType[]) {
    return content.join(" ") + ` \nTrace: ${trace}`
  }
  public formatError(err : Error) {
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
  public shouldLog(level : LogLevel) {
    return LogLevels.indexOf(this.logLevel) >= LogLevels.indexOf(level);
  }

  private listeners : LogListener[] = [];

  public addListener(listener : LogListener) : void { this.listeners.push(listener); }
  public removeListener(listener : LogListener)  : void{ ArrayUtils.remove(this.listeners, listener); }
  public callListener(tag: string, level: LogLevel, trace: LogTraceData|null, ...content : LogContentType[]) : void {
    this.logList.push({ tag, level, content, trace });
    this.listeners.forEach((c) => c(tag, level, trace, ...content));
    if (this.logList.length > 256)
      this.logList.splice(0, 1);
  }

  /**
   * 重新发送未发送的日志条目
   */
  public reSendLogs() : void {
    this.listeners.forEach((c) => {
      this.logList.forEach(({ tag, level, content, trace }) => c(tag, level, trace, ...content));
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