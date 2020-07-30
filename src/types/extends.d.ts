interface Array<T> {
  /**
   * 查找元素在数组中的索引
   * @param predicateFn 
   * @param thisArg 
   */
  findIndex(predicateFn: (item: T, index?: number, arr?: T[]) => boolean, thisArg?: any): number;
  /**
   * 删除数组中的元素
   * @param item 元素 或 元素索引
   */
  remove(item: T | Number): boolean;
  /**
   * 查找数组中是否存在某一元素
   * @param item 元素
   */
  contains(item: T) : boolean;
}
interface Date {
  /**
   * 格式化日期
   * @param formatStr 格式化字符串 支持 YYYY-MM-DD HH:ii:ss
   */
  format(formatStr?: String);

  toGMTString() : string;
}

interface String {
   /**
   * 查找字符串中是包含另一个字符串
   * @param item 字符串
   */
  contains(str: String) : boolean;
}