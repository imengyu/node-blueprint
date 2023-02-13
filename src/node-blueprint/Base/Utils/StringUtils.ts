const StringUtils = {
  /**
   * 字符串判空
   * @param str 字符串
   */
  isNullOrEmpty(str : string | undefined | null | Record<string, unknown>| number) : boolean {
    return !str || typeof str === 'undefined' || str === ''
  },
  /**
   * 字符串判空
   * @param str 字符串
   */
  isNullOrBlank(str : string | undefined | null) : boolean {
    if(!str || typeof str === 'undefined' || str === '')
      return true;
    if(str === '\n')
      return true;
    return /^[ ]+$/.test(str as string);
  },
  isBase64,
  isNumber,
  isInteger,
  isChinaPoneNumber,
  isEmail,
  strToHexCharCode,
  pad,
  formatNumberWithComma,
  getFileName(path : string) : string {
    let pos = path.lastIndexOf('/');
    if(pos < 0) pos = path.lastIndexOf('\\');
    return path.substring(pos + 1);  
  }
}

export default StringUtils;

/**
* 判断字符串是否是 Base64 编码
* @param {String} str 
*/
function isBase64(str : string) : boolean {
  return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(str);
}
/**
 * 检测字符串是否是一串数字
 * @param {String} val 
 */
function isNumber(val : string) : boolean {
  const regPos = /^\d+(\.\d+)?$/; //非负浮点数
  const regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
  if (regPos.test(val) || regNeg.test(val)) {
    return true;
  } else {
    return false;
  }
}
/**
 * 检测字符串是否是整数
 * @param {String} val 
 */
 function isInteger(val : string) : boolean {
  return /^-?[0-9]\d*$/.test(val);
}
/**
 * 检查字符串是否是中国的11位手机号
 * @param str 字符串
 */
function isChinaPoneNumber(str : string) : boolean {
  if (!/^[1][3,4,5,7,8][0-9]{9}$/.test(str)) {
      return false;
  } else {
      return true;
  }
}
/**
 * 检查字符串是否是邮箱
 * @param str 字符串
 */
function isEmail(str : string) : boolean {
  if (/^\w+((-\w+)|(\.\w+))*@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/.test(str) !== true) {
    return false;
  }else{
    return true;
  }
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
/**
 * 数字补0
 * @param num 数字
 * @param n 如果数字不足n位，则自动补0
 */
function pad(num : number, n : number) : string {
  let strNum = num.toString();
  let len = strNum.length;
  while (len < n) {
    strNum = "0" + strNum;
    len++;
  }
  return strNum;
}
/**
 * 按千位逗号分割
 * @param s 需要格式化的数值.
 * @param type 判断格式化后是否需要小数位.
 */
function formatNumberWithComma(s : string, addComma : boolean) : string {
  if (/[^0-9]/.test(s))
      return "0";
  if (s === null || s === "")
      return "0";
  s = s.toString().replace(/^(\d*)$/, "$1.");
  s = (s + "00").replace(/(\d*\.\d\d)\d*/, "$1");
  s = s.replace(".", ",");
  const re = /(\d)(\d{3},)/;
  while (re.test(s))
      s = s.replace(re, "$1,$2");
  s = s.replace(/,(\d\d)$/, ".$1");
  if (!addComma) { // 不带小数位(默认是有小数位)
      const a = s.split(".");
      if (a[1] === "00") {
          s = a[0];
      }
  }
  return s;
}