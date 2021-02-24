export default {
  setCookie,
  getCookie,
  delCookie,
}

/**
 * 设置 Cookie
 * @param {String} name Cookie 名称
 * @param {*} value 
 * @param {number} expires 过期时间（秒） 
 * @param {string} path 路径
 */
function setCookie(name : string, value : string, expires = 0, path ?: string) {
  var exp = new Date();
  exp.setTime(exp.getTime() + expires * 1000);
  document.cookie = name + "=" + escape(value) + ";expires=" + (<any>exp).toGMTString() + (path ?  + ";path=" + path : '');
}
/**
 * 读取 Cookie
 * @param {String} name Cookie 名称
 */ 
function getCookie(name : string) {
  var arr, reg = new RegExp("(^| )" + name + "=([^;]*)(;|$)");

  if (arr = document.cookie.match(reg))

    return unescape(arr[2]);
  else
    return null;
}
/**
 * 删除 Cookie
 * @param {String} name Cookie 名称
 */ 
function delCookie(name : string) {
  var exp = new Date();
  exp.setTime(exp.getTime() - 1);
  var cval = getCookie(name);
  if (cval != null)
    document.cookie = name + "=" + cval + ";expires=" + (<any>exp).toGMTString();
}
