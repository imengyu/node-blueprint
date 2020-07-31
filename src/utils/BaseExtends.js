/**
 * 基础扩展类
 */

import CommonUtils from './CommonUtils'

 /**
 * 日期格式化（原型扩展或重载）
 * 格式 YYYY/yyyy/ 表示年份
 * MM/M 月份
 * dd/DD/d/D 日期
 * @param {formatStr} 格式模版
 * @type string
 * @returns 日期字符串
 */
Date.prototype.format = function (formatStr) {
  var str = formatStr ? formatStr : 'YYYY-MM-dd HH:ii:ss';
  //var Week = ['日','一','二','三','四','五','六'];
  str = str.replace(/yyyy|YYYY/, this.getFullYear());
  str = str.replace(/MM/, CommonUtils.pad(this.getMonth() + 1, 2));
  str = str.replace(/M/, this.getMonth() + 1);
  str = str.replace(/dd|DD/, CommonUtils.pad(this.getDate(), 2));
  str = str.replace(/d/, this.getDate());
  str = str.replace(/HH/, CommonUtils.pad(this.getHours(), 2));
  str = str.replace(/hh/, CommonUtils.pad(this.getHours() > 12 ? this.getHours() - 12 : this.getHours(), 2));
  str = str.replace(/mm/, CommonUtils.pad(this.getMinutes(), 2));
  str = str.replace(/ii/, CommonUtils.pad(this.getMinutes(), 2));
  str = str.replace(/ss/, CommonUtils.pad(this.getSeconds(), 2));
  return str;
}
Date.prototype.toISOString = 
Date.prototype.toJSON = 
Date.prototype.toString = function () {
  return this.format();
}


//字符串

String.prototype.contains = function (str) {
  return this.indexOf(str) >= 0;
}

//数组

Array.prototype.remove = function(item) {
  var dx = typeof item === 'number' ? item : this.indexOf(item);
  var rs = false
  if(dx >= 0){
    for(var i = 0,n = 0;i < this.length; i++) {
      if(this[i] != this[dx]) {
        this[n++] = this[i];
        rs = true;
      }
    }
    this.length -= 1;
  }
  return rs;
}
Array.prototype.contains = function(item) {
  return this.indexOf(item) >= 0;
}
if(!Array.prototype.findIndex){
	Array.prototype.findIndex = function(predicateFn,thisArg){
		var len = this.length
		for (var i = 0; i < len; i++) {
			var item = this[i];
			if(predicateFn.call(thisArg,item,i,this)){
				return i
			}
		}
		return -1
	}
}
