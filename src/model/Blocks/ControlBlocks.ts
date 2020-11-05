import { BlockRegData, BlockParameterEnumRegData } from "../Define/BlockDef";
import { Block } from "../Define/Block";
import { BlockEditor } from "../Editor/BlockEditor";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import CommonUtils from "../../utils/CommonUtils";
import StringUtils from "../../utils/StringUtils";
import AllEditors from "../TypeEditors/AllEditors";
import { Vector2 } from "../Vector2";
import { BlockParameterType } from "../Define/BlockParameterType";

export default {
  register() {
    return registerControl();
  },
  packageName: 'Control',
  version: 1,
}

function registerControl() {

  let blockBranch = new BlockRegData("E8DB1B75-FDBD-1A0A-6D99-F91FAEAB3131", "条件分支");
  let blockSwitch = new BlockRegData("BC9184EA-2866-3C9A-5A22-75E79DA5AF181", "分支");
  let blockSelect = new BlockRegData("144AB2CC-F807-7021-1442-A8E7CD1FF1BE", "选择");
  let blockWhile = new BlockRegData("28ADE8D9-50E9-FA84-0BFB-A48AF754D1FD", "While 循环");
  let blockDoWhile = new BlockRegData("18CD0C99-C47C-525F-D757-0712441B794E", "Do While 循环");
  let blockFor = new BlockRegData("949F91AA-D35E-E9E8-8B4B-36EDBD5B1AAD", "For 循环");
  let blockSequence = new BlockRegData("4253F127-DEDB-D1BE-AF0E-9795E421DFF0", "顺序执行");
  let blockDoOnce = new BlockRegData("79EC0B90-F5B7-BAA3-C3C5-1D2371E8AF0F", "Do Once");
  let blockDoN = new BlockRegData("38F76740-BE6A-23E4-1F6F-FC252314ADDB", "Do N");
  let blockFlipFlop = new BlockRegData("6E4471BE-6022-5FA9-368D-8CB784E3F73B", "Flip Flop");
  let blockToggle = new BlockRegData("A8AC23FE-EB32-D6B0-A9DA-BFAA1BC1EB8D", "开关");

  //#region 条件分支

  blockBranch.baseInfo.author = 'imengyu';
  blockBranch.baseInfo.description = "通过判断条件为真或假分支流图";
  blockBranch.baseInfo.category = '控制';
  blockBranch.baseInfo.version = '2.0';
  blockBranch.baseInfo.logo = require('../../assets/images/BlockIcon/branch.svg');
  blockBranch.ports = [
    {
      guid: 'PI0',
      paramType: 'execute',
      direction: 'input'
    },
    {
      name: '条件',
      guid: 'PICON',
      paramType: 'boolean',
      paramDefaultValue: true,
      direction: 'input'
    },
    {
      name: '为真',
      guid: 'POTRUE',
      paramType: 'execute',
      direction: 'output'
    },
    {
      name: '为假',
      guid: 'POFALSE',
      paramType: 'execute',
      direction: 'output'
    },
  ];
  blockBranch.callbacks.onPortExecuteIn = (block, port) => { 
    let condition = <boolean>block.getInputParamValue('PICON');
    block.activeOutputPort(condition ? 'POTRUE' : 'POFALSE');
  };

  //#endregion

  //#region 分支

  let changeBlockOutputPortsEditor = function(block : Block, newType : string) {
    block.allPorts.forEach((port) => {
      if(port.direction == 'output' && port.paramType.isExecute() && port.guid != 'PO0') {
        port.data["customEditorType"] = ParamTypeServiceInstance.getBaseTypeForCustomType(newType);
        (<BlockEditor>block).createOrReCreatePortCustomEditor(port);
      }
    });
  }
  let reloadSwitchBlockPorts = function(block : Block) {
    let type = block.options['opType'];

    if(block.isEditorBlock)
      (<BlockEditor>block).portsChangeSettings.userCanAddOutputPort = true;

    block.changePortParamType(block.getPortByGUID('PICON'), type);
    
    //Delete old ports
    if(block.data['lastIsEnum'] || type == 'enum') {
      Object.keys(block.outputPorts).forEach((key) => {
        if(!CommonUtils.isNullOrEmpty(block.outputPorts[key].options['typeOutPort']))
          block.deletePort(block.outputPorts[key])
      });
      block.data['lastIsEnum'] = false;
    }

    switch(type) {
      case 'string':
        changeBlockOutputPortsEditor(block, 'string');
        break;
      case 'boolean':
        changeBlockOutputPortsEditor(block, 'boolean');
        break;  
      case 'number':
        changeBlockOutputPortsEditor(block, 'number');
        break;
      case 'bigint':
        changeBlockOutputPortsEditor(block, 'bigint');
        break;
      default:
        let typeData = ParamTypeServiceInstance.getCustomType(type);
        if(typeData != null) {
          if(typeData.prototypeName == 'enum') {

            if(block.isEditorBlock) (<BlockEditor>block).portsChangeSettings.userCanAddOutputPort = false;

            (<BlockParameterEnumRegData>typeData).allowTypes.forEach((type) => {
              let port = block.addPort({
                name: type.value,
                description: '当输入条件为' + StringUtils.valueToStr(type.value) + '时执行\n' + type.description,
                guid: StringUtils.strToHexCharCode(type.value, false),
                direction: 'output',
                paramType: 'execute',
              }, false);
              port.options['typeOutPort'] = type.value;
            });

            block.data['lastIsEnum'] = true;

          }else changeBlockOutputPortsEditor(block, typeData.name);
        }else changeBlockOutputPortsEditor(block, 'any');
        
        break;
    }

    if(block.isEditorBlock) (<BlockEditor>block).updateContent();
  }

  blockSwitch.baseInfo.author = 'imengyu';
  blockSwitch.baseInfo.description = "通过判断指定的输入条件从而分支流图";
  blockSwitch.baseInfo.category = '控制';
  blockSwitch.baseInfo.version = '2.0';
  blockSwitch.baseInfo.logo = require('../../assets/images/BlockIcon/switch.svg');
  blockSwitch.callbacks.onCreate = (block) => {
    if(typeof block.options['opType'] == 'undefined') block.options['opType'] = 'any';
    reloadSwitchBlockPorts(block);
  };
  blockSwitch.ports = [
    {
      guid: 'PI0',
      paramType: 'execute',
      direction: 'input'
    },
    {
      name: '输入',
      guid: 'PICON',
      paramType: 'any',
      direction: 'input',
      forceNoEditorControl: true,
    },
    {
      name: '默认',
      description: '如果没有匹配的输入条件，则执行默认端口',
      guid: 'PO0',
      paramType: 'execute',
      direction: 'output'
    },
  ];
  blockSwitch.settings.portsChangeSettings.userCanAddOutputPort = true;
  blockSwitch.callbacks.onPortExecuteIn = (block, port) => { 
    let inCoon = block.getInputParamValue('PICON');
    let keys = Object.keys(block.outputPorts);
    for (let i = 0; i < keys.length; i++) {
      if(!CommonUtils.isNullOrEmpty(block.outputPorts[i].options['typeOutPort']) 
        && block.outputPorts[i].options['typeOutPort'] == inCoon) {
        block.activeOutputPort(block.outputPorts[i]);
        return;
      }
    }
    block.activeOutputPort('PO0');
  };
  blockSwitch.callbacks.onCreateCustomEditor = (parentEle, block : BlockEditor, regData) => { 
    let el = document.createElement('div');
    let typeSelector = document.createElement('input');
    typeSelector.type = 'text';
    typeSelector.value = block.options['opType'];
    typeSelector.style.width = '111px';
    typeSelector.readOnly = true;
    typeSelector.onclick = (e) => {
      block.editor.chooseType(new Vector2(e.x, e.y), (type, isBaseType) => {
        if(block.options['opType'] != type.name) {
          block.options['opType'] = type.name;
          typeSelector.value = type.name;
          reloadSwitchBlockPorts(block);
        }
      }, false)
    };
    el.innerText = '输入条件类型：';
    el.style.whiteSpace = 'nowrap';
    el.appendChild(typeSelector); 
    parentEle.appendChild(el);
  };
  blockSwitch.callbacks.onCreatePortCustomEditor = (parentEle, block, port) => { 
    if(!CommonUtils.isNullOrEmpty(port.data["customEditorType"])) {
      let customType = ParamTypeServiceInstance.isBaseType(port.data["customEditorType"]) ? 
        ParamTypeServiceInstance.getCustomType(port.data["customEditorType"]) : null;
      let typeEditor = ParamTypeServiceInstance.isBaseType(port.data["customEditorType"]) ? 
        AllEditors.getBaseEditors(port.data["customEditorType"])
        : (customType == null ? null : customType.editor);
      if(typeEditor != null) {
        return typeEditor.editorCreate(block, port, parentEle, (newV) => {
          port.options['typeOutPort'] = newV;
          port.description = '当输入为 ' + StringUtils.valueToStr(newV) +  ' 时执行';
          port.regData.description = port.description;
          block.updatePort(port);
          return newV;
        }, port.options['typeOutPort'], null, customType)
      }
    }
    return null;
  };
  blockSwitch.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'PO' + block.data['portCount'],
      direction: 'output',
      paramType: 'execute',
      data: { "customEditorType": ParamTypeServiceInstance.getBaseTypeForCustomType(block.options['opType']) }
    }
  };

  //#endregion

  //#region 选择

  let changeBlockInputPortsEditor = function(block : Block, newType : string) {
    block.allPorts.forEach((port) => {
      if(port.direction == 'input' && !port.paramType.isExecute() && port.guid != 'PICON' && port.guid != 'PIDEF') {
        port.data["customEditorType"] = ParamTypeServiceInstance.getBaseTypeForCustomType(newType);
        (<BlockEditor>block).createOrReCreatePortCustomEditor(port);
      }
    });
  }
  let reloadSelectBlockPorts = function(block : Block) {
    let type = block.options['opType'];

    if(block.isEditorBlock)
      (<BlockEditor>block).parametersChangeSettings.userCanAddInputParameter = true;
    
    block.changePortParamType(block.getPortByGUID('PICON'), BlockParameterType.createTypeFromString(type), 'variable');

    //Delete old ports
    if(block.data['lastIsEnum'] || type == 'enum') {
      Object.keys(block.inputPorts).forEach((key) => {
        if(!CommonUtils.isNullOrEmpty(block.inputPorts[key].options['typeOutPort']))
          block.deletePort(block.inputPorts[key])
      });
      block.data['lastIsEnum'] = false;
    }

    switch(type) {
      case 'boolean':
        changeBlockInputPortsEditor(block, 'boolean');
        break;
      case 'string':
        changeBlockInputPortsEditor(block, 'string');
        break;
      case 'number':
        changeBlockInputPortsEditor(block, 'number');
        break;
      case 'bigint':
        changeBlockInputPortsEditor(block, 'bigint');
        break;
      default:
        let typeData = ParamTypeServiceInstance.getCustomType(type);
        if(typeData != null) {
          if(typeData.prototypeName == 'enum') {

            if(block.isEditorBlock) (<BlockEditor>block).parametersChangeSettings.userCanAddInputParameter = false;

            (<BlockParameterEnumRegData>typeData).allowTypes.forEach((type) => {
              let port = block.addPort({
                name: type.value,
                description: '当输入条件为' + StringUtils.valueToStr(type.value) + '时输出该变量\n' + type.description,
                guid: StringUtils.strToHexCharCode(type.value, false),
                direction: 'input',
                paramType: 'any',
              }, false);
              port.options['typeOutPort'] = type.value;
            });

            block.data['lastIsEnum'] = true;
          }else changeBlockInputPortsEditor(block, typeData.name);
        }else changeBlockInputPortsEditor(block, 'any');
        
        break;
    }

    if(block.isEditorBlock) (<BlockEditor>block).updateContent();
  }

  blockSelect.baseInfo.author = 'imengyu';
  blockSelect.baseInfo.description = "通过判断指定的输入条件从而分支流图";
  blockSelect.baseInfo.category = '控制';
  blockSelect.baseInfo.version = '2.0';
  blockSelect.baseInfo.logo = require('../../assets/images/BlockIcon/select.svg');
  blockSelect.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockSelect.callbacks.onCreate = (block) => {
    if(typeof block.options['opType'] == 'undefined') block.options['opType'] = 'any';
    reloadSelectBlockPorts(block);
  };
  blockSelect.ports = [
    {
      guid: 'PI0',
      paramType: 'execute',
      direction: 'input'
    },
    {
      name: '默认',
      description: '如果没有匹配的输入条件，则输出默认端口参数',
      guid: 'PIDEF',
      paramType: 'any',
      direction: 'input'
    },
    {
      name: '输入',
      guid: 'PICON',
      paramType: 'any',
      direction: 'input',
      forceNoEditorControl: true,
    },
    {
      guid: 'PO0',
      paramType: 'execute',
      direction: 'output'
    },
    {
      name: '输出',
      guid: 'PO',
      paramType: 'any',
      direction: 'output'
    },
    
  ];
  blockSelect.callbacks.onPortExecuteIn = (block, port) => { 
    let inCoon = block.getInputParamValue('PICON');
    let keys = Object.keys(block.outputPorts);
    for (let i = 0; i < keys.length; i++) {
      if(!CommonUtils.isNullOrEmpty(block.inputPorts[i].options['typeOutPort']) 
        && block.inputPorts[i].options['typeOutPort'] == inCoon) {
        block.setOutputParamValue('PO', block.getInputParamValue(block.inputPorts[i]));
        return;
      }
    }
    block.setOutputParamValue('PO', block.getInputParamValue('PIDEF'));
    block.activeOutputPort('PO0');
  };
  blockSelect.callbacks.onCreateCustomEditor = (parentEle, block : BlockEditor, regData) => { 
    let el = document.createElement('div');
    let typeSelector = document.createElement('input');
    typeSelector.value = block.options['opType'];
    typeSelector.type = 'text';
    typeSelector.style.width = '111px';
    typeSelector.readOnly = true;
    typeSelector.onclick = (e) => {
      block.editor.chooseType(new Vector2(e.x, e.y), (type, isBaseType) => {
        if(block.options['opType'] != type.name) {
          block.options['opType'] = type.name;
          typeSelector.value = type.name;
          reloadSelectBlockPorts(block);
        }
      }, false)
    };
    el.innerText = '输入条件类型：';
    el.style.whiteSpace = 'nowrap';
    el.appendChild(typeSelector);
    parentEle.appendChild(el);
  };
  blockSelect.callbacks.onCreatePortCustomEditor = (parentEle, block, port) => { 
    if(!CommonUtils.isNullOrEmpty(port.data["customEditorType"])) {
      let customType = ParamTypeServiceInstance.isBaseType(port.data["customEditorType"]) ? 
        ParamTypeServiceInstance.getCustomType(port.data["customEditorType"]) : null;
      let typeEditor = ParamTypeServiceInstance.isBaseType(port.data["customEditorType"]) ? 
        AllEditors.getBaseEditors(port.data["customEditorType"])
        : (customType == null ? null : customType.editor);
      if(typeEditor != null) {
        let el = document.createElement('div');
        let input = typeEditor.editorCreate(block, port, parentEle, (newV) => {
          port.options['typeOutPort'] = newV;
          port.description = '当输入为 ' + StringUtils.valueToStr(newV) +  ' 时输出此变量';
          port.regData.description = port.description;
          block.updatePort(port);
          return newV;
        }, port.options['typeOutPort'], null, customType);

        el.style.display = 'inline-block';
        el.innerText = '输入 = ';
        el.appendChild(input);
        return el;
      }
    }
    return null;
  };
  blockSelect.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'PO' + block.data['portCount'],
      direction: 'input',
      paramType: 'any',
      data: { "customEditorType": ParamTypeServiceInstance.getBaseTypeForCustomType(block.options['opType']) }
    }
  };

  //#endregion

  //#region While

  blockWhile.baseInfo.author = 'imengyu';
  blockWhile.baseInfo.description = "如果条件为真则循环";
  blockWhile.baseInfo.category = '控制';
  blockWhile.baseInfo.version = '2.0';
  blockWhile.baseInfo.logo = require('../../assets/images/BlockIcon/loop.svg');
  blockWhile.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PIBREAK',
      paramType: 'execute',
      direction: 'input',
      name: '终止',
      description: '终止循环',
    },
    {
      guid: 'PICON',
      paramType: 'boolean',
      paramDefaultValue: true,
      direction: 'input',
      name: '条件',
    },
    {
      guid: 'POEXIT',
      paramType: 'execute',
      direction: 'output',
      name: '循环结束'
    },
    {
      guid: 'POLOOP',
      paramType: 'execute',
      direction: 'output',
      name: '循环体',
    },
  ];
  blockWhile.callbacks.onStartRun = (block) => {
    block.variables()['breakActived'] = false;
  }
  blockWhile.callbacks.onPortExecuteIn = (block, port) => { 

    var variables = block.variables();
    if(port.guid == 'PI') {
      let POLOOP = block.getPortByGUID('POLOOP');
      let POEXIT = block.getPortByGUID('POEXIT');
      let condition = <boolean>block.getInputParamValue('PICON');
      let breakActived = variables['breakActived'];
      while(condition) {

        block.activeOutputPort(POLOOP);

        //update
        condition = <boolean>block.getInputParamValue('PICON');
        breakActived = variables['breakActived']; if(breakActived) break;
      }

      block.activeOutputPort(POEXIT);

    }else if(port.guid == 'PIBREAK') {
      variables['breakActived'] = true;
    }
  };

  //#endregion

  //#region DoWhile

  blockDoWhile.baseInfo.author = 'imengyu';
  blockDoWhile.baseInfo.description = "先执行循环体，然后再判断条件是否为真, 如果为真则继续循环";
  blockDoWhile.baseInfo.category = '控制';
  blockDoWhile.baseInfo.version = '2.0';
  blockDoWhile.baseInfo.logo = require('../../assets/images/BlockIcon/loop.svg');
  blockDoWhile.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PIBREAK',
      paramType: 'execute',
      direction: 'input',
      name: '终止',
      description: '终止循环',
    },
    {
      guid: 'PICON',
      paramType: 'boolean',
      paramDefaultValue: true,
      direction: 'input',
      name: '条件',
    },
    {
      guid: 'POEXIT',
      paramType: 'execute',
      direction: 'output',
      name: '循环结束'
    },
    {
      guid: 'POLOOP',
      paramType: 'execute',
      direction: 'output',
      name: '循环体',
    },
  ];
  blockDoWhile.callbacks.onStartRun = (block) => {
    block.variables()['breakActived'] = false;
  }
  blockDoWhile.callbacks.onPortExecuteIn = (block, port) => { 

    var variables = block.variables();
    if(port.guid == 'PI') {
      let POLOOP = block.getPortByGUID('POLOOP');
      let POEXIT = block.getPortByGUID('POEXIT');
      let condition = <boolean>block.getInputParamValue('PICON');
      let breakActived = variables['breakActived'];
      do {
        block.activeOutputPort(POLOOP);
        //update
        condition = <boolean>block.getInputParamValue('PICON');
        breakActived = variables['breakActived']; if(breakActived) break;
      } while(condition);

      block.activeOutputPort(POEXIT);

    }else if(port.guid == 'PIBREAK') {
      variables['breakActived'] = true;
    }
  };

  //#endregion

  //#region FlipFlop

  blockFlipFlop.baseInfo.author = 'imengyu';
  blockFlipFlop.baseInfo.description = "在A和B之间循环往复";
  blockFlipFlop.baseInfo.category = '控制';
  blockFlipFlop.baseInfo.version = '2.0';
  blockFlipFlop.baseInfo.logo = require('../../assets/images/BlockIcon/flipflop.svg');
  blockFlipFlop.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'POA',
      paramType: 'execute',
      direction: 'output',
      name: 'A',
    },
    {
      guid: 'POB',
      paramType: 'execute',
      direction: 'output',
      name: 'B'
    },
    {
      guid: 'POC',
      paramType: 'boolean',
      direction: 'output',
      name: '是否是A'
    },
  ];
  blockFlipFlop.callbacks.onStartRun = (block) => {
    block.variables()['isA'] = true;
  }
  blockFlipFlop.callbacks.onPortExecuteIn = (block, port) => { 

    var variables = block.variables();

    let POA = block.getPortByGUID('POA');
    let POB = block.getPortByGUID('POB');
    let POC = block.getPortByGUID('POC');
    
    variables['isA'] = !variables['isA'];
    block.setOutputParamValue(POC, variables['isA']);
    block.activeOutputPort(variables['isA'] ? POA : POB);
  };

  //#endregion
  
  //#region Toggle

  blockToggle.baseInfo.author = 'imengyu';
  blockToggle.baseInfo.description = "开关门，通过一个开关来控制流程的通或断";
  blockToggle.baseInfo.category = '控制';
  blockToggle.baseInfo.version = '2.0';
  blockToggle.baseInfo.logo = require('../../assets/images/BlockIcon/gate.svg');
  blockToggle.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PION',
      paramType: 'execute',
      direction: 'input',
      name: '开',
    },
    {
      guid: 'PIOFF',
      paramType: 'execute',
      direction: 'input',
      name: '关'
    },
    {
      guid: 'PITOGGLE',
      paramType: 'execute',
      direction: 'input',
      name: '切换'
    },
    {
      guid: 'PISTARTOFF',
      paramType: 'boolean',
      direction: 'input',
      name: '开始时是关闭的'
    },
    {
      guid: 'PO',
      paramType: 'execute',
      direction: 'output',
    },
  ];
  blockToggle.callbacks.onStartRun = (block) => {
    block.variables()['isOn'] = !block.getInputParamValue('PISTARTOFF');
  }
  blockToggle.callbacks.onPortExecuteIn = (block, port) => { 
    var variables = block.variables();
    if(port.guid == 'PI') {
      if(variables['isOn']) block.activeOutputPort('PO');
    } else if(port.guid == 'PION') variables['isOn'] = true;
    else if(port.guid == 'PIOFF') variables['isOn'] = false;
    else if(port.guid == 'PITOGGGLE') variables['isOn'] = !variables['isOn'];
  };

  //#endregion
  
  //#region For

  blockFor.baseInfo.author = 'imengyu';
  blockFor.baseInfo.description = "从 起始索引值 至 结束索引值 按 步长 进行循环";
  blockFor.baseInfo.category = '控制';
  blockFor.baseInfo.version = '2.0';
  blockFor.baseInfo.logo = require('../../assets/images/BlockIcon/loop.svg');
  blockFor.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PISTINX',
      paramType: 'number',
      direction: 'input',
      name: '起始索引值',
      paramDefaultValue: 0,
    },
    {
      guid: 'PIENINX',
      paramType: 'number',
      direction: 'input',
      name: '结束索引值',
      paramDefaultValue: 10,
    },
    {
      guid: 'PISTEP',
      paramType: 'number',
      direction: 'input',
      name: '步长',
      description: '循环自增步长。可以为负数，但 结束索引值 必须 小于 起始索引值',
      paramDefaultValue: 1,
    },
    {
      guid: 'PIBREAK',
      paramType: 'execute',
      direction: 'input',
      name: '终止',
      description: '终止循环',
    },
    {
      guid: 'POEXIT',
      paramType: 'execute',
      direction: 'output',
      name: '循环结束'
    },
    {
      guid: 'POINDEX',
      paramType: 'number',
      direction: 'output',
      name: '当前索引',
    },
    {
      guid: 'POLOOP',
      paramType: 'execute',
      direction: 'output',
      name: '循环体',
    },
  ];
  blockFor.callbacks.onPortExecuteIn = (block, port) => { 
    if(port.guid == 'PI') {

      var variables = block.variables();
      variables['breakActived'] = false;

      let POLOOP = block.getPortByGUID('POLOOP');
      let POEXIT = block.getPortByGUID('POEXIT');
      let POINDEX = block.getPortByGUID('POINDEX');

      let startIndex = <number>block.getInputParamValue('PISTINX');
      let endIndex = <number>block.getInputParamValue('PIENINX');
      let stepIndex = <number>block.getInputParamValue('PISTEP');
      let breakActived = variables['breakActived'];

      if(stepIndex > 0)
        for(let i = startIndex; i < endIndex; i += stepIndex) {
          
          block.setOutputParamValue(POINDEX, i);
          block.activeOutputPort(POLOOP);

          breakActived = variables['breakActived']; if(breakActived) break;
        }
      else if(stepIndex < 0) {
        for(let i = startIndex; i > endIndex; i += stepIndex) {

          block.setOutputParamValue(POINDEX, i);
          block.activeOutputPort(POLOOP);

          breakActived = variables['breakActived']; if(breakActived) break;
        }
      }

      block.activeOutputPort(POEXIT);
    }else if(port.guid == 'PIBREAK') {
      var variables = block.variables();
      variables['breakActived'] = true;
    }
  };

  //#endregion
  
  //#region DoN

  blockDoN.baseInfo.author = 'imengyu';
  blockDoN.baseInfo.description = "使执行只通过N次";
  blockDoN.baseInfo.category = '控制';
  blockDoN.baseInfo.version = '2.0';
  blockDoN.baseInfo.logo = require('../../assets/images/BlockIcon/do_n.svg');
  blockDoN.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PIN',
      paramType: 'number',
      direction: 'input',
      name: 'N'
    },
    {
      guid: 'PIRESET',
      paramType: 'execute',
      direction: 'input',
      name: '重置'
    },
    {
      guid: 'PO',
      paramType: 'execute',
      direction: 'output',
    },
    {
      guid: 'POCOUNT',
      paramType: 'number',
      direction: 'output',
      name: '当前计数',
    },
  ];
  blockDoN.callbacks.onStartRun = (block) => {
    block.variables()['count'] = 0;
  }
  blockDoN.callbacks.onPortExecuteIn = (block, port) => { 

    var variables = block.variables();
    if(port.guid == 'PI') {

      let N = <number>block.getInputParamValue('PIN');
      if(N < variables['count']) {

        variables['count']++;
        block.setOutputParamValue('POCOUNT', variables['count']);
        block.activeOutputPort('PO');
      }
    } else if(port.guid == 'PIRESET') {
      variables['count'] = 0;
      block.setOutputParamValue('POCOUNT', 0);
    }
  };

  //#endregion
  
  //#region Do Once

  blockDoOnce.baseInfo.author = 'imengyu';
  blockDoOnce.baseInfo.description = "使执行只通过1次";
  blockDoOnce.baseInfo.category = '控制';
  blockDoOnce.baseInfo.version = '2.0';
  blockDoOnce.baseInfo.logo = require('../../assets/images/BlockIcon/do_once.svg');
  blockDoOnce.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PIRESET',
      paramType: 'execute',
      direction: 'input',
      name: '重置'
    },
    {
      guid: 'PISTARTOFF',
      paramType: 'boolean',
      direction: 'input',
      name: '开始时是关闭的'
    },
    {
      guid: 'PO',
      paramType: 'execute',
      direction: 'output',
    },
  ];
  blockDoOnce.callbacks.onStartRun = (block) => {
    block.variables()['isOn'] = !block.getInputParamValue('PISTARTOFF');
  }
  blockDoOnce.callbacks.onPortExecuteIn = (block, port) => { 

    var variables = block.variables();
    if(port.guid == 'PI') {
      if(variables['isOn']) {

        variables['isOn'] = false;
        block.activeOutputPort('PO');
      }
    } else if(port.guid == 'PIRESET')
      variables['isOn'] = true;
  };

  //#endregion
  
  //#region Sequence

  blockSequence.baseInfo.author = 'imengyu';
  blockSequence.baseInfo.description = "按顺序执行一系列的端口";
  blockSequence.baseInfo.category = '控制';
  blockSequence.baseInfo.version = '2.0';
  blockSequence.baseInfo.logo = require('../../assets/images/BlockIcon/sequence.svg');
  blockSequence.settings.portsChangeSettings.userCanAddOutputPort = true;
  blockSequence.ports = [
    {
      guid: 'PI',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PO',
      paramType: 'execute',
      direction: 'output',
      name: '执行0'
    },
  ];
  blockSequence.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'PO' + block.data['portCount'],
      name: '执行' + block.data['portCount'],
      direction: 'output',
      paramType: 'execute',
      data: { "customEditorType": ParamTypeServiceInstance.getBaseTypeForCustomType(block.options['opType']) }
    }
  };
  blockSequence.callbacks.onPortExecuteIn = (block, port) => { 
    if(port.guid == 'PI') {
      block.allPorts.forEach((port) => {
        block.activeOutputPort(port);
      });
    } 
  };

  //#endregion

  return [
    blockBranch, 
    blockSwitch, 
    blockSelect, 
    blockFlipFlop, 
    blockToggle, 
    blockWhile, 
    blockFor, 
    blockDoN, 
    blockDoOnce,
    blockSequence,
  ];
}