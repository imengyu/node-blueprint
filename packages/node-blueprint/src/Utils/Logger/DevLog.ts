import logger, { LogExtendData } from "./Logger";

export function printError(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
  logger.error(tag, msg, extendObj);
  devError(tag, msg, extendObj);
}
export function printInfo(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
  logger.info(tag, msg, extendObj);
  devInfo(tag, msg, extendObj);
}
export function printlog(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
  logger.log(tag, msg, extendObj);
  devLog(tag, msg, extendObj);
}
export function printWarning(tag : string, msg : string|number|boolean|unknown, extendObj ?: LogExtendData) : void {
  logger.warning(tag, msg, extendObj);
  devWarning(tag, msg, extendObj);
}

export function devError(tag : string, msg : string|number|boolean|unknown, _extendObj ?: LogExtendData) : void {
  console.error(`[${tag}] ${msg}`);
}
export function devInfo(tag : string, msg : string|number|boolean|unknown, _extendObj ?: LogExtendData) : void {
  console.info(`[${tag}] ${msg}`);
}
export function devLog(tag : string, msg : string|number|boolean|unknown, _extendObj ?: LogExtendData) : void {
  console.log(`[${tag}] ${msg}`);
}
export function devWarning(tag : string, msg : string|number|boolean|unknown, _extendObj ?: LogExtendData) : void {
  console.warn(`[${tag}] ${msg}`);
}