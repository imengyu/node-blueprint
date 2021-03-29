import { Block } from "@/model/Define/Block";
import { BlockPort } from "@/model/Define/Port";

export type LogLevel = 'log'|'info'|'warning'|'error'|'unknow'
export type LogListener = (tag : string, level : LogLevel, content : string, extendObj ?: object) => void;

export class Logger {
  public logLevel : LogLevel = "info";

  public error(tag : string, msg : string, extendObj ?: object) {
    if (this.shouldLog('error'))
      console.error(`[${tag}] ${msg}`)
    this.callListener(tag, 'error', msg, extendObj);
  }
  public info(tag : string, msg : string, extendObj ?: object) {
    if (this.shouldLog('info'))
      console.info(`[${tag}] ${msg}`)
    this.callListener(tag, 'info', msg, extendObj);
  }
  public log(tag : string, msg : string, extendObj ?: object) {
    if (this.shouldLog('log'))
      console.log(`[${tag}] ${msg}`)
    this.callListener(tag, 'log', msg, extendObj);
  }
  public warning(tag : string, msg : string, extendObj ?: object) {
    if (this.shouldLog('warning'))
      console.warn(`[${tag}] ${msg}`)
    this.callListener(tag, 'warning', msg, extendObj);
  }
  public exception(tag : string, msg : string, e : Error, extendObj ?: object) {
    if (this.shouldLog('error'))
      console.error(`[${tag}] ${msg} ${this.formatError(e)}`)
    this.callListener(tag, 'error', msg, extendObj);
  }

  private formatError(err : Error) {
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
  private shouldLog(level : LogLevel) {
    var shouldLog =
      (this.logLevel === "info" && level === "info") ||
      (["info", "warning"].indexOf(this.logLevel) >= 0 && level === "warning") ||
      (["info", "warning", "error"].indexOf(this.logLevel) >= 0 && level === "error");
    return shouldLog;
  }

  private listeners : LogListener[] = [];
  private logTempary : { tag: string, level: LogLevel, content: string, extendObj?: Object }[] = [];

  public addListener(listener : LogListener) { this.listeners.push(listener); }
  public removeListener(listener : LogListener) { this.listeners.remove(listener); }
  public callListener(tag: string, level: LogLevel, content: string, extendObj?: object) {
    if(this.listeners.length === 0) this.logTempary.push({ tag, level, content, extendObj });
    else this.listeners.forEach((c) => c(tag, level, content, extendObj))
  }

  /**
   * 重新发送未发送的日志条目
   */
  public reSendTemparyLogs() {
    this.listeners.forEach((c) => {
      this.logTempary.forEach(({ tag, level, content, extendObj }) => c(tag, level, content, extendObj));
    })
  }

  public makeSrcPort(port : BlockPort) {
    return {
      srcPort: port,
      srcBlock: port.parent
    }
  }
  public makeSrcBlock(block : Block) {
    return {
      srcPort: null as null,
      srcBlock: block
    }
  }
}

let logger = new Logger();

export default logger;