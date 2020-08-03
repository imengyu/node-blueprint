import { BlockParameteType } from "../port";
import { BlockParameterEditorRegData, BlockParameterEnumRegData } from "../BlockDef";
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
        ele.setAttribute('value', <string>port.paramValue);

        customType.allowTypes.forEach((k) => {
          let option = document.createElement('option')
          option.innerText = CommonUtils.isNullOrEmpty(k.description) ? k.value : (k.description + ' (' + k.value + ')');
          option.value = k.value;
          ele.appendChild(option);
        });

        ele.onchange = () => {
          port.paramValue = ele.value;
          port.update();
        };  

        return ele
      },
      editorValueChanged: (ele, port) => {
        ele.setAttribute('value', <string>port.paramValue);
        return false
      }
    };;
  }
}

let booleanEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {

    if(port.paramValue == null || typeof port.paramValue != 'boolean')
      port.paramValue = false;

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
  editorValueChanged: (ele, port) => {
    if(<boolean>port.paramValue == true) ele.setAttribute('checked', "checked");
    else ele.removeAttribute('checked');
    return false
  }
};
let numberEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {
    if(port.paramValue == null || typeof port.paramValue != 'number')
      port.paramValue = 0;

    let ele = document.createElement('input')
    ele.style.width = '50px';
    ele.setAttribute('type', "text");
    ele.setAttribute('value', (<number>port.paramValue).toString());
    ele.oninput = function() { ele.value = ele.value.replace(/[^\d]/g,''); }
    ele.onblur = () => {
      port.paramValue = parseFloat(ele.value);
      port.paramUserSetValue = parseFloat(ele.value);
      port.update();
    };
    return ele
  },
  editorValueChanged: (ele, port) => {
    ele.setAttribute('value', (<number>port.paramValue).toString());
    return false
  }
};
let stringEditor : BlockParameterEditorRegData = {
  editorCreate: (parentEle, port, regData) => {
    if(port.paramValue == null || typeof port.paramValue != 'string')
      port.paramValue = '';

    let ele = document.createElement('input')
    ele.style.width = '50px';
    ele.setAttribute('type', "text");
    ele.setAttribute('value', <string>port.paramValue);
    ele.onblur = () => {
      port.paramValue = ele.value;
      port.paramUserSetValue = ele.value;
      port.update();
    };
    return ele
  },
  editorValueChanged: (ele, port) => {
    (<HTMLInputElement>ele).value = <string>port.paramValue;
    return false
  }
};
