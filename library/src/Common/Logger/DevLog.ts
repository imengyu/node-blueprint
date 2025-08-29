import logger, { type LogContentType, type LogTraceData } from "./Logger";

export function printError(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  logger.error(tag, trace, ...content);
  devError(tag, trace, ...content);
}
export function printInfo(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  logger.info(tag, trace, ...content);
  devInfo(tag, trace, ...content);
}
export function printLog(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  logger.log(tag, trace, ...content);
  devLog(tag, trace, ...content);
}
export function printWarning(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  logger.warning(tag, trace, ...content);
  devWarning(tag, trace, ...content);
}

export function devError(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  console.error(`[${tag}] ${logger.formatContent(trace, content)}`);
}
export function devInfo(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  console.info(`[${tag}] ${logger.formatContent(trace, content)}`);
}
export function devLog(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  console.log(`[${tag}] ${logger.formatContent(trace, content)}`);
}
export function devWarning(tag : string, trace: LogTraceData|null, ...content : LogContentType[]) : void {
  console.warn(`[${tag}] ${logger.formatContent(trace, content)}`);
}