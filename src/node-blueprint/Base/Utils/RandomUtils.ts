import StringUtils from "./StringTools";

let idPool = 0;

export default {
  /**
   * 生成指定范围之内的随机数
   * @param minNum 最小值
   * @param maxNum 最大值
   */
  genRandom(minNum : number, maxNum : number) : number {
    return Math.floor(Math.random()*(maxNum-minNum+1)+minNum); 
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
  /**
   * 生成不重复数字
   */
  genNonDuplicateNumber() : number {
    if(idPool < Number.MAX_VALUE)
      return ++idPool;
    return 0;
  },
  /**
   * 生成不重复随机字符串
   * @param randomLength 字符长度
   */
  genNonDuplicateIDHEX(randomLength : number) : string {
    const idStr = this.genNonDuplicateID(randomLength);
    return StringUtils.strToHexCharCode(idStr, false).substr(idStr.length - randomLength, randomLength);
  },
}