
export type IKeyAnyObject = Record<string, unknown>;

export default {
  getTop,
  getLeft,
  /**
   * 字符串判空
   * @param str 字符串
   */
  isNullOrEmpty(str : string | undefined | null | Record<string, unknown>| number) : boolean {
    return !str || typeof str === 'undefined' || str === ''
  },
  /**
   * 如果参数未定义，则返回默认值，否则返回这个参数
   * @param v 要判断的数值
   * @param drfaultValue 默认值
   */
  defaultIfUndefined<T>(v : undefined|null|T, drfaultValue: T) : T {
    return (v !== null && typeof v !== 'undefined') ? v : drfaultValue;
  },
  /**
   * 生成不重复随机字符串
   * @param randomLength 字符长度
   */
  genNonDuplicateID(randomLength : number) : string {
    let idStr = Date.now().toString(36)
    idStr += Math.random().toString(36).substr(3,randomLength)
    return idStr
  },
};

/**
 * 获取元素的绝对纵坐标
 * @param e 元素
 * @param stopClass 递归向上查找，遇到指定类的父级时停止
 */
function getTop(e: HTMLElement, stopClass ? : string) : number {
  let offset = e.offsetTop;
  if (e.offsetParent !== null && (!stopClass || !(<HTMLElement>e.offsetParent).classList.contains(stopClass)) )
    offset += getTop(<HTMLElement>e.offsetParent, stopClass);
  return offset;
}
/**
 * 获取元素的绝对横坐标
 * @param e 元素
 * @param stopClass 递归向上查找，遇到指定类的父级时停止
 */
function getLeft(e: HTMLElement, stopClass ? : string) : number {
  let offset = e.offsetLeft;
  if (e.offsetParent !== null && (!stopClass || !(<HTMLElement>e.offsetParent).classList.contains(stopClass))) 
    offset += getLeft(<HTMLElement>e.offsetParent, stopClass);
    
  return offset;
}