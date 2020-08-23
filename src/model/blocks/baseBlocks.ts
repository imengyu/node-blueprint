import BlockServiceInstance from "../../sevices/BlockService";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { BlockParameterEnumRegData, BlockRegData } from "../Define/BlockDef";
import { BlockPort } from "../Define/Port";
import DebugWorkProviderInstance from "../WorkProvider/DebugWorkProvider";
import OperatorBlocks from "./OperatorBlocks";
import { BlockEditor } from "../Editor/BlockEditor";
import CommonUtils from "../../utils/CommonUtils";
import StringUtils from "../../utils/StringUtils";
import logger from "../../utils/Logger";
import { BlockGraphDocunment } from "../Define/BlockDocunment";
import ControlBlocks from "./ControlBlocks";
import LogicBlocks from "./LogicBlocks";
import CanvasUtils from "../../utils/CanvasUtils";
import { Block } from "../Define/Block";

export default { 
  register,
  getScriptBaseBlockIn() { return blockIn; },
  getScriptBaseBlockOut() { return blockOut;  },
  getScriptBaseGraphIn() { return graphIn; },
  getScriptBaseGraphOut() { return graphOut;  },
  getScriptBaseGraphCall() { return graphCall;  },
  getScriptBaseVariableGet() { return variableGet;  },
  getScriptBaseVariableSet() { return variableSet;  },
}

function register() {
  registerScriptBase();
  registerScriptGraphBase();
  registerScriptVariableBase();
  registerDebugBase();
  registerTypeBase();

  OperatorBlocks.register();
  ControlBlocks.register();
  LogicBlocks.register();
}

let blockIn : BlockRegData;
let blockOut : BlockRegData;
let graphIn : BlockRegData;
let graphOut : BlockRegData;
let graphCall : BlockRegData;
let variableGet : BlockRegData;
let variableSet : BlockRegData;

function registerScriptBase()  {

  blockIn = new BlockRegData("0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F", "脚本入口");
  blockOut = new BlockRegData("77885802-92C8-569B-1E7F-48938943A549", "脚本出口");

  blockIn.baseInfo.author = 'imengyu';
  blockIn.baseInfo.description = "脚本入口，脚本在这里开始运行";
  blockIn.baseInfo.category = '基础/脚本';
  blockIn.baseInfo.version = '2.0';
  blockIn.baseInfo.logo = require('../../assets/images/BlockIcon/entry_go.svg');
  blockIn.ports = [
    {
      name: "脚本开始",
      description: '脚本在这里开始运行',
      direction: 'output',
      guid: 'START',
      defaultConnectPort: true,
      paramType: 'execute',
    },
  ]
  blockIn.callbacks.onCreate = () => {};
  blockIn.callbacks.onPortActive = (block, port) => {};
  blockIn.callbacks.onPortUpdate = (block, port) => {};
  blockIn.settings.oneBlockOnly = true;
  blockIn.type = 'base';
  blockIn.blockStyle.titleBakgroundColor = "rgba(25,25,112,0.6)";

  blockOut.baseInfo.author = 'imengyu';
  blockOut.baseInfo.description = "脚本出口，调用此单元结束整个脚本的运行";
  blockOut.baseInfo.category = '基础/脚本';
  blockOut.baseInfo.version = '2.0';
  blockOut.baseInfo.logo = require('../../assets/images/BlockIcon/entry_exit.svg');
  blockOut.ports = [
    {
      name: "结束脚本",
      description: '',
      direction: 'input',
      guid: 'END',
      defaultConnectPort: false,
      paramType: 'execute',
    },
  ]
  blockOut.callbacks.onCreate = () => {};
  blockOut.callbacks.onPortActive = (block, port) => block.currentRunningContext.runner.notifyEnd();
  blockOut.callbacks.onPortUpdate = (block, port) => {};
  blockOut.type = 'base';
  blockOut.settings.oneBlockOnly = true;
  blockOut.blockStyle.titleBakgroundColor = "rgba(112,30,133,0.6)";

  BlockServiceInstance.registerBlock(blockIn, false);
  BlockServiceInstance.registerBlock(blockOut, false);
}
function registerScriptVariableBase()  {

  variableGet = new BlockRegData("886A9FB9-095C-0708-B347-D2AEC6C59F05", "获取变量");
  variableSet = new BlockRegData("1CD2A867-30A6-11CB-AC7F-47B524D3063D", "设置变量");

  //获取变量

  variableGet.baseInfo.author = 'imengyu';
  variableGet.baseInfo.description = "获取变量的值";
  variableGet.baseInfo.category = '基础';
  variableGet.baseInfo.version = '2.0';
  variableGet.type = 'base';
  variableGet.callbacks.onCreate = (block) => {

    if(CommonUtils.isNullOrEmpty(block.options['variable']))
      return;
    
    //添加端口
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    let port : BlockPort = null;

    block.data['portGuid'] = StringUtils.strToHexCharCode(block.options['variable'], false);

    if(variable != null) {
      port = block.addPort({
        guid: block.data['portGuid'],
        direction: 'output',
        paramType: ParamTypeServiceInstance.getBaseTypeForCustomType(variable.type),
        paramCustomType: variable.type,
        name: block.options['variable'],
      }, false, variable.defaultValue);

      block.data['variable_changeCallback'] = variable.changeCallbacks.addListener(this, (v) => {
        port.setValue(v.value);
        port.update();
      });

      block.data['variable_canuse'] = true;
    }
  };
  variableGet.callbacks.onEditorCreate = (block) => {
    if(block.data['variable_canuse']) {

      let port = block.getPortByGUID(block.data['portGuid']);
      let variable = block.currentGraph.findGraphVariable(block.options['variable']);

      block.name = '获取变量 ' + variable.name + ' 的值';
      block.blockStyleSettings.titleBakgroundColor = CanvasUtils.colorStrWithAlpha(ParamTypeServiceInstance.getTypeColor(variable.type), 0.3);
      block.data['onVariableRemove'] = block.editor.editorEvents.onVariableRemove.addListener(this, (graph, variable) => {
        if(graph == block.currentGraph && variable.name == block.options['variable'])
          block.editor.deleteBlock(block, true);
      });
      block.data['onVariableUpdate'] = block.editor.editorEvents.onVariableUpdate.addListener(this, (graph, variableOldName, variable) => {
        if(graph == block.currentGraph && (variable.name == block.options['variable'] || variableOldName == block.options['variable'])) {
          block.options['variable'] = variable.name;

          port.paramType = ParamTypeServiceInstance.getBaseTypeForCustomType(variable.type);
          port.paramCustomType = variable.type;
          port.paramDefaultValue = variable.defaultValue;
          port.name = variable.name;
          
          block.updatePort(port);
        }
      });
    } else block.addBottomTip('icon-error-', '变量丢失，请重新添加', 'text-warning', true);
  };
  variableGet.callbacks.onStartRun = (block) => {
    //更新参数端口
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    let portGuid = StringUtils.strToHexCharCode(block.options['variable'], false);
    let port = block.getPortByGUID(portGuid);
    if(variable != null && port != null)  {
      port.setValue(variable.value);
      port.update();
    }
  };
  variableGet.callbacks.onDestroy = (block) => {
    
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    if(variable != null) {
      variable.changeCallbacks.removeListener(<number>block.data['variable_changeCallback']);

      if(block.isEditorBlock) {
        let blockEditor = (<BlockEditor>block);
        blockEditor.editor.editorEvents.onVariableUpdate.removeListener(<number>block.data['onVariableUpdate']);
        blockEditor.editor.editorEvents.onVariableRemove.removeListener(<number>block.data['onVariableRemove']);
      }
    }
  };
  variableGet.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  variableGet.blockStyle.noTitle = true;
  variableGet.hideInAddPanel = true;

  //设置变量

  variableSet.baseInfo.author = 'imengyu';
  variableSet.baseInfo.description = "设置变量的值";
  variableSet.baseInfo.category = '基础';
  variableSet.baseInfo.version = '2.0';
  variableSet.type = 'base';
  variableSet.ports = [
    {
      guid: 'PI0',
      paramType: 'execute',
      direction: 'input'
    },
    {
      guid: 'PO0',
      paramType: 'execute',
      direction: 'output'
    },
  ];
  variableSet.callbacks.onCreate = (block) => {
    
    //添加端口
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    let portIn : BlockPort = null;
    let portOut : BlockPort = null;

    let portInGuid = StringUtils.strToHexCharCode(block.options['variable'] + '_I', false);
    let portOutGuid = StringUtils.strToHexCharCode(block.options['variable'] + '_O', false);

    block.data['portInGuid'] = portInGuid;
    block.data['portOutGuid'] = portOutGuid;

    if(variable != null) {
      portIn = block.addPort({
        guid: portInGuid,
        direction: 'input',
        paramType: ParamTypeServiceInstance.getBaseTypeForCustomType(variable.type),
        paramCustomType: variable.type,
        paramDefaultValue: variable.defaultValue,
      }, false, variable.defaultValue);
      portOut = block.addPort({
        guid: portOutGuid,
        direction: 'output',
        paramType: ParamTypeServiceInstance.getBaseTypeForCustomType(variable.type),
        paramCustomType: variable.type,
        name: block.options['variable'],
      }, false, variable.defaultValue);

      block.data['variable_changeCallback'] = variable.changeCallbacks.addListener(this, (v) => {
        portOut.setValue(v.value);
        portOut.update();
      });
    }

    block.data['variable_canuse'] = true;
  };
  variableSet.callbacks.onEditorCreate = (block) => {

    if(block.data['variable_canuse']) {

      let portIn = block.getPortByGUID(block.data['portInGuid']);
      let portOut = block.getPortByGUID(block.data['portOutGuid']);

      let variable = block.currentGraph.findGraphVariable(block.options['variable']);
      block.name = '设置变量 ' + variable.name + ' 的值';
      block.blockStyleSettings.titleBakgroundColor = CanvasUtils.colorStrWithAlpha(ParamTypeServiceInstance.getTypeColor(variable.type), 0.3);

      block.data['onVariableRemove'] = block.editor.editorEvents.onVariableRemove.addListener(this, (graph, variable) => {
        if(graph == block.currentGraph && variable.name == block.options['variable'])
          block.editor.deleteBlock(block, true);
      });
      block.data['onVariableUpdate'] = block.editor.editorEvents.onVariableUpdate.addListener(this, (graph, variableOldName, variable) => {
        if(graph == block.currentGraph && (variable.name == block.options['variable'] || variableOldName == block.options['variable'])) {
          block.options['variable'] = variable.name

          portIn.paramType = ParamTypeServiceInstance.getBaseTypeForCustomType(variable.type);
          portIn.paramCustomType = variable.type;
          portIn.paramDefaultValue = variable.defaultValue;

          block.updatePort(portIn);

          portOut.paramType = ParamTypeServiceInstance.getBaseTypeForCustomType(variable.type);
          portOut.paramCustomType = variable.type;
          portOut.paramDefaultValue = variable.defaultValue;
          portOut.name = variable.name;

          block.updatePort(portOut);

          block.name = '设置变量 ' + variable.name + ' 的值';
          block.blockStyleSettings.titleBakgroundColor = ParamTypeServiceInstance.getTypeColor(variable.type);
          block.updateContent();
        }
      });

    } else block.addBottomTip('icon-error-', '变量丢失，请重新添加', 'text-warning', true);
  };
  variableSet.callbacks.onPortActive = (block, port) => {
    if(port.guid == 'PI0') {
      let variable = block.currentGraph.findGraphVariable(block.options['variable']);
      if(variable != null) {
        let val = block.getInputParamValue(block.data['portInGuid']);
        variable.set(val);
      }else {
        logger.error('[Set variable] variable ' + block.options['variable'] + ' not found !');
      }

      block.activeOutputPort('PO0');
    }
  };
  variableSet.callbacks.onDestroy = (block) => {
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    if(variable != null) {
      variable.changeCallbacks.removeListener(<number>block.data['variable_changeCallback']);

      if(block.isEditorBlock) {
        let blockEditor = (<BlockEditor>block);
        blockEditor.editor.editorEvents.onVariableUpdate.removeListener(<number>blockEditor.data['onVariableUpdate']);
        blockEditor.editor.editorEvents.onVariableRemove.removeListener(<number>blockEditor.data['onVariableRemove']);
      }
    }
  };
  variableSet.hideInAddPanel = true;

  BlockServiceInstance.registerBlock(variableSet, false);
  BlockServiceInstance.registerBlock(variableGet, false);
}
function registerScriptGraphBase()  {

  graphIn = new BlockRegData("CC4BE0CB-AA1D-7FD9-DF29-71701BE69254", "输入");
  graphOut = new BlockRegData("6BA2899B-BD12-1E0B-D958-EB5C8C698319", "输出");
  graphCall = new BlockRegData("9EA376CE-492D-7EDD-4531-9B043CBAC707", "调用");

  //输入

  graphIn.baseInfo.author = 'imengyu';
  graphIn.baseInfo.description = "输入此图表";
  graphIn.baseInfo.category = '基础/脚本';
  graphIn.baseInfo.version = '2.0';
  graphIn.baseInfo.logo = require('../../assets/images/BlockIcon/entry_go.svg');
  graphIn.type = 'base';
  graphIn.callbacks.onCreate = (block) => {
    block.currentGraph.inputPorts.forEach(element => block.addPort(element, false, element.paramDefaultValue, 'output'));
  };
  graphIn.callbacks.onEditorCreate = (block) => {

    if(block.currentGraph.isMainGraph) {
      block.addBottomTip('icon-error-1', '主图表不能有输入输出', 'text-warning');
      return;
    }

    block.data['onGraphPortAdd'] = block.editor.editorEvents.onGraphPortAdd.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input') 
        block.addPort(port, false, port.paramDefaultValue, 'output');
    });
    block.data['onGraphPortRemove'] = block.editor.editorEvents.onGraphPortRemove.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input')
        block.deletePort(port.guid);
    });
    block.data['onGraphPortUpdate'] = block.editor.editorEvents.onGraphPortUpdate.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input') {
        let portReal = block.getPortByGUID(port.guid);
        portReal.paramType = port.paramType;
        portReal.paramCustomType = port.paramCustomType;
        portReal.paramDefaultValue = port.paramDefaultValue;
        block.updatePort(portReal);
      }
    });
    block.data['onGraphPortMoveDown'] = block.editor.editorEvents.onGraphPortMoveDown.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input')
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'down');
    });
    block.data['onGraphPortMoveUp'] = block.editor.editorEvents.onGraphPortMoveUp.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input') 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'up');
    });
    
  };
  graphIn.callbacks.onPortActive = (block, port) => {

  };
  graphIn.callbacks.onPortUpdate = (block, port) => {

  };
  graphIn.callbacks.onDestroy = (block) => {
    
    if(block.isEditorBlock) {
      let blockEditor = (<BlockEditor>block);
      blockEditor.editor.editorEvents.onGraphPortAdd.removeListener(<number>blockEditor.data['onGraphPortAdd']);
      blockEditor.editor.editorEvents.onGraphPortRemove.removeListener(<number>blockEditor.data['onGraphPortRemove']);
      blockEditor.editor.editorEvents.onGraphPortUpdate.removeListener(<number>blockEditor.data['onGraphPortUpdate']);
      blockEditor.editor.editorEvents.onGraphPortMoveDown.removeListener(<number>blockEditor.data['onGraphPortMoveDown']);
      blockEditor.editor.editorEvents.onGraphPortMoveUp.removeListener(<number>blockEditor.data['onGraphPortMoveUp']);
    }
  };
  graphIn.settings.oneBlockOnly = true;
  graphIn.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";

  //输出

  graphOut.baseInfo.author = 'imengyu';
  graphOut.baseInfo.description = "从此图表输出";
  graphOut.baseInfo.category = '基础/脚本';
  graphOut.baseInfo.version = '2.0';
  graphOut.baseInfo.logo = require('../../assets/images/BlockIcon/entry_exit.svg');
  graphOut.type = 'base';
  graphOut.callbacks.onCreate = (block) => {
    block.currentGraph.outputPorts.forEach(element => block.addPort(element, false, element.paramDefaultValue, 'input'));
  };
  graphOut.callbacks.onEditorCreate = (block) => {

    if(block.currentGraph.isMainGraph) {
      block.addBottomTip('icon-error-1', '主图表不能有输入输出', 'text-warning');
      return;
    }

    block.data['onGraphPortAdd'] = block.editor.editorEvents.onGraphPortAdd.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.addPort(port, false, port.paramDefaultValue, 'input');
    });
    block.data['onGraphPortRemove'] = block.editor.editorEvents.onGraphPortRemove.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.deletePort(port.guid);
    });
    block.data['onGraphPortUpdate'] = block.editor.editorEvents.onGraphPortUpdate.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') {
        let portReal = block.getPortByGUID(port.guid);
        portReal.paramType = port.paramType;
        portReal.paramCustomType = port.paramCustomType;
        portReal.paramDefaultValue = port.paramDefaultValue;
        block.updatePort(portReal);
      }
    });
    block.data['onGraphPortMoveDown'] = block.editor.editorEvents.onGraphPortMoveDown.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'down');
    });
    block.data['onGraphPortMoveUp'] = block.editor.editorEvents.onGraphPortMoveUp.addListener(this, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'up');
    });
  };
  graphOut.callbacks.onPortActive = (block, port) => {
    
  };
  graphOut.callbacks.onPortUpdate = (block, port) => {

  };
  graphOut.callbacks.onDestroy = (block) => {
    
    if(block.isEditorBlock) {
      let blockEditor = (<BlockEditor>block);
      blockEditor.editor.editorEvents.onGraphPortAdd.removeListener(<number>blockEditor.data['onGraphPortAdd']);
      blockEditor.editor.editorEvents.onGraphPortRemove.removeListener(<number>blockEditor.data['onGraphPortRemove']);
      blockEditor.editor.editorEvents.onGraphPortUpdate.removeListener(<number>blockEditor.data['onGraphPortUpdate']);
      blockEditor.editor.editorEvents.onGraphPortMoveDown.removeListener(<number>blockEditor.data['onGraphPortMoveDown']);
      blockEditor.editor.editorEvents.onGraphPortMoveUp.removeListener(<number>blockEditor.data['onGraphPortMoveUp']);
    }
  };
  graphOut.settings.oneBlockOnly = true;
  graphOut.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";

  //输出

  graphCall.baseInfo.author = 'imengyu';
  graphCall.baseInfo.description = "调用子图表";
  graphCall.baseInfo.category = '基础/脚本';
  graphCall.baseInfo.version = '2.0';
  graphCall.type = 'normal';
  graphCall.callbacks.onCreate = (block) => {
    let currentGraph : BlockGraphDocunment = block.options['graph'] == block.currentGraph.name ? 
      block.currentGraph : block.currentGraph.findChildGraph(block.options['graph']); 
    block.data['currentGraph'] = currentGraph;
    if(currentGraph == null)
      return;

    currentGraph.inputPorts.forEach(element => block.addPort(element, false, element.paramDefaultValue, 'input'));
    currentGraph.outputPorts.forEach(element => block.addPort(element, false, element.paramDefaultValue, 'output'));
  };
  graphCall.callbacks.onEditorCreate = (block) => {

    let currentGraph = (<BlockGraphDocunment>block.data['currentGraph']);
    
    if(currentGraph == null) {
      block.addBottomTip('icon-error-1','没有找到子图表 ' + block.options['graph'],'text-warning');
      return;
    }

    block.blockMenuSettings.items = [
      {
        label: '编辑 ' + currentGraph.name,
        onClick: () => block.editor.openGraph(currentGraph)
      }
    ];
    block.el.addEventListener('dblclick ', (e : MouseEvent) => {
      if(e.button == 0)
        block.editor.openGraph(currentGraph);
    });

    block.name = '调用子图表 ' + currentGraph.name;
    block.description = '调用一个子图表，并返回值\n' + currentGraph.name + '\n' + currentGraph.comment;

    block.data['onGraphPortAdd'] = block.editor.editorEvents.onGraphPortAdd.addListener(this, (graph, port) => {
      if(graph == currentGraph) 
        block.addPort(port, false, port.paramDefaultValue, 'input');
    });
    block.data['onGraphPortRemove'] = block.editor.editorEvents.onGraphPortRemove.addListener(this, (graph, port) => {
      if(graph == currentGraph) 
        block.deletePort(port.guid);
    });
    block.data['onGraphPortUpdate'] = block.editor.editorEvents.onGraphPortUpdate.addListener(this, (graph, port) => {
      if(graph == currentGraph) {
        let portReal = block.getPortByGUID(port.guid);
        portReal.paramType = port.paramType;
        portReal.paramCustomType = port.paramCustomType;
        portReal.paramDefaultValue = port.paramDefaultValue;
        block.updatePort(portReal);
      }
    });
    block.data['onGraphPortMoveDown'] = block.editor.editorEvents.onGraphPortMoveDown.addListener(this, (graph, port) => {
      if(graph == currentGraph) 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'down');
    });
    block.data['onGraphPortMoveUp'] = block.editor.editorEvents.onGraphPortMoveUp.addListener(this, (graph, port) => {
      if(graph == currentGraph) 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'up');
    });
    block.data['onGraphUpdate'] = block.editor.editorEvents.onGraphUpdate.addListener(this, (graph) => {
      if(graph == currentGraph) {
        block.name = '调用子图表 ' + currentGraph.name;
        block.description = '调用一个子图表，并返回值\n' + currentGraph.name + '\n' + currentGraph.comment;
      }
    });
    block.data['onGraphDelete'] = block.editor.editorEvents.onGraphDelete.addListener(this, (graph) => {
      if(graph == currentGraph) 
        block.editor.deleteBlock(block, true);
    });
  };
  graphCall.callbacks.onPortActive = (block, port) => {
    
  };
  graphCall.callbacks.onPortUpdate = (block, port) => {

  };
  graphCall.callbacks.onDestroy = (block) => {
    
    if(block.isEditorBlock) {
      let blockEditor = (<BlockEditor>block);
      blockEditor.editor.editorEvents.onGraphPortAdd.removeListener(<number>blockEditor.data['onGraphPortAdd']);
      blockEditor.editor.editorEvents.onGraphPortRemove.removeListener(<number>blockEditor.data['onGraphPortRemove']);
      blockEditor.editor.editorEvents.onGraphPortUpdate.removeListener(<number>blockEditor.data['onGraphPortUpdate']);
      blockEditor.editor.editorEvents.onGraphPortMoveDown.removeListener(<number>blockEditor.data['onGraphPortMoveDown']);
      blockEditor.editor.editorEvents.onGraphPortMoveUp.removeListener(<number>blockEditor.data['onGraphPortMoveUp']);
      blockEditor.editor.editorEvents.onGraphDelete.removeListener(<number>blockEditor.data['onGraphDelete']);
    }
  };
  graphCall.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  graphCall.hideInAddPanel = true;

  BlockServiceInstance.registerBlock(graphIn, false);
  BlockServiceInstance.registerBlock(graphOut, false);
  BlockServiceInstance.registerBlock(graphCall, false);
}
function registerDebugBase() {

  ParamTypeServiceInstance.registerCustomType(new BlockParameterEnumRegData("DebugLogLevel", [
    'log','info','warn','error'
  ], '#F7C709'));

  let blockDebug = new BlockRegData("4B6EA737-9702-A383-A268-AADC332038DF", "输出日志");
  let blockModal = new BlockRegData("CB1FB757-631D-8A95-0AB1-3CB28CB04FBC", "显示一个信息对话框");
  let blockConfirm = new BlockRegData("84AB5443-1998-B4FB-773A-5F41F364BB7A", "显示一个确认对话框");
  let blockDelay = new BlockRegData("6C01D858-CF4D-D9EF-C18E-DE5DAE400702", "延时");

  blockDelay.baseInfo.author = 'imengyu';
  blockDelay.baseInfo.description = "延迟流程图的运行";
  blockDelay.baseInfo.category = '基础';
  blockDelay.baseInfo.version = '2.0';
  blockDelay.baseInfo.logo = require('../../assets/images/BlockIcon/clock.svg');
  blockDelay.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: '00000001',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "",
      description: '',
      direction: 'output',
      guid: '00000002',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "时长",
      description: '延迟时长（毫秒）',
      direction: 'input',
      guid: '00000003',
      paramType: 'number',
      paramCustomType: '',
      paramDefaultValue: 1000,
      defaultConnectPort: false,
    },
  ];
  blockDelay.callbacks.onCreate = (block) => {};
  blockDelay.callbacks.onPortActive = (block, port) => {
    let v = block.getInputParamValue('00000003');
    setTimeout(() => block.activeOutputPortInNewContext('00000002'), v ? v : 1000);
  };
  blockDelay.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";
  blockDelay.blockStyle.logoRight = blockDelay.baseInfo.logo;

  blockDebug.baseInfo.author = 'imengyu';
  blockDebug.baseInfo.description = "输出调试日志至控制台";
  blockDebug.baseInfo.category = '基础/调试';
  blockDebug.baseInfo.version = '2.0';
  blockDebug.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUT',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "输出",
      direction: 'input',
      guid: 'PRINT',
      paramType: 'any',
      paramCustomType: 'any',
      paramDefaultValue: null,
      defaultConnectPort: false,
    },
    {
      name: "等级",
      direction: 'input',
      guid: 'LEVEL',
      paramType: 'enum',
      paramCustomType: 'DebugLogLevel',
      paramDefaultValue: 'log',
      defaultConnectPort: false,
    },
  ];
  blockDebug.callbacks.onCreate = (block) => {
  };
  blockDebug.callbacks.onPortActive = (block, port) => {
    let paramInput = block.getInputParamValue('PRINT');
    let paramLevel = block.getInputParamValue('LEVEL');

    switch(paramLevel) {
      case 'log':
        console.log(paramInput);
        break;
      case 'info':
        console.info(paramInput);
        break; 
      case 'warn':
        console.warn(paramInput);
        break;
      case 'error':
        console.error(paramInput);
        break;
    }

    block.activeOutputPort('OUT');
  };
  blockDebug.callbacks.onPortUpdate = (block, port) => {};
  blockDebug.callbacks.onCreateCustomEditor = null;
  blockDebug.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  //blockModal
  //===================

  blockModal.baseInfo.author = 'imengyu';
  blockModal.baseInfo.description = "显示一个对话框";
  blockModal.baseInfo.category = '基础/调试';
  blockModal.baseInfo.version = '2.0';
  blockModal.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUT',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "标题",
      direction: 'input',
      guid: 'TITLE',
      paramType: 'string',
      defaultConnectPort: false,
    },
    {
      name: "文字",
      direction: 'input',
      guid: 'TEXT',
      paramType: 'string',
      defaultConnectPort: false,
    },
    {
      name: "等级",
      direction: 'input',
      guid: 'LEVEL',
      paramType: 'enum',
      paramCustomType: 'DebugLogLevel',
      paramDefaultValue: 'log',
      defaultConnectPort: false,
    },
  ];
  blockModal.callbacks.onCreate = (block) => {
  };
  blockModal.callbacks.onPortActive = (block, port) => {
    let paramText = block.getInputParamValue('TEXT');
    let paramTitle = block.getInputParamValue('TITLE');
    let paramLevel = block.getInputParamValue('LEVEL');

    DebugWorkProviderInstance.ModalProvider(<string>paramLevel, <string>paramTitle, <string>paramText, () => {
      block.activeOutputPortInNewContext('OUT');
    });
  };
  blockModal.callbacks.onPortUpdate = (block, port) => {};
  blockModal.callbacks.onCreateCustomEditor = null;
  blockModal.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  //Confirm
  //====================

  blockConfirm.baseInfo.author = 'imengyu';
  blockConfirm.baseInfo.description = "显示一个确认对话框，用户可选择确认或取消";
  blockConfirm.baseInfo.category = '基础/调试';
  blockConfirm.baseInfo.version = '2.0';
  blockConfirm.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      name: "点击确认",
      description: '用户点击了确认按钮',
      direction: 'output',
      guid: 'OUTCON',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "点击取消",
      description: '用户点击了取消按钮',
      paramType: 'execute',
      direction: 'output',
      guid: 'OUTCAN',
      defaultConnectPort: false,
    },
    {
      name: "标题",
      direction: 'input',
      guid: 'TITLE',
      paramType: 'string',
      defaultConnectPort: false,
    },
    {
      name: "文字",
      direction: 'input',
      guid: 'TEXT',
      paramType: 'string',
      defaultConnectPort: false,
    },
  ];
  blockConfirm.callbacks.onCreate = (block) => {
  };
  blockConfirm.callbacks.onPortActive = (block, port) => {
    
    DebugWorkProviderInstance.ConfirmModalProvider(<string>block.getInputParamValue('TITLE'), 
      <string>block.getInputParamValue('TEXT'), () => {
        block.activeOutputPortInNewContext('OUTCON');
      }, () => {
        block.activeOutputPortInNewContext('OUTCAN');
      });

  };
  blockConfirm.callbacks.onPortUpdate = (block, port) => {};
  blockConfirm.callbacks.onCreateCustomEditor = null;
  blockConfirm.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  BlockServiceInstance.registerBlock(blockDelay, false);
  BlockServiceInstance.registerBlock(blockConfirm, false);
  BlockServiceInstance.registerBlock(blockDebug, false);
  BlockServiceInstance.registerBlock(blockModal, false);
}
function registerTypeBase() {

  let comUppdateFn = (block, port) => {
    block.setOutputParamValue('00000002', block.getInputParamValue('00000001'));
  };

  let block = new BlockRegData("A81899CF-766B-F511-B179-90A81BBB088B", "字符串", "字符串 string 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/string.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'string',
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'string',
    },
  ];
  block.callbacks.onPortUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(255,20,147,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);

  block = new BlockRegData("EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5", "数字", "数字 number 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/number.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'number',
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'number',
    },
  ];
  block.callbacks.onPortUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(158,258,68,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);

  block = new BlockRegData("6CE4CA4F-E2F9-AD97-3F83-1B60289C9290", "BigInt", "BigInt 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/bigint.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'bigint',
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'bigint',
    },
  ];
  block.callbacks.onPortUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(0,168,243,0.5)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);

  block = new BlockRegData("90833609-8CF7-2324-A4C0-781344701C06", "布尔值", "布尔 boolean 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/boolean.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'boolean',
      paramDefaultValue: true,
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'boolean',
    },
  ];
  block.callbacks.onPortUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(180,0,0,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);
}