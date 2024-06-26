import StringUtils from "./StringUtils";
import type { IObject } from "./BaseTypes";

/**
 * 设置工具类
 */
const SettingsUtils = {
  /**
   * 读取设置，如果没有找到设置，则返回默认值
   * @param key 设置的键值
   * @param defaultValue 设置的默认值
   */
  getSettings<T extends IObject|bigint|number|boolean|Array<unknown>|string>(key : string, defaultValue : T) : T {
    const set = localStorage.getItem(`Settings${key}`);
    if(!set || StringUtils.isNullOrEmpty(set))
      return defaultValue;
    return JSON.parse(set) as T;
  },
  /**
   * 设置设置
   * @param key 设置的键值
   * @param value 设置的新值
   */
  setSettings(key : string, value : IObject|number|boolean|bigint|Array<unknown>|string|null) : void {
    localStorage.setItem(`Settings${key}`, JSON.stringify(value));
  },
}

export default SettingsUtils;