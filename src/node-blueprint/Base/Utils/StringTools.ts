/**
 * 数字补0，如果数字转为字符串后不足 `n` 位，则在它前面加 `0`
 * @param num 数字
 * @param n 指定字符串位数
 * @returns 字符串
 */
function pad(num: number|string, n: number) : string {
  let str = typeof num === 'number' ? num.toString() : num;
  let len = str.length;
  while (len < n) {
    str = "0" + str;
    len++;
  }
  return str;
}

/**
 * 对数字进行千位逗号分隔
 * @param x 要操作的数字
 * @returns 返回字符串
 */
function numberWithCommas(x: number|string) {
  x = x.toString();
  const pattern = /(-?\d+)(\d{3})/;
  while (pattern.test(x))
    x = x.replace(pattern, "$1,$2");
  return x;
}

/**
 * 将字符串转为16进制字符串
 * @param str 字符串
 */
function strToHexCharCode(str : string, with0x = true) : string {
  if(str === "")
    return "";
  const hexCharCode = [];
  if(with0x) hexCharCode.push("0x"); 
  for(let i = 0; i < str.length; i++) 
    hexCharCode.push((str.charCodeAt(i)).toString(16));
  return hexCharCode.join("");
}

export default {
  pad,
  numberWithCommas,
  strToHexCharCode,
};
