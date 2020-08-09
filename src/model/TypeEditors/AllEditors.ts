import { BlockParameteType } from "../Define/Port";
import { BlockParameterEditorRegData, BlockParameterEnumRegData } from "../Define/BlockDef";
import CommonUtils from "../../utils/CommonUtils";

export default {
  getBaseEditors(type : BlockParameteType) {
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
      editorCreate: (parentEle, port, regData) => {
        let ele = document.createElement('select')
        ele.setAttribute('type', "text");

        if(port.paramValue == null || typeof port.paramValue != 'string') {
          port.paramValue = (port.paramDefaultValue != null 
            && typeof port.paramDefaultValue == 'string') ? 
              port.paramDefaultValue : (customType.allowTypes.length > 0 ? customType.allowTypes[0] : '');
        }

        customType.allowTypes.forEach((k) => {
          let option = document.createElement('option')
          option.innerText = CommonUtils.isNullOrEmpty(k.description) ? k.value : (k.description + ' (' + k.value + ')');
          option.value = k.value;
          ele.appendChild(option);
        });

        if(port.paramUserSetValue != null && typeof port.paramUserSetValue == 'string')
          ele.value = <string>port.paramUserSetValue;
       
        ele.onchange = () => {
          port.paramUserSetValue = ele.value;
          port.paramValue = ele.value;
          port.update();
        };  

        return ele
      },
      forceUpdateValue: (port, editorEle) => {
        (<HTMLInputElement>editorEle).value = <string>port.paramUserSetValue;
      }
    };;
  }
}

let booleanEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {

    if(port.paramValue == null || typeof port.paramValue != 'boolean') {
      port.paramValue = port.paramDefaultValue != null 
      && typeof port.paramDefaultValue == 'boolean' ? port.paramDefaultValue : false;
    }

    let ele = document.createElement('input')
    ele.setAttribute('type', "checkbox");
    if(<boolean>port.paramValue == true)
      ele.setAttribute('checked', "checked");

    ele.onchange = () => {
      port.paramUserSetValue = ele.checked;
      port.paramValue = ele.checked;
      port.update();
    };  

    return ele
  },
  forceUpdateValue: (port, editorEle) => {
    if(<boolean>port.paramUserSetValue) 
      editorEle.setAttribute('checked', "checked");
    else  
      editorEle.removeAttribute('checked');
  }
};
let numberEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {
    if(port.paramValue == null || typeof port.paramValue != 'number') {
      port.paramValue = port.paramDefaultValue != null 
      && typeof port.paramDefaultValue == 'number' ? port.paramDefaultValue : 0;
    }

    let ele = document.createElement('input')
    let updateValue = () => {
      port.paramValue = parseFloat(ele.value);
      port.paramUserSetValue = parseFloat(ele.value);
      port.update();
    };

    if(port.paramUserSetValue != null && typeof port.paramUserSetValue == 'number')
      ele.value = (<number>port.paramUserSetValue).toString();

    ele.style.width = '50px';
    ele.setAttribute('type', "text");
    ele.setAttribute('value', (<number>port.paramValue).toString());
    ele.oninput = function() { ele.value = ele.value.replace(/[^\d]/g,''); }
    ele.onkeypress = (e) => { if(e.keyCode == 13) updateValue(); };
    ele.onblur = () => updateValue();
    return ele
  },
  forceUpdateValue: (port, editorEle) => {
    if(typeof port.paramUserSetValue == 'number')
      (<HTMLInputElement>editorEle).value = (<number>port.paramUserSetValue).toString();
  }
};
let bigintEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {
    if(port.paramValue == null || typeof port.paramValue != 'bigint'){
      port.paramValue = port.paramDefaultValue != null 
        && typeof port.paramDefaultValue == 'bigint' ? port.paramDefaultValue : BigInt(0);
    }

    let ele = document.createElement('input')
    let updateValue = () => {
      port.paramValue = BigInt(ele.value);
      port.paramUserSetValue = BigInt(ele.value);
      port.update();
    };

    if(port.paramUserSetValue != null && typeof port.paramUserSetValue == 'bigint')
      ele.value = (<bigint>port.paramUserSetValue).toString();

    ele.style.width = '100px';
    ele.setAttribute('type', "text");
    ele.setAttribute('value', (<bigint>port.paramValue).toString());
    ele.oninput = function() { ele.value = ele.value.replace(/[^\d]/g,''); }
    ele.onkeypress = (e) => { if(e.keyCode == 13) updateValue(); };
    ele.onblur = () => updateValue();
    return ele
  },
  forceUpdateValue: (port, editorEle) => {
    if(typeof port.paramUserSetValue == 'bigint')
      (<HTMLInputElement>editorEle).value = (<bigint>port.paramUserSetValue).toString();
  }
};
let stringEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {
    if(port.paramValue == null || typeof port.paramValue != 'string') {
      port.paramValue = port.paramDefaultValue != null 
        && typeof port.paramDefaultValue == 'string' ? port.paramDefaultValue : '';
    }

    let ele = document.createElement('input')
    ele.style.width = '50px';
    if(port.paramUserSetValue != null && typeof port.paramUserSetValue == 'string')
      ele.value = <string>port.paramUserSetValue;
    ele.setAttribute('type', "text");
    ele.setAttribute('value', <string>port.paramValue);
    ele.onblur = () => {
      port.paramValue = ele.value;
      port.paramUserSetValue = ele.value;
      port.update();
    };
    return ele
  },
  forceUpdateValue: (port, editorEle) => {
    (<HTMLInputElement>editorEle).value = port.paramUserSetValue;
  }
};
