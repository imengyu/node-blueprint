export default { 
  /**
   * 限制指定数字位指定的范围 `[min, max]`
   * @param val 指定数字
   * @param min 最小值
   * @param max 最大值
   * @returns 
   */
  limitNumber(val : number, min: number, max: number) : number {
    return Math.min(Math.max(val, min), max);
  },
  /**
   * 数字保留n位小数
   * @param num 数字
   * @param n 保留小数位数 
   */
  fixedNumber(num: number, n: number) : number {
    return n > 0 ? parseFloat(num.toFixed(n)) : Math.round(num);
  },
}