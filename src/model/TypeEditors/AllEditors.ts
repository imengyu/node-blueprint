import { BlockParameterEditorRegData, BlockParameterEnumRegData } from "../Define/BlockDef";
import CommonUtils from "../../utils/CommonUtils";
import StringUtils from "../../utils/StringUtils";
import { BlockParameterBaseType } from "../Define/BlockParameterType";

export default {
  getBaseEditors(type : BlockParameterBaseType) {
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
      editorCreate: (block, port, parentEle, changeCallBack, nowVal, defaultVal) => {
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
      },
      useInSetType: [ 'variable' ],
    };;
  }
}

let booleanEditor : BlockParameterEditorRegData = {
  editorCreate: (block, port, parentEle, changeCallBack, nowVal, defaultVal) => {

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
  },
  useInSetType: [ 'variable' ],
};
let numberEditor : BlockParameterEditorRegData = {
  editorCreate: (block, port, parentEle, changeCallBack, nowVal, defaultVal) => {

    if(nowVal == null || typeof nowVal != 'number') 
    nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'number' ? defaultVal : 0);

    let div = document.createElement('div');
    let ele = document.createElement('input');
    let errSpan = document.createElement('i');
    div.classList.add('display-inline-block');
    ele.classList.add('input-border');
    ele.type = 'text';
    errSpan.classList.add('text-warning','iconfont','icon-error-1', 'ml-2');
    errSpan.style.display = 'none';

    let updateValue = () => {
      if(CommonUtils.isNullOrEmpty(ele.value)){
        errSpan.style.display = 'none';
        ele.classList.remove('input-warn');
        changeCallBack(null);
      } else if(StringUtils.isNumber(ele.value)) {
        let num = parseFloat(ele.value);
        if(num > Number.MAX_VALUE || (num > 0 && num < Number.MIN_VALUE) || num < -Number.MAX_VALUE) {
          errSpan.style.display = '';
          errSpan.setAttribute('title', ele.value + ' 超出了 Number 的范围 ('+Number.MIN_VALUE+','+Number.MAX_VALUE+')，这可能会导致数据错误');
          ele.classList.add('input-warn');
        }else {
          errSpan.style.display = 'none';
          ele.classList.remove('input-warn');
          changeCallBack(num);
        }
      } else {
        errSpan.style.display = '';
        errSpan.setAttribute('title', ele.value + ' 不是有效的数字');
        ele.classList.add('input-warn');
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
  },
  useInSetType: [ 'variable' ],
};
let bigintEditor : BlockParameterEditorRegData = {
  editorCreate: (block, port, parentEle, changeCallBack, nowVal, defaultVal) => {

    if(nowVal == null || typeof nowVal != 'bigint') 
      nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'bigint' ? defaultVal : BigInt(0));

    let div = document.createElement('div');
    let ele = document.createElement('input');
    let errSpan = document.createElement('i');
    div.classList.add('display-inline-block');
    ele.classList.add('input-border');
    ele.type = 'text';
    errSpan.classList.add('text-warning','iconfont','icon-error-1');
    errSpan.style.display = 'none';

    let updateValue = () => {
      if(CommonUtils.isNullOrEmpty(ele.value)){
        errSpan.style.display = 'none';
        ele.classList.remove('input-warn');
        changeCallBack(null);
      } else if(StringUtils.isNumber(ele.value)) {
        let num = BigInt(ele.value);
        if(!Number.isSafeInteger(num)) {
          errSpan.style.display = '';
          errSpan.setAttribute('title', ele.value + ' 超出了 BigInt 的范围 ('+Number.MIN_SAFE_INTEGER+','+Number.MAX_SAFE_INTEGER+')，这可能会导致数据错误');
          ele.classList.add('input-warn');
        }else {
          errSpan.style.display = 'none';
          ele.classList.remove('input-warn');
          changeCallBack(num);
        }
      } else {
        errSpan.style.display = '';
        errSpan.setAttribute('title', ele.value + ' 不是有效的数字');
        ele.classList.add('input-warn');
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
  },
  useInSetType: [ 'variable' ],
};
let stringEditor : BlockParameterEditorRegData = {
  editorCreate: (block, port, parentEle, changeCallBack, nowVal, defaultVal) => {

    let partuid = port ? ('param_editors_' + port.guid) : '';
    if(nowVal == null || typeof nowVal != 'string') 
      nowVal = changeCallBack(defaultVal != null && typeof defaultVal == 'string' ? defaultVal : '');

    let ele = document.createElement('textarea')
    if(nowVal != null && typeof nowVal == 'string')
      ele.value = <string>nowVal;
    ele.style.width = block && block.options[partuid + '_w'] ? block.options[partuid + '_w'] : '80px';
    ele.style.height = block && block.options[partuid + '_h'] ? block.options[partuid + '_h'] : '20px';
    ele.style.minHeight = '20px';
    ele.style.minWidth = '40px';
    ele.style.resize = 'both';
    ele.classList.add('custom-editor');
    ele.onmouseup = () => {
      if(block) {
        block.options[partuid + '_w'] = ele.style.width;
        block.options[partuid + '_h'] = ele.style.height;
      }
    };
    ele.onblur = () => changeCallBack(ele.value);
    return ele
  },
  forceUpdateValue: (newVal, editorEle) => {
    (<HTMLInputElement>editorEle).value = newVal;
  },
  useInSetType: [ 'variable' ],
};
