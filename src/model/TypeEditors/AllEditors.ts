import { BlockParameterType } from "../Define/Port";
import { BlockParameterEditorRegData, BlockParameterEnumRegData } from "../Define/BlockDef";
import CommonUtils from "../../utils/CommonUtils";
import StringUtils from "../../utils/StringUtils";

export default {
  getBaseEditors(type : BlockParameterType) {
    switch(type) {
      case 'any':
      case 'object':
      case 'function':
      case 'custom':
        return null;
      case 'boolean':
        return booleanEditor;
      case 'bigint':
        return bigintEditor;
      case 'number':
        return numberEditor;
      case 'string':
        return stringEditor;
    }
  },
  getDefaultEnumEditor(customType : BlockParameterEnumRegData) : BlockParameterEditorRegData {
    return {
      editorCreate: (parentEle, changeCallBack, nowVal, defaultVal) => {
        let ele = document.createElement('select')
        ele.setAttribute('type', "text");

        if(nowVal == null || typeof nowVal != 'string') 
          nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'string' ? defaultVal : 
            (customType.allowTypes.length > 0 ? customType.allowTypes[0] : ''));

        customType.allowTypes.forEach((k) => {
          let option = document.createElement('option')
          option.innerText = CommonUtils.isNullOrEmpty(k.description) ? k.value : (k.description + ' (' + k.value + ')');
          option.value = k.value;
          ele.appendChild(option);
        });

        if(nowVal != null && typeof nowVal == 'string')
          ele.value = <string>nowVal;
       
        ele.onchange = () => changeCallBack(ele.value);

        return ele
      },
      forceUpdateValue: (newVal, editorEle) => {
        (<HTMLInputElement>editorEle).value = <string>newVal;
      }
    };;
  }
}

let booleanEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, changeCallBack, nowVal, defaultVal) => {

    if(nowVal == null || typeof nowVal != 'boolean') 
    nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'boolean' ? defaultVal : false);

    let ele = document.createElement('input')
    ele.setAttribute('type', "checkbox");
    if(<boolean>nowVal == true)
      ele.setAttribute('checked', "checked");
    ele.onchange = () => changeCallBack(ele.checked);  

    return ele
  },
  forceUpdateValue: (newVal, editorEle) => {
    if(newVal != null && <boolean>newVal) 
      editorEle.setAttribute('checked', "checked");
    else  
      editorEle.removeAttribute('checked');
  }
};
let numberEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, changeCallBack, nowVal, defaultVal) => {

    if(nowVal == null || typeof nowVal != 'number') 
    nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'number' ? defaultVal : 0);

    let div = document.createElement('div');
    let ele = document.createElement('input');
    let errSpan = document.createElement('i');
    div.classList.add('display-inline-block');
    errSpan.classList.add('text-warning','iconfont','icon-error-1', 'ml-2');
    errSpan.style.display = 'none';

    let updateValue = () => {
      if(CommonUtils.isNullOrEmpty(ele.value)){
        errSpan.style.display = 'none';
        changeCallBack(null);
      } else if(StringUtils.isNumber(ele.value)) {
        let num = parseFloat(ele.value);
        if(num > Number.MAX_VALUE || (num > 0 && num < Number.MIN_VALUE) || num < -Number.MAX_VALUE) {
          errSpan.style.display = '';
          errSpan.setAttribute('title', ele.value + ' 超出了 Number 的范围 ('+Number.MIN_VALUE+','+Number.MAX_VALUE+')，这可能会导致数据错误');
        }else {
          errSpan.style.display = 'none';
          changeCallBack(num);
        }
      } else {
        errSpan.style.display = '';
        errSpan.setAttribute('title', ele.value + ' 不是有效的数字');
      }
    }

    if(nowVal != null && typeof nowVal == 'number')
      ele.value = (<number>nowVal).toString();

    ele.style.width = '50px';
    ele.setAttribute('type', "text");
    ele.oninput = function() { ele.value = ele.value.replace(/[^(\d|\.|\-)]/g,''); }
    ele.onkeypress = (e) => { if(e.keyCode == 13) updateValue(); };
    ele.onblur = () => updateValue();

    div.appendChild(ele);
    div.appendChild(errSpan);
    return div
  },
  forceUpdateValue: (newVal, editorEle) => {
    if(newVal != null && typeof newVal == 'number')
      (<HTMLInputElement>editorEle).value = (<number>newVal).toString();
  }
};
let bigintEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, changeCallBack, nowVal, defaultVal) => {

    if(nowVal == null || typeof nowVal != 'bigint') 
      nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'bigint' ? defaultVal : BigInt(0));

    let div = document.createElement('div');
    let ele = document.createElement('input');
    let errSpan = document.createElement('i');
    div.classList.add('display-inline-block');
    errSpan.classList.add('text-warning','iconfont','icon-error-1');
    errSpan.style.display = 'none';

    let updateValue = () => {
      if(CommonUtils.isNullOrEmpty(ele.value)){
        errSpan.style.display = 'none';
        changeCallBack(null);
      } else if(StringUtils.isNumber(ele.value)) {
        let num = BigInt(ele.value);
        if(!Number.isSafeInteger(num)) {
          errSpan.style.display = '';
          errSpan.setAttribute('title', ele.value + ' 超出了 BigInt 的范围 ('+Number.MIN_SAFE_INTEGER+','+Number.MAX_SAFE_INTEGER+')，这可能会导致数据错误');
        }else {
          errSpan.style.display = 'none';
          changeCallBack(num);
        }
      } else {
        errSpan.style.display = '';
        errSpan.setAttribute('title', ele.value + ' 不是有效的数字');
      }
    }

    if(nowVal != null && typeof nowVal == 'bigint')
      ele.value = (<bigint>nowVal).toString();

    ele.style.width = '100px';
    ele.setAttribute('type', "text");
    ele.oninput = function() { ele.value = ele.value.replace(/[^(\d|\-)]/g,''); }
    ele.onkeypress = (e) => { if(e.keyCode == 13) updateValue(); };
    ele.onblur = () => updateValue();

    div.appendChild(ele);
    div.appendChild(errSpan);
    return div
  },
  forceUpdateValue: (newVal, editorEle) => {
    if(newVal != null && typeof newVal == 'bigint')
      (<HTMLInputElement>editorEle).value = (<bigint>newVal).toString();
  }
};
let stringEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, changeCallBack, nowVal, defaultVal) => {

    if(nowVal == null || typeof nowVal != 'string') 
      nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'string' ? defaultVal : '');

    let ele = document.createElement('input')
    ele.style.width = '50px';
    if(nowVal != null && typeof nowVal == 'string')
      ele.value = <string>nowVal;
    ele.setAttribute('type', "text");
    ele.onblur = () => changeCallBack(ele.value);
    return ele
  },
  forceUpdateValue: (newVal, editorEle) => {
    (<HTMLInputElement>editorEle).value = newVal;
  }
};
