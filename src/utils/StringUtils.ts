export default {
  /**
   * 字符串判空
   * @param str 字符串
   */
  isNullOrEmpty(str){
    return !str || typeof str == 'undefined' || str == ''
  },
  isBase64,
  isNumber,
  isChinaPoneNumber,
  isEmail,
  strToHexCharCode,
  /**
   * 将一个变量转为字符串
   * @param val 变量
   */
  valueToStr(val) {
    if(typeof val == 'string') 
      return '"' + val + '"';
    return String(val)
  },
  pad,
  formatNumberWithComma,
  getFileName(path : string) {
    var pos = path.lastIndexOf('/');
    if(pos < 0) pos = path.lastIndexOf('\\');
    return path.substring(pos + 1);  
  }
}
/**
* 判断字符串是否是 Base64 编码
* @param {String} str 
*/
function isBase64(str) {
  return /^([A-Za-z0-9+/]{4})*([A-Za-z0-9+/]{4}|[A-Za-z0-9+/]{3}=|[A-Za-z0-9+/]{2}==)$/.test(str);
}
/**
 * 检测字符串是否是一串数字
 * @param {String} val 
 */
function isNumber(val) {
  var regPos = /^\d+(\.\d+)?$/; //非负浮点数
  var regNeg = /^(-(([0-9]+\.[0-9]*[1-9][0-9]*)|([0-9]*[1-9][0-9]*\.[0-9]+)|([0-9]*[1-9][0-9]*)))$/; //负浮点数
  if (regPos.test(val) || regNeg.test(val)) {
    return true;
  } else {
    return false;
  }
}
/**
 * 检查字符串是否是中国的11位手机号
 * @param str 字符串
 */
function isChinaPoneNumber(str : string) {
  var myreg=/^[1][3,4,5,7,8][0-9]{9}$/;
  if (!myreg.test(str)) {
      return false;
  } else {
      return true;
  }
}
/**
 * 检查字符串是否是邮箱
 * @param str 字符串
 */
function isEmail(str : string){
  var re=/^\w+((-\w+)|(\.\w+))*\@[A-Za-z0-9]+((\.|-)[A-Za-z0-9]+)*\.[A-Za-z0-9]+$/;
  if (re.test(str) != true) {
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
  var hexCharCode = [];
  if(with0x) hexCharCode.push("0x"); 
  for(var i = 0; i < str.length; i++) {
    hexCharCode.push((str.charCodeAt(i)).toString(16));
  }
  return hexCharCode.join("");
}
/**
 * 数字补0
 */
function pad(num, n) {
  var len = num.toString().length;
  while (len < n) {
    num = "0" + num;
    len++;
  }
  return num;
}
/**
 * 按千位逗号分割
 * @param s 需要格式化的数值.
 * @param type 判断格式化后是否需要小数位.
 */
function formatNumberWithComma(s, type) {
  if (/[^0-9\.]/.test(s))
      return "0";
  if (s == null || s == "")
      return "0";
  s = s.toString().replace(/^(\d*)$/, "$1.");
  s = (s + "00").replace(/(\d*\.\d\d)\d*/, "$1");
  s = s.replace(".", ",");
  var re = /(\d)(\d{3},)/;
  while (re.test(s))
      s = s.replace(re, "$1,$2");
  s = s.replace(/,(\d\d)$/, ".$1");
  if (type == 0) { // 不带小数位(默认是有小数位)
      var a = s.split(".");
      if (a[1] == "00") {
          s = a[0];
      }
  }
  return s;
}