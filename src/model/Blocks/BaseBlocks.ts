import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import DebugWorkProviderInstance from "../WorkProvider/DebugWorkProvider";
import CommonUtils from "../../utils/CommonUtils";
import StringUtils from "../../utils/StringUtils";
import CanvasUtils from "../../utils/CanvasUtils";
import logger from "../../utils/Logger";
import { BlockGraphDocunment, BlockGraphVariable } from "../Define/BlockDocunment";
import { BlockParameterEnumRegData, BlockParameterTypeConverterData, BlockRegData } from "../Define/BlockDef";
import { BlockPort } from "../Define/Port";
import { BlockEditor } from "../Editor/BlockEditor";
import { Block } from "../Define/Block";
import { BlockRunContextData } from "../Runner/BlockRunContextData";
import { BlockParameterType, cloneParameterTypeFromString, createParameterTypeFromString } from "../Define/BlockParameterType";
import { Vector2 } from "../Vector2";
import { Rect } from "../Rect";
import BlockServiceInstance from "@/sevices/BlockService";
import BlockRegister from "./Utils/BlockRegister";

export default { 
  register,
  getScriptBaseBlockIn() { return blockIn; },
  getScriptBaseBlockOut() { return blockOut;  },
  getScriptBaseGraphIn() { return graphIn; },
  getScriptBaseGraphOut() { return graphOut;  },
  getScriptBaseGraphCall() { return graphCall;  },
  getScriptBaseVariableGet() { return variableGet;  },
  getScriptBaseVariableSet() { return variableSet;  },
  getScriptBaseCommentBlock() { return commentBlock;  },
  getScriptBaseConvertBlock() { return convertBlock;  },
  packageName: 'Base',
  version: 1,
}

function register() {

  //注册转换方法
  registerBaseConverters();

  return registerScriptBase().concat(
    registerScriptGraphBase(),
    registerScriptVariableBase(),
    registerDebugBase(),
    registerTypeBase(),
    registerLoadLib(),
    registerCommentBlock(),
    registerConvertBlock(),
    registerConnBlock(),
  );
}

function registerBaseConverters() {
  let anyStringConverter = (v : any) => { return '' + v };

  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('number'),
    toType: createParameterTypeFromString('string'), 
    allowSetType: 'variable', 
    converter: anyStringConverter
  });
  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('bigint'),
    toType: createParameterTypeFromString('string'), 
    allowSetType: 'variable', 
    converter: anyStringConverter
  });
  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('boolean'),
    toType: createParameterTypeFromString('string'), 
    allowSetType: 'variable', 
    converter: anyStringConverter
  });
  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('object'),
    toType: createParameterTypeFromString('string'), 
    allowSetType: 'variable', 
    converter: anyStringConverter
  });

  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('string'),
    toType: createParameterTypeFromString('number'), 
    allowSetType: 'variable', 
    converter: (v) => parseFloat(v)
  });
  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('string'),
    toType: createParameterTypeFromString('boolean'), 
    allowSetType: 'variable', 
    converter: (v : string) => !StringUtils.isNullOrEmpty(v) && (v.toLowerCase() == 'true')
  });
  ParamTypeServiceInstance.registerTypeCoverter({
    fromType: createParameterTypeFromString('any'),
    toType: createParameterTypeFromString('string'), 
    allowSetType: 'variable', 
    converter: (v : any) => v + ''
  });
}

let blockIn : BlockRegData;
let blockOut : BlockRegData;
let graphIn : BlockRegData;
let graphOut : BlockRegData;
let graphCall : BlockRegData;
let variableGet : BlockRegData;
let variableSet : BlockRegData;
let commentBlock : BlockRegData;
let convertBlock : BlockRegData;

function registerScriptBase()  {

  blockIn = new BlockRegData('0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F', '脚本入口', '脚本在这里开始运行');
  blockOut = new BlockRegData('77885802-92C8-569B-1E7F-48938943A549', '脚本出口', '调用此单元结束整个脚本的运行');

  blockIn.baseInfo.author = 'imengyu';
  blockIn.baseInfo.category = '基础/脚本';
  blockIn.baseInfo.version = '2.0';
  blockIn.baseInfo.logo = require('../../assets/images/BlockIcon/entry_go.svg');
  blockIn.ports = [
    {
      name: "脚本开始",
      direction: 'output',
      guid: 'START',
      defaultConnectPort: true,
      paramType: 'execute',
    },
  ]
  blockIn.callbacks.onAddCheck = (blockRegData, graph) => {
    if(!graph.isMainGraph)
      return '只能在主图表中添加脚本开始单元';
    return null;
  };
  blockIn.settings.oneBlockOnly = true;
  blockIn.type = 'base';
  blockIn.blockStyle.titleBakgroundColor = "rgba(25,25,112,0.6)";

  blockOut.baseInfo.author = 'imengyu';
  blockOut.baseInfo.category = '基础/脚本';
  blockOut.baseInfo.version = '2.0';
  blockOut.baseInfo.logo = require('../../assets/images/BlockIcon/entry_exit.svg');
  blockOut.ports = [
    {
      name: "结束脚本",
      direction: 'input',
      guid: 'END',
      defaultConnectPort: false,
      paramType: 'execute',
    },
  ]
  blockOut.callbacks.onPortExecuteIn = (block, port) => block.currentRunner.notifyEnd(block.currentRunningContext);
  blockOut.type = 'base';
  blockOut.blockStyle.titleBakgroundColor = "rgba(112,30,133,0.6)";

  return [ blockIn, blockOut ];
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

    block.data['variableReal'] = variable;
    block.data['portGuid'] = StringUtils.strToHexCharCode(block.options['variable'], false);

    if(variable != null) {
      port = block.addPort({
        guid: block.data['portGuid'],
        direction: 'output',
        paramType: variable.type,
        paramDictionaryKeyType: variable.dictionaryKeyType,
        paramSetType: variable.setType,
        paramRefPassing: true,
        paramStatic: true,
        name: block.options['variable'],
      }, false, variable.defaultValue);

      block.data['variable_canuse'] = true;
    }
  };
  variableGet.callbacks.onEditorCreate = (block) => {
    if(block.data['variable_canuse']) {

      let port = block.getPortByGUID(block.data['portGuid']);
      let variable = block.currentGraph.findGraphVariable(block.options['variable']);

      block.name = '获取变量 ' + variable.name + ' 的值';
      block.blockStyleSettings.titleBakgroundColor = CanvasUtils.colorStrWithAlpha(ParamTypeServiceInstance.getTypeColor(variable.type.toString()), 0.3);
      block.data['onVariableRemove'] = block.editor.editorEvents.onVariableRemove.addListener(null, (graph, variable) => {
        if(graph == block.currentGraph && variable.name == block.options['variable'])
          block.editor.deleteBlock(block, true);
      });
      block.data['onVariableUpdate'] = block.editor.editorEvents.onVariableUpdate.addListener(null, (graph, variableOldName, variable) => {
        if(graph == block.currentGraph && (variable.name == block.options['variable'] || variableOldName == block.options['variable'])) {
          block.options['variable'] = variable.name;

          port.paramType.set(variable.type);
          port.paramDefaultValue = variable.defaultValue;
          port.paramDictionaryKeyType.set(variable.dictionaryKeyType);
          port.paramSetType = variable.setType;
          port.name = variable.name;
          
          block.updatePort(port);
        }
      });
    } else block.addBottomTip('icon-error-', '变量丢失，请重新添加', 'text-warning', true);
  };
  variableGet.callbacks.onPortParamRequest = (block, port, context) => {
    let variableReal = <BlockGraphVariable>block.data['variableReal'];
    port.updateOnputValue(context, variableReal.get(context));
  };
  variableGet.callbacks.onDestroy = (block) => {
    
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    if(variable != null) {
      if(block.isEditorBlock) {
        let blockEditor = (<BlockEditor>block);
        blockEditor.editor.editorEvents.onVariableUpdate.removeListener(<number>block.data['onVariableUpdate']);
        blockEditor.editor.editorEvents.onVariableRemove.removeListener(<number>block.data['onVariableRemove']);
      }
    }
  };
  variableGet.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  variableGet.blockStyle.noTitle = true;
  variableGet.settings.hideInAddPanel = true;

  //设置变量

  variableSet.baseInfo.author = 'imengyu';
  variableSet.baseInfo.description = "设置变量值";
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
    let portOut : BlockPort = null;

    let portInGuid = StringUtils.strToHexCharCode(block.options['variable'] + '_I', false);
    let portOutGuid = StringUtils.strToHexCharCode(block.options['variable'] + '_O', false);

    block.data['variableReal'] = variable;
    block.data['portInGuid'] = portInGuid;
    block.data['portOutGuid'] = portOutGuid;

    if(variable != null) {
      block.addPort({
        guid: portInGuid,
        direction: 'input',
        paramType: variable.type,
        paramDefaultValue: variable.defaultValue,
        paramDictionaryKeyType: variable.dictionaryKeyType,
        paramSetType: variable.setType,
      }, false, variable.defaultValue);
      portOut = block.addPort({
        guid: portOutGuid,
        direction: 'output',
        paramType: variable.type,
        paramDictionaryKeyType: variable.dictionaryKeyType,
        paramSetType: variable.setType,
        paramRefPassing: true,
        name: block.options['variable'],
      }, false, variable.defaultValue);
    }

    block.data['variable_canuse'] = true;
  };
  variableSet.callbacks.onEditorCreate = (block) => {

    if(block.data['variable_canuse']) {

      let portIn = block.getPortByGUID(block.data['portInGuid']);
      let portOut = block.getPortByGUID(block.data['portOutGuid']);

      let variable = block.currentGraph.findGraphVariable(block.options['variable']);
      block.name = '设置 ' + variable.name;
      block.blockStyleSettings.titleBakgroundColor = CanvasUtils.colorStrWithAlpha(ParamTypeServiceInstance.getTypeColor(variable.type.toString()), 0.3);

      block.data['onVariableRemove'] = block.editor.editorEvents.onVariableRemove.addListener(null, (graph, variable) => {
        if(graph == block.currentGraph && variable.name == block.options['variable'])
          block.editor.deleteBlock(block, true);
      });
      block.data['onVariableUpdate'] = block.editor.editorEvents.onVariableUpdate.addListener(null, (graph, variableOldName, variable) => {
        if(graph == block.currentGraph && (variable.name == block.options['variable'] || variableOldName == block.options['variable'])) {
          block.options['variable'] = variable.name

          portIn.paramType.set(variable.type);
          portIn.paramDefaultValue = variable.defaultValue;
          portIn.paramDictionaryKeyType.set(variable.dictionaryKeyType);
          portIn.paramSetType = variable.setType;

          block.updatePort(portIn);

          portOut.paramType.set(variable.type);
          portOut.paramDefaultValue = variable.defaultValue;
          portOut.paramDictionaryKeyType.set(variable.dictionaryKeyType);
          portOut.name = variable.name;
          portOut.paramSetType = variable.setType;

          block.updatePort(portOut);

          block.name = '设置变量 ' + variable.name + ' 的值';
          block.blockStyleSettings.titleBakgroundColor = CanvasUtils.colorStrWithAlpha(ParamTypeServiceInstance.getTypeColor(variable.type.toString()), 0.3);
          block.updateContent();
        }
      });

    } else block.addBottomTip('icon-error-', '变量丢失，请重新添加', 'text-warning', true);
  };
  variableSet.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'PI0') {
      let variableReal = <BlockGraphVariable>block.data['variableReal'];
      if(variableReal != null) {
        let val = block.getInputParamValue(block.data['portInGuid']);
        variableReal.set(block.currentRunningContext, val);
      }else {
        logger.error(block.getName(),'变量 ' + block.options['variable'] + ' 未找到!');
      }

      block.activeOutputPort('PO0');
    }
  };
  variableSet.callbacks.onPortParamRequest = (block, port, context) => {
    let variableReal = <BlockGraphVariable>block.data['variableReal'];
    port.updateOnputValue(context, variableReal.get(context));
  };
  variableSet.callbacks.onDestroy = (block) => {
    let variable = block.currentGraph.findGraphVariable(block.options['variable']);
    if(variable != null) {
      if(block.isEditorBlock) {
        let blockEditor = (<BlockEditor>block);
        blockEditor.editor.editorEvents.onVariableUpdate.removeListener(<number>blockEditor.data['onVariableUpdate']);
        blockEditor.editor.editorEvents.onVariableRemove.removeListener(<number>blockEditor.data['onVariableRemove']);
      }
    }
  };
  variableSet.blockStyle.minWidth = '180px';
  variableSet.settings.hideInAddPanel = true;

  return [ variableSet, variableGet ]
}
function registerScriptGraphBase()  {

  graphIn = new BlockRegData("CC4BE0CB-AA1D-7FD9-DF29-71701BE69254", "输入", '输入此图表', 'imengyu', '基础/脚本');
  graphOut = new BlockRegData("6BA2899B-BD12-1E0B-D958-EB5C8C698319", "输出", '从此图表输出', 'imengyu', '基础/脚本');
  graphCall = new BlockRegData("9EA376CE-492D-7EDD-4531-9B043CBAC707", "调用", '调用子图表', 'imengyu', '基础/脚本');

  //输入
  //===============================================================

  graphIn.baseInfo.version = '2.0';
  graphIn.baseInfo.logo = require('../../assets/images/BlockIcon/entry_go.svg');
  graphIn.type = 'base';
  graphIn.callbacks.onCreate = (block) => {
    block.currentGraph.inputPorts.forEach(element => block.addPort(element, false, element.paramDefaultValue, 'output'));
  };
  graphIn.callbacks.onEditorCreate = (block) => {
    block.data['onGraphPortAdd'] = block.editor.editorEvents.onGraphPortAdd.addListener(null, (graph, port) => {
      port.paramRefPassing = true;
      if(graph == block.currentGraph && port.direction == 'input') 
        block.addPort(port, false, port.paramDefaultValue, 'output');
    });
    block.data['onGraphPortRemove'] = block.editor.editorEvents.onGraphPortRemove.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input')
        block.deletePort(port.guid);
    });
    block.data['onGraphPortUpdate'] = block.editor.editorEvents.onGraphPortUpdate.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input') {
        let portReal = block.getPortByGUID(port.guid);
        portReal.name = port.name;
        portReal.paramType = typeof port.paramType === 'string' ? createParameterTypeFromString(port.paramType) : <BlockParameterType>cloneParameterTypeFromString(port.paramType);
        portReal.paramDictionaryKeyType = typeof port.paramDictionaryKeyType === 'string' ? createParameterTypeFromString(port.paramDictionaryKeyType) : <BlockParameterType>cloneParameterTypeFromString(port.paramDictionaryKeyType);
        portReal.paramDefaultValue = port.paramDefaultValue;
        portReal.paramSetType = port.paramSetType;
        portReal.paramRefPassing = true;
        block.updatePort(portReal)
      }
    });
    block.data['onGraphPortMoveDown'] = block.editor.editorEvents.onGraphPortMoveDown.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input')
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'down');
    });
    block.data['onGraphPortMoveUp'] = block.editor.editorEvents.onGraphPortMoveUp.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'input') 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'up');
    });
    
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
  graphIn.callbacks.onAddCheck = (b, graph) => {
    if(graph.isMainGraph)
      return '主图表不能有输入输出';
    return null;
  };
  graphIn.callbacks.onPortParamRequest = (block, port, context) => {
    //子上下文请求父上下文
    let outerBlock = context.outerBlock;
    if(outerBlock == null) {
      logger.error(block.getName(), 'graphIn.onPortParamRequest.' + port.guid + ': Bad context ' + context + ' .');
      return;
    }
    let outerPort = outerBlock.getPortByGUID(port.guid);
    let val = outerPort.rquestInputValue(context.getUpperParentContext());
    port.updateOnputValue(context, val);
  };
  graphIn.settings.oneBlockOnly = true;
  graphIn.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";

  //输出
  //===============================================================

  graphOut.baseInfo.version = '2.0';
  graphOut.baseInfo.logo = require('../../assets/images/BlockIcon/entry_exit.svg');
  graphOut.type = 'base';
  graphOut.callbacks.onCreate = (block) => {
    block.currentGraph.outputPorts.forEach(element => block.addPort(element, false, element.paramDefaultValue, 'input'));
  };
  graphOut.callbacks.onAddCheck = (b, graph) => {
    if(graph.isMainGraph)
      return '主图表不能有输入输出';
    return null;
  };
  graphOut.callbacks.onEditorCreate = (block) => {
    block.data['onGraphPortAdd'] = block.editor.editorEvents.onGraphPortAdd.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.addPort(port, false, port.paramDefaultValue, 'input');
    });
    block.data['onGraphPortRemove'] = block.editor.editorEvents.onGraphPortRemove.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.deletePort(port.guid);
    });
    block.data['onGraphPortUpdate'] = block.editor.editorEvents.onGraphPortUpdate.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') {
        let portReal = block.getPortByGUID(port.guid);
        portReal.paramType = typeof port.paramType === 'string' ? createParameterTypeFromString(port.paramType) : <BlockParameterType>cloneParameterTypeFromString(port.paramType);
        portReal.paramDictionaryKeyType = typeof port.paramDictionaryKeyType === 'string' ? createParameterTypeFromString(port.paramDictionaryKeyType) : <BlockParameterType>cloneParameterTypeFromString(port.paramDictionaryKeyType);
        (port.paramDictionaryKeyType);
        portReal.paramDefaultValue = port.paramDefaultValue;
        portReal.paramSetType = port.paramSetType;
        block.updatePort(portReal);
      }
    });
    block.data['onGraphPortMoveDown'] = block.editor.editorEvents.onGraphPortMoveDown.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'down');
    });
    block.data['onGraphPortMoveUp'] = block.editor.editorEvents.onGraphPortMoveUp.addListener(null, (graph, port) => {
      if(graph == block.currentGraph && port.direction == 'output') 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'up');
    });
  };
  graphOut.callbacks.onPortExecuteIn = (block, port) => {
    //离开图表后恢复上下文
    //----------------------------

    let context = block.currentRunningContext;
    let outerBlock = context.outerBlock;
    if(outerBlock == null) {
      logger.error(block.getName(), 'leavePort.' + port.guid + ': Bad context ' + context + ' .');
      return;
    }    
    
    //获取父上下文
    let parentContext = context.getUpperParentContext();  
    if(parentContext == null) {
      logger.error(block.getName(), 'leavePort: Bad context has emerged, in port: ' + block.guid + '-' + port.guid);
      return null;
    }
    
    //更新父上下文的所有输出端口
    outerBlock.allPorts.forEach((port) => {
      if(port.direction == 'output' && !port.paramType.isExecute()) {
        let outerPort = outerBlock.getPortByGUID(port.guid);
        let val = outerPort.rquestInputValue(context);
        port.updateOnputValue(parentContext, val);
      }
    });

    block.currentRunner.destroyGraphStack(context, block.currentGraph);//离开图表当前上下文数据无效了，清空
    (<Array<any>>outerBlock.data['currentRunningContexts']).remove(context);//从图表正在运行的上下文中移除

    //回到父上下文
    outerBlock.currentRunningContext = parentContext;
    //激活外部单元
    outerBlock.activeOutputPort(port.guid);
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

  //调用
  //===============================================================

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

    block.data['currentRunningContexts'] = [];
    block.data['inBlock'] = currentGraph.getOneBlockByGUID(graphIn.guid);
    block.data['outBlock'] = currentGraph.getOneBlockByGUID(graphOut.guid);
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
    block.el.addEventListener('dblclick', (e : MouseEvent) => {
      if(e.button == 0)
        block.editor.openGraph(currentGraph);
    });

    block.name = '调用子图表 ' + currentGraph.name;
    block.description = '调用一个子图表，并返回值\n' + currentGraph.name + '\n' + currentGraph.comment;

    block.data['onGraphPortAdd'] = block.editor.editorEvents.onGraphPortAdd.addListener(null, (graph, port) => {
      if(graph == currentGraph) 
        block.addPort(port, false, port.paramDefaultValue, 'input');
    });
    block.data['onGraphPortRemove'] = block.editor.editorEvents.onGraphPortRemove.addListener(null, (graph, port) => {
      if(graph == currentGraph) 
        block.deletePort(port.guid);
    });
    block.data['onGraphPortUpdate'] = block.editor.editorEvents.onGraphPortUpdate.addListener(null, (graph, port) => {
      if(graph == currentGraph) {
        let portReal = block.getPortByGUID(port.guid);
        portReal.paramType = typeof port.paramType === 'string' ? createParameterTypeFromString(port.paramType) : <BlockParameterType>cloneParameterTypeFromString(port.paramType);
        portReal.paramDictionaryKeyType = typeof port.paramDictionaryKeyType === 'string' ?  createParameterTypeFromString(port.paramDictionaryKeyType) : <BlockParameterType>cloneParameterTypeFromString(port.paramDictionaryKeyType);
        portReal.paramDefaultValue = port.paramDefaultValue;
        portReal.paramSetType = port.paramSetType;
        block.updatePort(portReal);
      }
    });
    block.data['onGraphPortMoveDown'] = block.editor.editorEvents.onGraphPortMoveDown.addListener(null, (graph, port) => {
      if(graph == currentGraph) 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'down');
    });
    block.data['onGraphPortMoveUp'] = block.editor.editorEvents.onGraphPortMoveUp.addListener(null, (graph, port) => {
      if(graph == currentGraph) 
        block.movePortElementUpOrDown(block.getPortByGUID(port.guid), 'up');
    });
    block.data['onGraphUpdate'] = block.editor.editorEvents.onGraphUpdate.addListener(null, (graph) => {
      if(graph == currentGraph) {
        block.name = '调用子图表 ' + currentGraph.name;
        block.description = '调用一个子图表，并返回值\n' + currentGraph.name + '\n' + currentGraph.comment;
      }
    });
    block.data['onGraphDelete'] = block.editor.editorEvents.onGraphDelete.addListener(null, (graph) => {
      if(graph == currentGraph) 
        block.editor.deleteBlock(block, true);
    });
  };
  graphCall.callbacks.onPortExecuteIn = (block, port) => {
    //进入图表新建上下文
    let currentGraph = (<BlockGraphDocunment>block.data['currentGraph']);
    if(currentGraph != null) {

      let inBlock = block.data['inBlock'];
      if(inBlock == null) {
        logger.error(block.getName(), 'graph.call: Call graph ' + currentGraph.name + ' failed because it does not contain an entry unit.', {
          srcBlock: block,
          srcPort: port
        });

        //提示
        if(block.isEditorBlock) {
          if(block.data['currentGraphErrTip']) (<BlockEditor>block).deleteBottomTip(block.data['currentGraphErrTip']);
          block.data['currentGraphErrTip'] = (<BlockEditor>block).addBottomTip('icon-error-1','子图表 ' + block.options['graph'] + ' 没有入口！','text-warning');
        }
        return;
      }
      let inPort = inBlock.getPortByGUID(port.guid);
      if(inPort == null) {
        logger.error(block.getName(), 'graph.call: Call graph ' + currentGraph.name + ' -> ' + port.guid + ' failed.', {
          srcBlock: block,
          srcPort: port
        });
        return;
      }

      //新建上下文
      let runner = block.currentRunner;
      let newContext = runner.push(inPort, block.currentRunningContext, 'activator');
      newContext.graph = currentGraph;
      newContext.outerBlock = block;
      runner.prepareGraphVariables(newContext, currentGraph);
      runner.prepareGraphStack(newContext, currentGraph);
      runner.prepareAllBlockRun(newContext, currentGraph);

      //stackCalls
      block.currentRunningContext.stackCalls.push({
        block: null, port: null, childContext: newContext
      });

      //添加到集合
      (<Array<any>>block.data['currentRunningContexts']).push(newContext);
    }
  };
  graphCall.callbacks.onPortParamRequest = (block, port, context) => {
    //父上下文请求子上下文
    let outBlock = block.data['outBlock'];
    if(outBlock == null) {
      logger.error(block.getName(), 'graph.onPortParamRequest: Request graph param failed because it does not contain an output unit.', {
        srcBlock: block,
        srcPort: port
      });
      return;
    }

    //子端口数据更新到父端口
    let currentRunningContexts = (<Array<BlockRunContextData>>block.data['currentRunningContexts']);
    for(let i = 0; i < currentRunningContexts.length; i++) {
      if(currentRunningContexts[i].parentContext == context) {
        let outerPort = outBlock.getPortByGUID(port.guid);
        let val = outerPort.rquestInputValue(currentRunningContexts[i]);
        port.updateOnputValue(context, val);
        break;
      }
    }
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
  graphCall.settings.hideInAddPanel = true;

  return [ graphIn, graphOut, graphCall ]
}
function registerDebugBase() { 

  ParamTypeServiceInstance.registerCustomType(new BlockParameterEnumRegData("DebugLogLevel", [
    'log','info','warn','error'
  ], '#F7C709'));
  ParamTypeServiceInstance.registerCustomType(new BlockParameterEnumRegData("BasePlatformType", [
    'all','electron','nodejs','cnative'
  ], '#8552a1'));

  let blockDebug = new BlockRegData("4B6EA737-9702-A383-A268-AADC332038DF", "输出日志", '输出调试日志至控制台', '基础', '基础/调试');
  let blockModal = new BlockRegData("CB1FB757-631D-8A95-0AB1-3CB28CB04FBC", "显示一个信息对话框", '显示一个对话框', '基础', '基础/调试');
  let blockConfirm = new BlockRegData("84AB5443-1998-B4FB-773A-5F41F364BB7A", "显示一个确认对话框", '显示一个确认对话框，用户可选择确认或取消', '基础', '基础/调试');
  let blockDelay = new BlockRegData("6C01D858-CF4D-D9EF-C18E-DE5DAE400702", "延时", '延迟流程图的运行', '基础', '基础');
  let blockPlatform = new BlockRegData("522E5C4D-16E1-9D48-1916-19830B6F5B35", "运行库平台", "获取当前流图所在的运行库的平台", 'imengyu', '基础');
  
  //blockPlatform
  //===================

  blockPlatform.blockStyle.logoBackground = 'title:运行库平台';
  blockPlatform.blockStyle.minWidth = '140px';
  blockPlatform.baseInfo.logo = require('../../assets/images/BlockIcon/switch.svg');
  blockPlatform.baseInfo.version = '2.0';
  blockPlatform.ports = [
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'BasePlatformType',
    },
  ];
  blockPlatform.callbacks.onPortParamRequest = (block, port) => {

  };
  blockPlatform.blockStyle.titleBakgroundColor = "rgba(255,20,147,0.6)";
  blockPlatform.blockStyle.smallTitle = true;
  blockPlatform.blockStyle.noTitle = true;
  blockPlatform.blockStyle.hideLogo = true;

  //blockModal
  //===================

  blockDelay.baseInfo.version = '2.0';
  blockDelay.baseInfo.logo = require('../../assets/images/BlockIcon/clock.svg');
  blockDelay.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUT',
      executeInNewContext: true,
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "时长",
      description: '延迟时长（毫秒）',
      direction: 'input',
      guid: 'TIME',
      paramType: 'number',
      paramDefaultValue: 1000,
      defaultConnectPort: false,
    },
  ];
  blockDelay.callbacks.onCreate = (block) => {};
  blockDelay.callbacks.onPortExecuteIn = (block, port) => {
    let v = block.getInputParamValue('TIME');
    let context = block.currentRunningContext;
    context.markContexInUse();
    setTimeout(() => {
      block.activeOutputPortInNewContext('OUT');
      context.unsetContexInUse();
    }, v ? v : 1000);
  };
  blockDelay.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";
  blockDelay.blockStyle.logoRight = blockDelay.baseInfo.logo;

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
      paramDefaultValue: null,
      defaultConnectPort: false,
    },
    {
      name: "等级",
      direction: 'input',
      guid: 'LEVEL',
      paramType: new BlockParameterType('enum', 'DebugLogLevel'),
      paramDefaultValue: 'log',
      defaultConnectPort: false,
    },
  ];
  blockDebug.callbacks.onCreate = (block) => {
  };
  blockDebug.callbacks.onPortExecuteIn = (block, port) => {
    let paramInput = block.getInputParamValue('PRINT');
    let paramLevel = block.getInputParamValue('LEVEL');

    switch(paramLevel) {
      case 'log':
        logger.log(block.getName(), paramInput, {
          srcBlock: block,
          srcPort: port
        });
        break;
      case 'info':
        logger.info(block.getName(), paramInput, {
          srcBlock: block,
          srcPort: port
        });
        break; 
      case 'warn':
        logger.warning(block.getName(), paramInput, {
          srcBlock: block,
          srcPort: port
        });
        break;
      case 'error':
        logger.error(block.getName(), paramInput, {
          srcBlock: block,
          srcPort: port
        });
        break;
    }

    block.activeOutputPort('OUT');
  };
  blockDebug.callbacks.onCreateCustomEditor = null;
  blockDebug.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  //blockModal
  //===================

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
      executeInNewContext: true,
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
      paramType:  new BlockParameterType('enum', 'DebugLogLevel'),
      paramDefaultValue: 'log',
      defaultConnectPort: false,
    },
  ];
  blockModal.callbacks.onCreate = (block) => {
  };
  blockModal.callbacks.onPortExecuteIn = (block, port) => {
    let paramText = block.getInputParamValue('TEXT');
    let paramTitle = block.getInputParamValue('TITLE');
    let paramLevel = block.getInputParamValue('LEVEL');
    let context = block.currentRunningContext;
    context.markContexInUse();

    DebugWorkProviderInstance.ModalProvider(<string>paramLevel, <string>paramTitle, <string>paramText, () => {
      context.unsetContexInUse();
      block.activeOutputPortInNewContext('OUT');
    });
  };
  blockModal.callbacks.onCreateCustomEditor = null;
  blockModal.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  //Confirm
  //====================

  blockConfirm.baseInfo.author = 'imengyu';
  blockConfirm.baseInfo.description = "";
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
      executeInNewContext: true,
      defaultConnectPort: false,
      paramType: 'execute',
    },
    {
      name: "点击取消",
      description: '用户点击了取消按钮',
      executeInNewContext: true,
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
  blockConfirm.callbacks.onPortExecuteIn = (block, port) => {
    
    let context = block.currentRunningContext;
    context.markContexInUse();

    DebugWorkProviderInstance.ConfirmModalProvider(<string>block.getInputParamValue('TITLE'), 
      <string>block.getInputParamValue('TEXT'), () => {
        block.activeOutputPortInNewContext('OUTCON');
        context.unsetContexInUse();
      }, () => {
        block.activeOutputPortInNewContext('OUTCAN');
        context.unsetContexInUse();
      });

  };
  blockConfirm.callbacks.onCreateCustomEditor = null;
  blockConfirm.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  return [ blockPlatform, blockDelay, blockConfirm, blockDebug, blockModal ]
}
function registerTypeBase() {

  let typeRequest = (block : Block, port : BlockPort, context : BlockRunContextData) => {
    let val = block.getInputParamValue('IN', context);
    port.updateOnputValue(context, val);
    return val;
  };
  let blocks = [];

  let block = new BlockRegData("A81899CF-766B-F511-B179-90A81BBB088B", "字符串", "字符串 string 类型参数", 'imengyu', '基础/类型');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/string.svg');
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: 'IN',
      paramType: 'string',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'string',
    },
  ];
  block.callbacks.onPortParamRequest = typeRequest;
  block.blockStyle.titleBakgroundColor = "rgba(255,20,147,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  blocks.push(block);

  block = new BlockRegData("EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5", "数字", "数字 number 类型参数", 'imengyu', '基础/类型');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/number.svg');
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: 'IN',
      paramType: 'number',
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'number',
    },
  ];
  block.callbacks.onPortParamRequest = typeRequest;
  block.blockStyle.titleBakgroundColor = "rgba(158,258,68,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  blocks.push(block);

  block = new BlockRegData("90833609-8CF7-2324-A4C0-781344701C06", "布尔值", "布尔 boolean 类型参数", 'imengyu', '基础/类型');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/boolean.svg');
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: 'IN',
      paramType: 'boolean',
      paramDefaultValue: true,
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'boolean',
    },
  ];
  block.callbacks.onPortParamRequest = typeRequest;
  block.blockStyle.titleBakgroundColor = "rgba(180,0,0,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  blocks.push(block);

  block = new BlockRegData("6CE4CA4F-E2F9-AD97-3F83-1B60289C9290", "BigInt", "BigInt 类型参数", 'imengyu', '基础/类型');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/bigint.svg');
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: 'IN',
      paramType: 'bigint',
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'bigint',
    },
  ];
  block.callbacks.onPortParamRequest = typeRequest;
  block.blockStyle.titleBakgroundColor = "rgba(0,168,243,0.5)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  blocks.push(block);

  return blocks;
}
function registerLoadLib() {

  let blocks = [];

  let block = new BlockRegData("A76128DC-F4E4-69D4-F232-A4E226183B34", "加载库", "加载附加函数库", 'imengyu', '基础');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/module.svg');
  block.baseInfo.version = '2.0';
  block.ports = [
    {
      direction: 'input',
      guid: 'IN',
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'LIBNAME',
      name: '库的包名',
      description: '指定要加载的库包名',
      paramType: 'string',
      paramRequired: true,
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'LOAD-SUCCESS',
      paramType: 'boolean',
      name: '加载成功?',
    },
    {
      direction: 'output',
      guid: 'ALREDAY-LOADED',
      paramType: 'boolean',
      name: '调用之前已加载?',
    },
    {
      direction: 'output',
      guid: 'LIB-INFO',
      paramType: 'object',
      name: '库信息实体',
    },
  ];
  block.callbacks.onPortExecuteIn = (block, port) => {
    let libName = block.getInputParamValue('LIBNAME');
    if(StringUtils.isNullOrEmpty(libName)) 
      block.throwError('库的包名 必须提供 !', port, "error", true);
    else {
      let pack = BlockRegister.isPackRegister(libName);
      if(pack) {
        block.setOutputParamValue('ALREDAY-LOADED', true);
        block.setOutputParamValue('LIB-INFO', pack);
        block.activeOutputPort('OUT');
      } else {
        block.setOutputParamValue('ALREDAY-LOADED', false);

        try{
          
          let pack = __ORIGINAL_NODEJS_REQUIRE__(libName);
          if(pack) {
            BlockRegister.registerPack(pack);
            block.setOutputParamValue('LOAD-SUCCESS', true);
            block.setOutputParamValue('LIB-INFO', BlockRegister.isPackRegister(libName));
          } else {
            block.throwError(`Pack ${libName} load failed : func not return anything!`, port, 'warning', false);
            block.setOutputParamValue('LOAD-SUCCESS', false);
            block.setOutputParamValue('LIB-INFO', null);
          }
        } catch(e) {
          block.throwError(`Pack ${libName} load failed : Error ${e}`, port, 'warning', false);
          block.setOutputParamValue('LOAD-SUCCESS', false);
          block.setOutputParamValue('LIB-INFO', null);
        }

        block.activeOutputPort('OUT');
      }
    }
  };
  block.blockStyle.logoBackground = require('../../assets/images/BlockIcon/module-big.svg');
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  blocks.push(block);

  return blocks;
}
function registerCommentBlock() {

  let block = new BlockRegData("088C2A25-192D-42E7-D31B-B5E9FB7C68DD", "文档注释", "", 'imengyu', '');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/info.svg');
  block.baseInfo.description = '在这个单元里面添加你的代码注释，拖动右下角可以调整大小';
  block.ports = [];
  block.blockStyle.minHeight = '100px';
  block.callbacks.onCreateCustomEditor = (parentEle, block) => {

    var input = document.createElement('textarea');
    input.value = block.options['content'] ? block.options['content'] : '';
    input.classList.add('custom-editor');
    input.classList.add('comment-editor');
    input.style.width = (typeof block.options['width'] === 'number' ? block.options['width'] : 210) + 'px';
    input.style.height = (typeof block.options['height'] === 'number' ? block.options['height'] : 122) + 'px';
    input.onchange = () => { 
      block.options['content'] = input.value; 
      block.editor.markFileChanged();
    };
    input.oncontextmenu = (e) => {
      block.editor.showInputRightMenu(new Vector2(e.x, e.y), <HTMLInputElement>e.target);      
      e.stopPropagation();
      e.preventDefault();
    };
    block.data['input-control'] = input;
    parentEle.appendChild(input);
  };
  block.blockStyle.noComment = true;
  block.callbacks.onSave = (block) => {
    var input = <HTMLInputElement>block.data['input-control'];
    block.options['width'] = input.offsetWidth;
    block.options['height'] = input.offsetHeight;
    block.options['content'] = input.value;
  };

  commentBlock = new BlockRegData("24AA3DF0-49D9-84D9-8138-534505C33327", "注释块", "", 'imengyu', '');
  commentBlock.baseInfo.logo = require('../../assets/images/BlockIcon/info2.svg');
  commentBlock.baseInfo.description = '';
  commentBlock.ports = [];
  commentBlock.blockStyle.minHeight = '100px';
  commentBlock.blockStyle.userCanResize = true;
  commentBlock.blockStyle.noTooltip = true;
  commentBlock.blockStyle.noComment = true;
  commentBlock.blockStyle.hideLogo = true;
  commentBlock.blockStyle.noTitle = true;
  commentBlock.blockStyle.layer = 'background';
  commentBlock.callbacks.onCreateCustomEditor = (parentEle, block) => {
    let blockEle = <HTMLDivElement>parentEle.parentNode;
    blockEle.classList.add('flow-block-comment-block');
    blockEle.style.minWidth = '250px';
    blockEle.style.minHeight = '150px';

    let ele = document.createElement('div');
    let input = document.createElement('input');
    let span = document.createElement('span');
    input.value = block.options['comment'] ? block.options['comment'] : '注释';
    input.onchange = () => {
      block.options['comment'] = input.value;
      span.innerText = input.value;
    };
    input.style.display = 'none';
    input.onkeypress = (e) => {
      if(e.key == 'Enter')
        input.onblur(undefined);
    };
    input.onblur = () => {
      input.style.display = 'none';
      span.style.display = 'block';
    };
    span.onclick = () => {
      if(block.selected && !block.isLastMovedBlock()) {
        span.style.display = 'none';
        input.style.display = 'block';
        input.focus();
      }
    };
    span.innerText = input.value;
    ele.classList.add('comment-block-title');
    ele.appendChild(input);
    ele.appendChild(span);
    parentEle.appendChild(ele);
  };
  commentBlock.callbacks.onCreate = (block) => {
    block.data['list'] = [];
    block.data['rect'] = new Rect();
    block.data['mouseDownPos'] = { x: 0, y: 0 };
    block.data['mouseDown'] = false;
  };
  commentBlock.callbacks.onDestroy = (block) => {
    block.data['list'] = undefined;
  };
  commentBlock.callbacks.onBlockMouseEvent = (block: BlockEditor, event: "move" | "down" | "up", e: MouseEvent) => {
    let list = block.data['list'] as Array<BlockEditor>;
    let rect = block.data['rect'] as Rect;
    let mouseDownPos = block.data['mouseDownPos'] as { x: number, y: number};
    if(event === 'down') {

      block.data['mouseDown'] = true;

      mouseDownPos.x = e.x;
      mouseDownPos.y = e.y;

      //保存鼠标按下时区域内的所有单元
      rect.Set(block.getRect());
      list.empty();
      block.editor.getBlocksInRect(rect).forEach((v) => {
        if(v != block) {
          v.updateLastPos();
          list.push(v);
        }
      });
      
    } else if(event === 'move') {
     
      if(block.data['mouseDown'] && block.getCurrentSizeType() == 0) {

        //移动包括在注释内的单元
        let zoom = 1 / block.editor.getViewZoom();
        let offX = e.x - mouseDownPos.x, offY =  e.y - mouseDownPos.y;
        list.forEach((v) => {
          v.position.x = v.getLastPos().x + (offX * zoom);
          v.position.y = v.getLastPos().y + (offY * zoom);
          v.setPos();
        })
      }

    } else if(event === 'up') {
      if(block.data['mouseDown'])
        block.data['mouseDown'] = false;
    }
    return false;
  };

  return [ block, commentBlock ];
}
function registerConvertBlock() {

  let block = new BlockRegData("8C7DA763-05C1-61AF-DCD2-174CB6C2C279", "转换器", "", 'imengyu', '基础/转换');
  block.baseInfo.logo = require('../../assets/images/BlockIcon/convert.svg');
  block.baseInfo.description = '';
  block.ports = [
    {
      guid: 'INPUT',
      paramType: 'any',
      direction: 'input',
      defaultConnectPort: true,
    },
    {
      guid: 'OUTPUT',
      paramType: 'any',
      direction: 'output'
    },
  ];
  block.type = 'base';
  block.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  block.blockStyle.noTitle = true;
  block.blockStyle.minWidth = '0px';
  block.settings.hideInAddPanel = true;
  block.callbacks.onCreate = (block : Block) => {
    if(!StringUtils.isNullOrEmpty(block.options['coverterFrom']) && !StringUtils.isNullOrEmpty(block.options['coverterTo']))
      block.data['coverter'] = ParamTypeServiceInstance.getTypeCoverter(
        createParameterTypeFromString(block.options['coverterFrom']), 
        createParameterTypeFromString(block.options['coverterTo']));

    let coverter = <BlockParameterTypeConverterData>block.data['coverter'];
    if(coverter) {

      let fromPort = block.getPortByGUID('INPUT');
      let toPort = block.getPortByGUID('OUTPUT');

      block.changePortParamType(fromPort, coverter.fromType, coverter.allowSetType);
      block.changePortParamType(toPort, coverter.toType, coverter.allowSetType);
      block.regData.baseInfo.description = '转换 ' + ParamTypeServiceInstance.getTypeNameForUserMapping(coverter.fromType) + 
        ' 至 ' + ParamTypeServiceInstance.getTypeNameForUserMapping(coverter.toType);
    }
  };
  block.callbacks.onPortParamRequest = (block: Block, port: BlockPort, context: BlockRunContextData) => {
    let coverter = <BlockParameterTypeConverterData>block.data['coverter'];
    if(coverter) {
      let input = block.getInputParamValue('INPUT');
      block.setOutputParamValue('OUTPUT', coverter.converter(input));
    } else {
      block.throwError('转换器没有设置转换方法，请删除之后重新添加', port, 'error');
    }
  };
  
  convertBlock = block;

  let parseFloatBlock = new BlockRegData("6A644C89-F7FA-E615-6342-D7E747710DD6", "parseFloat", '转换为浮点数', 'imengyu', '基础/转换');
  parseFloatBlock.baseInfo.logo = require('../../assets/images/BlockIcon/convert-number.svg');
  parseFloatBlock.ports = [
    {
      guid: 'INPUT',
      paramType: 'any',
      direction: 'input',
      description: '要转换的变量',
      defaultConnectPort: true,
    },
    {
      guid: 'OUTPUT',
      paramType: 'number',
      description: '转为的浮点数',
      direction: 'output'
    },
  ];
  parseFloatBlock.type = 'base';
  parseFloatBlock.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  parseFloatBlock.blockStyle.noTitle = true;
  parseFloatBlock.blockStyle.logoBackground = 'title:parseInt';
  parseFloatBlock.blockStyle.minWidth = '130px';
  parseFloatBlock.callbacks.onPortParamRequest = (block: Block, port: BlockPort, context: BlockRunContextData) => {
    let input = block.getInputParamValue('INPUT');
      block.setOutputParamValue('OUTPUT', parseFloat(input));
  };

  let parseIntBlock = new BlockRegData("824AB4F0-7C8F-A12F-6CA6-87266464BD6E", "parseInt", '转换为整数', 'imengyu', '基础/转换');
  parseIntBlock.baseInfo.logo = require('../../assets/images/BlockIcon/convert-number-2.svg');
  parseIntBlock.ports = [
    {
      guid: 'INPUT',
      paramType: 'any',
      direction: 'input',
      description: '要转换的变量',
      defaultConnectPort: true,
    },
    {
      guid: 'OUTPUT',
      paramType: 'number',
      description: '转为的整数',
      direction: 'output'
    },
  ];
  parseIntBlock.type = 'base';
  parseIntBlock.blockStyle.logoBackground = 'title:parseInt';
  parseIntBlock.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  parseIntBlock.blockStyle.noTitle = true;
  parseIntBlock.blockStyle.minWidth = '130px';

  parseIntBlock.callbacks.onPortParamRequest = (block: Block, port: BlockPort, context: BlockRunContextData) => {
    let input = block.getInputParamValue('INPUT');
      block.setOutputParamValue('OUTPUT', parseInt(input));
  };

  return [ block, parseFloatBlock, parseIntBlock ];
}
function registerConnBlock() {
  let block = new BlockRegData("8A94A788-ED4E-E521-5BC2-4D69B59BAB80", "数据延长线", "", 'imengyu', '基础');

  block.baseInfo.logo = require('../../assets/images/BlockIcon/convert.svg');
  block.baseInfo.description = '';
  block.ports = [
    {
      guid: 'INPUT',
      paramType: 'any',
      paramRefPassing: true,
      direction: 'input',
      portAnyFlexable: { flexable: true },
      defaultConnectPort: true,
    },
    {
      guid: 'OUTPUT',
      paramType: 'any',
      paramRefPassing: true,
      portAnyFlexable: { flexable: true },
      direction: 'output'
    },
  ];
  block.portAnyFlexables = {
    flexable: {}
  };
  block.blockStyle.titleBakgroundColor = "rgba(250,250,250,0.6)";
  block.blockStyle.noTitle = true;
  block.blockStyle.noComment = true;
  block.blockStyle.minWidth = '0px';
  block.callbacks.onPortParamRequest = (block: Block, port: BlockPort, context: BlockRunContextData) => {
    return block.getInputParamValue('INPUT', context);
  };
  block.callbacks.onCreate = (block : Block) => {
    let type = block.options['type'];
    if(!StringUtils.isNullOrEmpty(type)) {
      block.changePortParamType(block.getPortByGUID('INPUT'), undefined, type); 
      block.changePortParamType(block.getPortByGUID('OUTPUT'), undefined, type); 
    }
  };
  block.blockMenu.items.push({
    label: '集合类型',
    children: [
      {
        label: '变量',
        onClick: function() { 
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'variable'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'variable'); 
          this.options['type'] = 'variable';
        }
      },
      {
        label: '数组',
        onClick: function() { 
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'array'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'array'); 
          this.options['type'] = 'array';
        }
      },
      {
        label: '集合',
        onClick: function() {
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'set'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'set'); 
          this.options['type'] = 'set';
        }
      },
      {
        label: '映射',
        onClick: function() { 
          this.changePortParamType(this.getPortByGUID('INPUT'), undefined, 'dictionary'); 
          this.changePortParamType(this.getPortByGUID('OUTPUT'), undefined, 'dictionary'); 
          this.options['type'] = 'dictionary';
        }
      },
    ]
  })
  block.callbacks.onEditorCreate = (block) => {
    block.el.classList.add('flow-block-extended-line');
  }

  return [ block ];
}