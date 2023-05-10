import type { INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import { NodeParamTypeRegistry, type NodeTypeCoverter } from "@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry";
import StringUtils from "@/node-blueprint/Base/Utils/StringUtils";

export default { 
  register,
  getScriptBaseNodeIn() { return blockIn; },
  getScriptBaseNodeOut() { return blockOut;  },
  getScriptBaseGraphIn() { return graphIn; },
  getScriptBaseGraphOut() { return graphOut;  },
  getScriptBaseGraphCall() { return graphCall;  },
  getScriptBaseVariableGet() { return variableGet;  },
  getScriptBaseVariableSet() { return variableSet;  },
  getScriptBaseCommentNode() { return commentNode;  },
  getScriptBaseConvertNode() { return convertNode;  },
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
    registerCommentNode(),
    registerConvertNode(),
    registerConnNode(),
  );
}

function registerBaseConverters() {
  const NodeParamTypeRegistryInstance = NodeParamTypeRegistry.getInstance();
  const anyStringConverter = (v : any) => { return '' + v };

  NodeParamTypeRegistryInstance.registerTypeCoverter({
    fromType: NodeParamType.Number,
    toType: NodeParamType.String, 
    converter: anyStringConverter
  });
  NodeParamTypeRegistryInstance.registerTypeCoverter({
    fromType: NodeParamType.Boolean,
    toType: NodeParamType.String, 
    converter: anyStringConverter
  });
  NodeParamTypeRegistryInstance.registerTypeCoverter({
    fromType: NodeParamType.String,
    toType: NodeParamType.Number,
    converter: (v) => parseFloat(v)
  });
  NodeParamTypeRegistryInstance.registerTypeCoverter({
    fromType: NodeParamType.String,
    toType: NodeParamType.Boolean,
    converter: (v : string) => !StringUtils.isNullOrEmpty(v) && (v.toLowerCase() == 'true')
  });
  NodeParamTypeRegistryInstance.registerTypeCoverter({
    fromType: NodeParamType.Any,
    toType: NodeParamType.String,
    converter: (v : any) => v + ''
  });
}

let blockIn : INodeDefine;
let blockOut : INodeDefine;
let graphIn : INodeDefine;
let graphOut : INodeDefine;
let graphCall : INodeDefine;
let variableGet : INodeDefine;
let variableSet : INodeDefine;
let commentNode : INodeDefine;
let convertNode : INodeDefine;

import NodeIconSwith from '../NodeIcon/switch.svg';
import NodeIconClock from '../NodeIcon/clock.svg';
import NodeIconClock2 from '../NodeIcon/clock2.svg';
import NodeIconEntryGo from '../NodeIcon/entry_go.svg';
import NodeIconEntryExit from '../NodeIcon/entry_exit.svg';
import NodeIconEntryWarning from '../NodeIcon/warning.svg';
import NodeIconEntryTrace from '../NodeIcon/trace.svg';
import NodeIconEntryNumber from '../NodeIcon/number.svg';
import NodeIconEntryString from '../NodeIcon/string.svg';
import NodeIconEntryBoolean from '../NodeIcon/boolean.svg';
import NodeIconInfo from '../NodeIcon/info.svg';
import NodeIconInfo2 from '../NodeIcon/info2.svg';
import NodeIconConvert from '../NodeIcon/convert.svg';
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import type { NodeEditor } from "@/node-blueprint/Editor/Graph/Flow/NodeEditor";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";

function registerScriptBase()  {
  const NodeParamTypeRegistryInstance = NodeParamTypeRegistry.getInstance();

  //脚本入口
  //==============================

  blockIn = {
    guid: '0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F',
    name: '脚本入口',
    description: '脚本在这里开始运行',
    version: 1,
    author: 'imengyu',
    ports: [
      {
        name: "脚本开始",
        direction: 'output',
        guid: 'START',
        defaultConnectPort: true,
        paramType: NodeParamType.Execute,
      },
    ],
    oneNodeOnly: true,
    style: {
      logo: NodeIconEntryGo,
      titleBakgroundColor: "rgba(25,25,112,0.6)",
    },
    events: {
      onAddCheck(node, graph) {
        if(graph.type !== 'none')
          return '只能在主图表中添加脚本开始单元';
        return null;
      },
    }
  };

  //脚本出口
  //==============================

  blockOut = {
    guid: '77885802-92C8-569B-1E7F-48938943A549',
    name: '脚本出口',
    description: '调用此单元结束整个脚本的运行',
    version: 1,
    ports: [
      {
        name: "结束脚本",
        direction: 'input',
        guid: 'END',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
    ],
    oneNodeOnly: true,
    style: {
      logo: NodeIconEntryExit,
      titleBakgroundColor: "rgba(112,30,133,0.6)",
    },
    events: {
      onAddCheck(node, graph) {
        if(graph.type !== 'none')
          return '只能在主图表中添加脚本开始单元';
        return null;
      },
    }
  };

  //运行库平台
  //==============================

  NodeParamTypeRegistryInstance.registerType("BasePlatformType", {
    typeColor: '#8552a1',
    typeDescription: '用于描述当前运行平台的类型',
    typeTitle: '基础平台类型',
    baseType: 'enum',
    options: [ 'all', 'electron', 'nodejs', 'cnative' ],
    defaultValue: () => 'unknow',
  });

  const blockPlatform : INodeDefine = {
    guid: '522E5C4D-16E1-9D48-1916-19830B6F5B35',
    name: '运行库平台',
    description: '获取当前流图所在的运行库的平台',
    author: 'imengyu',
    version: 1,
    category: '基础',
    ports: [
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamTypeRegistryInstance.getTypeByString('BasePlatformType')!,
      },
    ],
    style: {
      logoBackground: 'title:运行库平台',
      logo: NodeIconSwith,
      minWidth: 140,
      titleBakgroundColor: "rgba(255,20,147,0.6)",
      titleState: 'hide',
    },
    simulate: {
      onPortParamRequest: () => {
        //TODO: return getCurrentPlatform()
      }
    }
  };

  //延时
  //==============================

  const blockDelay : INodeDefine = {
    guid: '6C01D858-CF4D-D9EF-C18E-DE5DAE400702',
    name: '延时',
    description: '延迟流程图的运行',
    author: 'imengyu',
    version: 1,
    category: '基础',
    ports: [
      {
        name: "",
        description: '',
        direction: 'input',
        guid: 'IN',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        isAsync: true,
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
      {
        name: "时长",
        description: '延迟时长（毫秒）',
        direction: 'input',
        guid: 'TIME',
        paramType: NodeParamType.Number,
        paramDefaultValue: 1000,
        defaultConnectPort: false,
      },
    ],
    style: {
      logo: NodeIconClock,
      logoRight: NodeIconClock,
    },
    simulate: {
      onPortExecuteIn: (node, port) => {
        /* let v = node.getInputParamValue('TIME');
        let context = node.currentRunningContext;
        context.markContexInUse();
        setTimeout(() => {
          node.activeOutputPortInNewContext('OUT');
          context.unsetContexInUse();
        }, v ? v : 1000); */
      }
    }
  };

  //延时
  //==============================

  const blockTimer : INodeDefine = {
    guid: '713EDD7E-8C92-099F-5CD7-A7E10FF77060',
    name: '定时器',
    description: '定时器用于定时执行某些任务',
    author: 'imengyu',
    version: 1,
    category: '基础',
    ports: [
      {
        name: '开始',
        description: '开始定时器',
        direction: 'input',
        guid: 'START',
        defaultConnectPort: true,
        paramType: NodeParamType.Execute,
      },
      {
        name: '停止',
        description: '停止定时器',
        direction: 'input',
        guid: 'STOP',
        defaultConnectPort: false,
        forceNoCycleDetection: true,
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        isAsync: true,
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
      {
        name: "时长",
        description: '周期时长（毫秒）',
        direction: 'input',
        guid: 'TIME',
        paramType: NodeParamType.Number,
        paramDefaultValue: 2000,
        defaultConnectPort: false,
      },
    ],
    simulate: {
      onPortExecuteIn: (node, port) => {
        /* let context = node.currentRunningContext;
        let variables = node.variables();
        switch(port.guid) {
          case 'START': {
            let v = node.getInputParamValue('TIME');
            context.markContexInUse();
            variables['intervalId'] = setInterval(() => {
              node.activeOutputPortInNewContext('OUT');
            }, v ? v : 1000);
            break;
          }
          case 'STOP': {
            let id = variables['intervalId'];
            if(id) {
              context.unsetContexInUse();
              clearInterval(id);
              variables['intervalId'] = undefined;
            }
            break; 
          }
        } */
      }
    },
    style: {
      logo: NodeIconClock2,
      logoRight: NodeIconClock2,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    }
  };

  return [ blockIn, blockOut, blockDelay, blockTimer, blockPlatform ];
}
function registerScriptVariableBase()  {
  // todo: variableGet, variableSet
  return []
}
function registerScriptGraphBase()  {
  //TODO: registerScriptGraphBase
  return []
}
function registerDebugBase() { 
  const NodeParamTypeRegistryInstance = NodeParamTypeRegistry.getInstance();

  NodeParamTypeRegistryInstance.registerType("DebugLogLevel", {
    typeColor: '#F7C709',
    typeDescription: '',
    typeTitle: '输出日志等级',
    baseType: 'enum',
    options: [ 'log', 'info', 'warn', 'error' ],
    defaultValue: () => '',
  });

  //Assert
  //===================

  const blockAssert : INodeDefine = {
    guid: 'F726A2CE-2285-A9D7-9252-9FC3EEAC7BDC',
    name: '断言（Assert）',
    description: '检查一个条件，如果条件不满足则抛出异常并终止流图的运行',
    author: 'imengyu',
    version: 1,
    category: '基础/调试',
    style: {
      logo: NodeIconEntryWarning,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    },
    ports: [
      {
        direction: 'input',
        name: '进入',
        guid: 'IN',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'input',
        name: '判断条件',
        guid: 'CONDITION',
        isRefPassing: true,
        paramType: NodeParamType.Boolean,
      },
      {
        direction: 'input',
        name: '抛出错误',
        description: '是否在条件为 false 时抛出错误并终止运行',
        guid: 'THROWERR',
        paramType: NodeParamType.Boolean,
      },
      {
        direction: 'output',
        name: '成功',
        guid: 'SUCCESS',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        name: '失败',
        guid: 'FAILED',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
    ],
    simulate: {
      onPortExecuteIn: (block, port) => {
        /* let con = node.getInputParamValue('CONDITION');
        let throwError = node.getInputParamValue('THROWERR');
        if(con)
          node.activeOutputPort('SUCCESS');
        else {
          if(throwError)
            node.throwError('条件断言失败！', port, 'error', true);
          else {
            node.throwError('条件断言失败！', port, 'warning', false);
            node.activeOutputPort('FAILED');
          }
        } */
      }
    },
  };

  //追踪
  //===================

  const blockTrace : INodeDefine = {
    guid: '31B04B93-FE15-4D35-B673-BDBEA8597547',
    name: '追踪（Trace）',
    description: '在控制台中打印当前执行的代码在堆栈中的调用路径',
    author: 'imengyu',
    version: 1,
    category: '基础/调试',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        defaultConnectPort: true,
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Execute,
      },
    ],
    style: {
      logo: NodeIconEntryTrace,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
        //打印调用堆栈
        //logger.log(node.getName(), node.currentRunningContext.runner.mainContext.printCallStack(true));
        //node.activeOutputPort('OUT');
      }
    },
  };

  //输出日志
  //===================

  const blockDebug : INodeDefine = {
    guid: '4B6EA737-9702-A383-A268-AADC332038DF',
    name: '输出日志',
    description: '输出调试日志至控制台',
    author: 'imengyu',
    version: 1,
    category: '基础/调试',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        defaultConnectPort: false,
        paramType: NodeParamType.Execute,
      },
      {
        name: "标签",
        description: '可以定义一个输出标签，方便查找',
        direction: 'input',
        guid: 'TAG',
        paramType: NodeParamType.String,
        paramDefaultValue: null,
        defaultConnectPort: false,
      },
      {
        name: "输出",
        direction: 'input',
        guid: 'PRINT',
        paramType: NodeParamType.Any,
        paramDefaultValue: null,
        defaultConnectPort: false,
      },
      {
        name: "等级",
        direction: 'input',
        guid: 'LEVEL',
        paramType: NodeParamType.FromString('DebugLogLevel'),
        paramDefaultValue: 'log',
        defaultConnectPort: false,
      },
    ],
    style: {
      logo: NodeIconEntryTrace,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
      }
    },
  };

  return [ blockDebug, blockAssert, blockTrace  ]
}

/**
 *   const blockDebug : INodeDefine = {
    guid: '4B6EA737-9702-A383-A268-AADC332038DF',
    name: '输出日志',
    description: '输出调试日志至控制台',
    author: 'imengyu',
    version: 1,
    category: '基础/调试',
    ports: [
    ],
    style: {
      logo: NodeIconEntryTrace,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
      }
    },
  };
 */

function registerTypeBase() {

  const blockString : INodeDefine = {
    guid: 'A81899CF-766B-F511-B179-90A81BBB088B',
    name: '字符串',
    description: '字符串 string 类型参数',
    author: 'imengyu',
    version: 1,
    category: '基础/类型',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.String,
        paramDefaultValue: true,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.String,
      },
    ],
    style: {
      logo: NodeIconEntryString,
      titleState: 'hide',
      titleBakgroundColor: "rgba(255,20,147,0.6)",
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
      }
    },
  };
  const blockNumber : INodeDefine = {
    guid: 'EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5',
    name: '数字',
    description: '数字 number 类型参数',
    author: 'imengyu',
    version: 1,
    category: '基础/类型',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Number,
        paramDefaultValue: true,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Number,
      },
    ],
    style: {
      logo: NodeIconEntryNumber,
      titleState: 'hide',
      titleBakgroundColor: "rgba(158,258,68,0.6)",
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
      }
    },
  };
  const blockBoolean : INodeDefine = {
    guid: '90833609-8CF7-2324-A4C0-781344701C06',
    name: '布尔值',
    description: '布尔值类型参数',
    author: 'imengyu',
    version: 1,
    category: '基础/类型',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Boolean,
        paramDefaultValue: true,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Boolean,
      },
    ],
    style: {
      logo: NodeIconEntryBoolean,
      titleState: 'hide',
      titleBakgroundColor: "rgba(180,0,0,0.6)",
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
      }
    },
  };

  return [ blockString, blockNumber, blockBoolean ];
}
function registerLoadLib() {
  //TODO: LoadLib
  return [];
}
function registerCommentNode() {

  const documentCommentNode : INodeDefine = {
    guid: '088C2A25-192D-42E7-D31B-B5E9FB7C68DD',
    name: '文档注释',
    description: '在这个单元里面添加你的代码注释，拖动右下角可以调整大小',
    author: 'imengyu',
    version: 1,
    category: '',
    ports: [],
    events: {
      onCreateCustomEditor: (parentEle, node, context) => {
        if (parentEle) {
          var input = document.createElement('textarea');
          input.value = node.options['content'] ? node.options['content'] as string : '';
          input.classList.add('custom-editor');
          input.classList.add('comment-editor');
          input.style.width = (typeof node.options['width'] === 'number' ? node.options['width'] : 210) + 'px';
          input.style.height = (typeof node.options['height'] === 'number' ? node.options['height'] : 122) + 'px';
          input.onchange = () => { 
            node.options['content'] = input.value; 
            context.markGraphChanged();
          };
          input.oncontextmenu = (e) => {
            context.showInputRightMenu(new Vector2(e.x, e.y), e.target as HTMLInputElement);      
            e.stopPropagation();
            e.preventDefault();
          };
          node.data['input-control'] = input;
          parentEle.appendChild(input);
        }
        return undefined;
      },
      onSave: (node) => {
        var input = node.data['input-control'] as HTMLInputElement;
        node.options['width'] = input.offsetWidth;
        node.options['height'] = input.offsetHeight;
        node.options['content'] = input.value;
      }
    },
    style: {
      logo: NodeIconInfo,
      minHeight: 100,
      noComment: true,
    },
  };

  commentNode = {
    guid: '24AA3DF0-49D9-84D9-8138-534505C33327',
    name: '注释块',
    author: 'imengyu',
    version: 1,
    category: '',
    ports: [],
    events: {
      onCreateCustomEditor: (parentEle, node, context) => {
        if (!parentEle) 
          return undefined;
        let blockEle = parentEle.parentNode as HTMLDivElement;
        blockEle.classList.add('node-block-comment-block');
        blockEle.style.minWidth = '250px';
        blockEle.style.minHeight = '150px';
    
        let ele = document.createElement('div');
        let input = document.createElement('input');
        let span = document.createElement('span');
        input.value = node.options['comment'] ? node.options['comment'] as string : '注释';
        input.onchange = () => {
          node.options['comment'] = input.value;
          span.innerText = input.value;
        };
        input.style.display = 'none';
        input.onkeypress = (e) => {
          if(e.key == 'Enter')
            input.blur();
        };
        input.onblur = () => {
          input.style.display = 'none';
          span.style.display = 'block';
        };
        span.onclick = () => {
          if(node.selected && !context.getMouseInfo().mouseMoved) {
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
      },
      onCreate: (node) => {
        node.data['list'] = [];
        node.data['rect'] = new Rect();
        node.data['mouseDownPos'] = { x: 0, y: 0 };
        node.data['mouseDown'] = false;
      },
      onDestroy: (node) => {
        node.data['list'] = undefined;
      },
      onEditorMoseEvent: (node, context, event, e) => {
        let list = node.data['list'] as NodeEditor[];
        let rect = node.data['rect'] as Rect;
        let mouseDownPos = node.data['mouseDownPos'] as { x: number, y: number};
        if(event === 'down') {
    
          node.data.mouseDown = true;
    
          mouseDownPos.x = e.x;
          mouseDownPos.y = e.y;
    
          //保存鼠标按下时区域内的所有单元
          rect.set(node.getRect());
          ArrayUtils.clear(list);
          context.getNodesInRect(rect).forEach((v) => {
            if(v != node) {
              v.saveLastNodePos();
              list.push(v);
            }
          });
          
        } else if(event === 'move') {
         
          if(node.data.mouseDown && node.getCurrentSizeType() == 0) {
    
            //移动包括在注释内的单元
            let viewPort = context.getViewPort();
            let offX = e.x - mouseDownPos.x, offY =  e.y - mouseDownPos.y;
            list.forEach((v) => {
              v.position.x = v.getLastPos().x + (viewPort.scaleScreenSizeToViewportSize(offX));
              v.position.y = v.getLastPos().y + (viewPort.scaleScreenSizeToViewportSize(offY));
            })
          }
    
        } else if(event === 'up') {
          if(node.data.mouseDown)
            node.data.mouseDown = false;
        }
        return false;
      }
    },
    style: {
      logo: NodeIconInfo2,
      minHeight: 100,
      noTooltip: true,
      noComment: true,
      titleState: 'hide',
      layer: 'background',
      userResize: 'all',
    },
  };

  return [ documentCommentNode, commentNode ];
}
function registerConvertNode() {
  convertNode = {
    guid: '8C7DA763-05C1-61AF-DCD2-174CB6C2C279',
    name: '转换器',
    author: 'imengyu',
    version: 1,
    category: '基础/转换',
    hideInAddPanel: true,
    ports: [
      {
        guid: 'INPUT',
        paramType: NodeParamType.Any,
        direction: 'input',
        defaultConnectPort: true,
      },
      {
        guid: 'OUTPUT',
        paramType: NodeParamType.Any,
        direction: 'output'
      },
    ],
    events: {
      onCreate: (node) => {
        const ParamTypeServiceInstance = NodeParamTypeRegistry.getInstance();

        if (
          !StringUtils.isNullOrEmpty(node.options.coverterFrom as string) && 
          !StringUtils.isNullOrEmpty(node.options.coverterTo as string)
        )
          node.data['coverter'] = ParamTypeServiceInstance.getTypeCoverter(
            NodeParamType.FromString(node.options.coverterFrom as string), 
            NodeParamType.FromString(node.options.coverterTo as string)
          );
    
        let coverter = node.data['coverter'] as NodeTypeCoverter;
        if(coverter) {
    
          let fromPort = node.getPortByGUID('INPUT') as NodePort;
          let toPort = node.getPortByGUID('OUTPUT') as NodePort;
    
          node.changePortParamType(fromPort, coverter.fromType);
          node.changePortParamType(toPort, coverter.toType);
          node.define.description = '转换 ' + coverter.fromType.toUserFriendlyName() + 
            ' 至 ' + coverter.toType.toUserFriendlyName();
        }
      },
    },
    style: {
      logo: NodeIconEntryString,
      minWidth: 0,
      titleState: 'hide',
      titleBakgroundColor: "rgba(250,250,250,0.6)",
    },
    simulate: {
      onPortExecuteIn: (node, port) => {
        /**
         * let coverter = <NodeParameterTypeConverterData>node.data['coverter'];
    if(coverter) {
      let input = node.getInputParamValue('INPUT', context);
      return coverter.converter(input);
    } else {
      node.throwError('转换器没有设置转换方法，请删除之后重新添加', port, 'error');
      return undefined;
    }
         */
      }
    },
  }; 

  return [ convertNode ];
}
function registerConnNode() {
  const connNode : INodeDefine = {
    guid: '8A94A788-ED4E-E521-5BC2-4D69B59BAB80',
    name: '数据延长线',
    author: 'imengyu',
    version: 1,
    category: '',
    ports: [
      {
        guid: 'INPUT',
        paramType: NodeParamType.Any,
        isRefPassing: true,
        direction: 'input',
        defaultConnectPort: true,
      },
      {
        guid: 'OUTPUT',
        paramType: NodeParamType.Any,
        isRefPassing: true,
        direction: 'output'
      },
    ],
    style: {
      logo: NodeIconConvert,
      titleState: 'hide',
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
      noComment: true,
      minWidth: 0,
    },
    events: {
      onCreate: (node) => {
        let type = node.options['type'] as string;
        if(!StringUtils.isNullOrEmpty(type)) {
          const paramType = NodeParamType.FromString(type);
          node.changePortParamType(node.getPortByGUID('INPUT')!, paramType); 
          node.changePortParamType(node.getPortByGUID('OUTPUT')!, paramType); 
        }
      },
      onEditorCreate: (node, el) => {
        node.addClass('node-block-extended-line');
      },
    },
    simulate: {
      onPortParamRequest() {

      },
    },
  };

  return [ connNode ];
}