import { BlockRegData } from "./BlockDef";

/**
 * 单元包的定义
 */
export interface PackageDef {
  /**
   * 注册回调函数，请在这个函数中返回所有单元的注册信息，相同将会进行注册。
   */
  register: () => BlockRegData[],
  /**
   * 包名
   */
  packageName: string,
  /**
   * 版本
   */
  version: number,
}