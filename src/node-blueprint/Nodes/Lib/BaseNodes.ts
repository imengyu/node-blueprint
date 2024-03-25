import { NodeParamTypeRegistry } from "@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import StringUtils from "@/node-blueprint/Base/Utils/StringUtils";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeEditor } from "@/node-blueprint/Editor/Graph/Flow/NodeEditor";
import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeGraphEditorContext } from "@/node-blueprint/Editor/Graph/NodeGraphEditor";

const messages = {
  VARIABLE_UPDATE_TYPE: 0,
  VARIABLE_UPDATE_NAME: 1,
  GRAPH_LOAD: 1,
  GRAPH_DELETE: 2,
  GRAPH_NAME_CHANGE: 3,
  GRAPH_PORT_CHANGE: 4,
  GRAPH_ONLINE: 6,
  GRAPH_PROMOTE: 7,
};

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
  messages,
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
    converter: (v : string) => !StringUtils.isNullOrEmpty(v) && (v.toLowerCase() === 'true')
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
import NodeIconEntryIn from '../NodeIcon/block.svg';
import NodeIconEntryFunction from '../NodeIcon/function.svg';
import NodeIconEntryWarning from '../NodeIcon/warning.svg';
import NodeIconEntryTrace from '../NodeIcon/trace.svg';
import NodeIconEntryNumber from '../NodeIcon/number.svg';
import NodeIconEntryString from '../NodeIcon/string.svg';
import NodeIconEntryBoolean from '../NodeIcon/boolean.svg';
import NodeIconInfo from '../NodeIcon/info.svg';
import NodeIconInfo2 from '../NodeIcon/info2.svg';
import NodeIconConvert from '../NodeIcon/convert.svg';
import NodeIconConvert2 from '../NodeIcon/convert-number.svg';
import NodeIconConvert3 from '../NodeIcon/convert-number-2.svg';
import NodeIconType from '../NodeIcon/cpu.svg';
import ObjectUtils from "@/node-blueprint/Base/Utils/ObjectUtils";

export interface IGraphCallNodeOptions {
  callGraphType: 'subgraph'|'function';
  callGraphName: string;
}
export interface ICoverterNodeOptions {
  coverterFrom: string,
  coverterTo: string,
}

export function getGraphCallNodeGraph(context: NodeGraphEditorContext, node: Node) {
  const graph = context.getCurrentGraph();
  const options = node.options as unknown as IGraphCallNodeOptions;
  let childGraph : NodeGraph|undefined;
  switch (options.callGraphType) {
    case 'function': {
      const topGraph = graph.getParentDocunment()?.mainGraph;
      if (topGraph)
        childGraph = topGraph.children.find(v => v.name === options.callGraphName);
      break;
    }
    case 'subgraph':
      childGraph = graph.getChildGraphByName(options.callGraphName) || undefined;
      break;
  }
  return childGraph;
}

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
    canNotDelete: true,
    style: {
      logo: NodeIconEntryGo,
      titleBakgroundColor: "rgba(25,25,112,0.6)",
      noIsolate: true,
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
    canNotDelete: true,
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
    style: {
      logo: NodeIconClock2,
      logoRight: NodeIconClock2,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    }
  };

  return [ blockIn, blockOut, blockDelay, blockTimer, blockPlatform ];
}
function registerScriptVariableBase()  {
  variableGet = {
    guid: '04414FD9-45A2-980B-813C-2957849BEF47',
    name: '',
    description: '',
    author: 'imengyu',
    version: 1,
    category: '基础',
    hideInAddPanel: true,
    tags: [ 'variable', 'variable-get' ],
    ports: [
      {
        direction: 'output',
        guid: 'OUTPUT',
        paramType: NodeParamType.Any,
      },
    ],
    style: {
      titleState: 'hide',
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    events: {
      onEditorCreate(node, context) {
        //在初始化时加载之前绑定的变量信息
        const graph = context.getCurrentGraph();
        const variableName = node.options.variable as string;
        const variable = variableName ? graph.variables.find(v => v.name === variableName) : undefined;
        if (variable) {
          //直接调用下方消息进行相关状态设置
          node.sendSelfMessage(messages.VARIABLE_UPDATE_NAME, { name: variableName });
          node.sendSelfMessage(messages.VARIABLE_UPDATE_TYPE, { type: variable.type });
        }
      },
      onEditorShowContextMenu(node, context) {
        const graph = context.getCurrentGraph();
        const variableName = node.options.variable as string;
        const variable = variableName ? graph.variables.find(v => v.name === variableName) : undefined;
        if (variable) {
          return {
            menu: {
              items: [
                {
                  label: '替换变量',
                  children: graph.variables.filter(v => v.type.equal(variable.type)).map(v => ({
                    label: v.name,
                    checked: v.name === variableName,
                    onClick() {
                      //直接调用下方消息进行相关状态设置
                      node.sendSelfMessage(messages.VARIABLE_UPDATE_NAME, { name: v.name });
                      node.sendSelfMessage(messages.VARIABLE_UPDATE_TYPE, { type: v.type });
                    },
                  })),
                }
              ],
            }
          }
        }
      },
      onEditorMessage(node, context, msg) {
        //变量类型更改消息
        if (msg?.message === messages.VARIABLE_UPDATE_TYPE) {
          node.changePortParamType('OUTPUT', msg.data.type);
        }
        //变量名称更改消息
        else if (msg?.message === messages.VARIABLE_UPDATE_NAME) 
        {
          const newName = msg.data.name as string;
          const oldName = node.options.variable as string;

          ArrayUtils.remove(node.tags, oldName);
          ArrayUtils.addOnce(node.tags, newName);

          node.options.variable = newName;

          const OUTPUT = node.getPortByGUID('OUTPUT');
          if (OUTPUT)
            OUTPUT.name = newName;
        } 
      }
    },
  };
  variableSet = {
    guid: 'C9E5A4F2-B7FC-D2C4-724B-DB770A1AFBA6',
    name: '',
    description: '',
    author: 'imengyu',
    version: 1,
    category: '基础',
    hideInAddPanel: true,
    tags: [ 'variable', 'variable-set' ],
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'input',
        guid: 'INPUT',
        paramType: NodeParamType.Any,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUTPUT',
        paramType: NodeParamType.Any,
      },
    ],
    style: {
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    events: {
      onEditorCreate(node, context) {
        //在初始化时加载之前绑定的变量信息
        const graph = context.getCurrentGraph();
        const variableName = node.options.variable as string;
        const variable = variableName ? graph.variables.find(v => v.name === variableName) : undefined;
        if (variable) {
          //直接调用下方消息进行相关状态设置
          node.sendSelfMessage(messages.VARIABLE_UPDATE_NAME, { name: variableName });
          node.sendSelfMessage(messages.VARIABLE_UPDATE_TYPE, { type: variable.type });
        }
      },
      onEditorShowContextMenu(node, context) {
        const graph = context.getCurrentGraph();
        const variableName = node.options.variable as string;
        const variable = variableName ? graph.variables.find(v => v.name === variableName) : undefined;
        if (variable) {
          return {
            menu: {
              items: [
                {
                  label: '替换变量',
                  children: graph.variables.filter(v => v.type.equal(variable.type)).map(v => ({
                    label: v.name,
                    checked: v.name === variableName,
                    onClick() {
                      //直接调用下方消息进行相关状态设置
                      node.sendSelfMessage(messages.VARIABLE_UPDATE_NAME, { name: v.name });
                      node.sendSelfMessage(messages.VARIABLE_UPDATE_TYPE, { type: v.type });
                    },
                  })),
                }
              ],
            }
          }
        }
      },
      onEditorMessage(node, context, msg) {
        //变量类型更改消息
        if (msg?.message === messages.VARIABLE_UPDATE_TYPE) {
          node.changePortParamType('INPUT', msg.data.type);
          node.changePortParamType('OUTPUT', msg.data.type);
        } 
        //变量名称更改消息
        else if (msg?.message === messages.VARIABLE_UPDATE_NAME) 
        {
          const newName = msg.data.name as string;
          const oldName = node.options.variable as string;

          node.name = `设置变量 ${newName} 的值`;
          ArrayUtils.remove(node.tags, oldName);
          ArrayUtils.addOnce(node.tags, newName);

          node.options.variable = newName;
          
          const OUTPUT = node.getPortByGUID('OUTPUT');
          if (OUTPUT)
            OUTPUT.name = newName;
        } 
      }
    },
  };

  return [ variableGet, variableSet ]
}
function registerScriptGraphBase()  {

  graphCall = {
    guid: '0A2C56F2-7101-7747-50E0-40E4B73C25D9',
    name: '',
    description: '',
    author: 'imengyu',
    version: 1,
    category: '基础',
    hideInAddPanel: true,
    tags: [ 'GraphCall' ],
    ports: [],
    style: {
      logo: NodeIconEntryIn,
      titleBakgroundColor: 'rgba(255,255,255,0.05)',
    },
    events: {
      onEditorCreate(node) {
        node.sendSelfMessage(messages.GRAPH_LOAD, {});
      },
      onEditorMessage(node, context, msg) {     
        switch (msg?.message) {
          //在初始化时加载绑定的子图表信息
          case messages.GRAPH_LOAD: {
            const childGraph = getGraphCallNodeGraph(context, node);
            if (childGraph) {
              //直接调用下方消息进行相关状态设置
              node.sendSelfMessage(messages.GRAPH_ONLINE, {});
              node.sendSelfMessage(messages.GRAPH_NAME_CHANGE, { name: childGraph.name });
              node.sendSelfMessage(messages.GRAPH_PORT_CHANGE, { graph: childGraph });
              node.data.childGraph = childGraph;
            } else {
              node.sendSelfMessage(messages.GRAPH_DELETE, {});
              node.data.childGraph = null;
            }
            break;
          }
          case messages.GRAPH_PORT_CHANGE: {
            //子图表更改消息，重建入口端口
            const graph = msg.data.graph as NodeGraph;
            const inputPorts = graph.inputPorts;
            const outputPorts = graph.outputPorts;
  
            //添加图表的端口至当前节点
            inputPorts.forEach((port, index) => {
              ObjectUtils.assignIfUndefined(port, 'style', {});
              port.style!.forceNoDelete = true;
              port.direction = 'input';
              const oldPort = node.inputPorts[index];
              if (oldPort) {
                oldPort.load(port);
                oldPort.dyamicAdd = true;
              }
              else
                node.addPort(port, true, port.initialValue);
            });
            //移除多余的端口
            for (let i = inputPorts.length; i < node.inputPorts.length; i++) 
              node.deletePort(node.inputPorts[i]);
  
            outputPorts.forEach((port, index) => {
              ObjectUtils.assignIfUndefined(port, 'style', {});
              port.style!.forceNoDelete = true;
              port.direction = 'output';
              const oldPort = node.outputPorts[index];
              if (oldPort) {
                oldPort.load(port);
                oldPort.dyamicAdd = true;
              }
              else
                node.addPort(port, true, port.initialValue);
            });
            for (let i = outputPorts.length; i < node.outputPorts.length; i++) 
              node.deletePort(node.outputPorts[i]);
            node.postLateUpdateRegion();
            node.setErrorState('');
            break;
          }
          case messages.GRAPH_NAME_CHANGE: {
            //子图表名称更改消息
            const newName = msg.data.name as string;
            node.tags[0] = `GraphCall${newName}`;
            node.name = newName;
            node.options.callGraphName = newName;
            node.postLateUpdateRegion();
            node.setErrorState('');
            break;
          } 
          case messages.GRAPH_DELETE: {
            //子图表移除消息
            node.name = `未知调用 ${node.options.callGraphName}`;
            node.setErrorState('error', '调用目标图表丢失');
            node.postLateUpdateRegion();
            break;
          }
          case messages.GRAPH_ONLINE: {
            //子图表重新添加
            node.name = node.options.callGraphName as string;
            node.style.logo = node.options.callGraphType === 'function' ? NodeIconEntryFunction : NodeIconEntryIn;
            node.postLateUpdateRegion();
            node.setErrorState('');
            break;
          }
          case messages.GRAPH_PROMOTE: {
            //子图表提升为函数
            node.options.callGraphType = msg.data.type as string;
            node.sendSelfMessage(messages.GRAPH_LOAD, {});
            break;
          }
        }
      },
      onEditorClickEvent(node, context, event) {
        if (event === 'dblclick') {
          //双击进入图表
          const childGraph = node.data.childGraph as NodeGraph;
          if (childGraph) {
            context.getCurrentGraph().getParentDocunment()?.activeEditor?.openGraph(childGraph);
          } else {
            context.showSmallTip('调用目标图表丢失');
          }
        }
      }
    },
  };

  graphIn = {
    guid: '4AD57ADE-04FE-DC87-7AA6-6F3D4384F872',
    name: '入口',
    description: '',
    author: 'imengyu',
    version: 1,
    category: '基础',
    hideInAddPanel: true,
    canNotDelete: true,
    tags: [ 'GraphEntry' ],
    ports: [],
    style: {
      noIsolate: true,
      logo: NodeIconEntryGo,
    },
    events: {
      onEditorCreate(node) {
        node.sendSelfMessage(messages.GRAPH_PORT_CHANGE);
      },
      onEditorMessage(node, context, msg) {
        //子图表更改消息，重建入口端口
        if (msg?.message === messages.GRAPH_PORT_CHANGE) {
          const graph = context.getCurrentGraph();
          const inputPorts = graph.inputPorts;

          //添加图表的端口至当前节点
          inputPorts.forEach((port, index) => {
            ObjectUtils.assignIfUndefined(port, 'style', {});
            port.style!.forceNoDelete = true;
            const oldPort = node.outputPorts[index];
            if (oldPort) {
              oldPort.load(port);
              oldPort.direction = 'output';
              oldPort.dyamicAdd = true;
            }
            else
              node.addPort(port, true, port.initialValue, 'output');
          });
          //移除多余的端口
          for (let i = inputPorts.length; i < node.outputPorts.length; i++) 
            node.deletePort(node.outputPorts[i]);
        }
      }
    },
  };

  graphOut = {
    guid: '8E5E3FFF-FC2F-BAA7-00AF-A14B89125D7E',
    name: '出口',
    description: '',
    author: 'imengyu',
    version: 1,
    category: '基础',
    hideInAddPanel: true,
    canNotDelete: true,
    tags: [ 'GraphEntry' ],
    ports: [],
    style: {
      noIsolate: true,
      logo: NodeIconEntryExit,
    },
    events: {
      onEditorCreate(node) {
        node.sendSelfMessage(messages.GRAPH_PORT_CHANGE);
      },
      onEditorMessage(node, context, msg) {
        //子图表更改消息，重建入口端口
        if (msg?.message === messages.GRAPH_PORT_CHANGE) {
          const graph = context.getCurrentGraph();
          const outputPorts = graph.outputPorts;

          //添加图表的端口至当前节点
          outputPorts.forEach((port, index) => {
            ObjectUtils.assignIfUndefined(port, 'style', {});
            port.style!.forceNoDelete = true;
            const oldPort = node.inputPorts[index];
            if (oldPort) {
              oldPort.load(port);
              oldPort.direction = 'input';
              oldPort.dyamicAdd = true;
            }
            else
              node.addPort(port, true, port.initialValue, 'input');
          });
          //移除多余的端口
          for (let i = outputPorts.length; i < node.inputPorts.length; i++) 
            node.deletePort(node.inputPorts[i]);
        }
      }
    },
  };

  return [ graphCall, graphIn, graphOut ]
}
function registerDebugBase() { 
  const NodeParamTypeRegistryInstance = NodeParamTypeRegistry.getInstance();

  NodeParamTypeRegistryInstance.registerType("DebugLogLevel", {
    typeColor: '#F7C709',
    typeDescription: '',
    typeTitle: '输出日志等级',
    baseType: 'enum',
    options: [ 'log', 'info', 'warn', 'error' ],
    autoCreateEnumConverter: true,
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
  };

  return [ blockDebug, blockAssert, blockTrace  ]
}

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
        paramDefaultValue: '',
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
        paramDefaultValue: 0,
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
  };

  const blockGetTypeName : INodeDefine = {
    guid: '8D9C564C-E7A8-6741-0A8A-28ABB353A484',
    name: '获取类型名称',
    description: '此节点用于获取一个通配符参数的实际传入类型',
    author: 'imengyu',
    version: 1,
    category: '基础/类型',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Any,
        paramDefaultValue: true,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.String,
      },
    ],
    style: {
      logo: NodeIconType,
      titleState: 'hide',
      logoBackground: 'title:获取类型名称',
      minWidth: 200,
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
  };
  const blockAsTypeTypeName : INodeDefine = {
    guid: 'F0D988B1-54EE-1EFD-6CB4-5BFD2DB67EBA',
    name: '作为类型',
    description: '此节点用于定义一个通配符参数为另一个类型，如果输入类型是目标类型，则它会正确返回；反之则会抛出异常',
    author: 'imengyu',
    version: 1,
    category: '基础/转换',
    ports: [
      {
        direction: 'input',
        name: '输入',
        guid: 'IN',
        paramType: NodeParamType.Any,
        paramDefaultValue: true,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Any,
      },
    ],
    style: {
      logo: NodeIconConvert2,
      minWidth: 200,
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    events: {
      onEditorCreate(node) {
        function changeOutParamType(newType: NodeParamType) {
          const outNode = node.getPortByGUID('OUT');
          if (outNode) {
            node.options.type = newType.toString();
            node.changePortParamType(outNode, newType);
            outNode.name = `作为 ${newType.toUserFriendlyName()}`;
          }
        }

        if (node.options.type)
          changeOutParamType(NodeParamType.FromString(node.options.type as string));
        else {
          node.options.type = NodeParamType.Any.toString();
          node.updateRegion();
        }
        return {
          nodeProp: {
            before: [
              {
                title: '作为类型',
                type: 'param-type-picker',
                additionalProps: { canChangeSetType: true },
                getValue: () => node.options.type ? NodeParamType.FromString(node.options.type as string) : undefined,
                onUpdateValue: (newValue) => changeOutParamType(newValue as NodeParamType),
              }
            ],
          }
        };
      },
    },
  };
  const blockConvertToTypeTypeName : INodeDefine = {
    guid: 'EC05F8A0-AD4E-EE00-0BE4-6F02BDFD6470',
    name: '强制转换类型',
    description: '此节点用于强制转换一个通配符参数为另一个类型，如果输入类型是目标类型，则它会原样返回；反之，它会尝试可能的转换，如果无法转换，执行异常',
    author: 'imengyu',
    version: 1,
    category: '基础/转换',
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Execute,
        paramDefaultValue: true,
      },
      {
        direction: 'input',
        guid: 'DATA',
        paramType: NodeParamType.Any,
        paramDefaultValue: true,
      },
      {
        direction: 'output',
        name: '转换成功',
        guid: 'EXEC-SUCCESS',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        name: '转换失败',
        guid: 'EXEC-FAILED',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Any,
      },
    ],
    style: {
      logo: NodeIconConvert3,
      minWidth: 200,
      inputPortMinWidth: '0',
      outputPortMinWidth: '0',
    },
    events: {
      onEditorCreate(node) {

        if (node.options.type)
          changeOutParamType(NodeParamType.FromString(node.options.type as string));
        else {
          node.options.type = NodeParamType.Any.toString();
          node.updateRegion();
        }

        function changeOutParamType(newType: NodeParamType) {
          const outNode = node.getPortByGUID('OUT');
          if (outNode) {
            node.options.type = newType.toString();
            node.changePortParamType(outNode, newType);
            outNode.name = `转为 ${newType.toUserFriendlyName()}`;
          }
          node.updateRegion();
        }

        return {
          nodeProp: {
            before: [
              {
                title: '转为类型',
                type: 'param-type-picker',
                additionalProps: { canChangeSetType: true },
                getValue: () => NodeParamType.FromString(node.options.type as string),
                onUpdateValue: (newValue) => changeOutParamType(newValue as NodeParamType),
              }
            ],
          }
        };
      },
    },
  };

  return [ 
    blockString, blockNumber, blockBoolean, 
    blockGetTypeName, blockAsTypeTypeName, blockConvertToTypeTypeName 
  ];
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
          const input = document.createElement('textarea');
          input.value = node.options['content'] ? node.options['content'] as string : '';
          input.classList.add('custom-editor');
          input.classList.add('node-comment-editor');
          input.style.width = (typeof node.options['width'] === 'number' ? node.options['width'] : 210) + 'px';
          input.style.height = (typeof node.options['height'] === 'number' ? node.options['height'] : 122) + 'px';
          input.onchange = () => { 
            node.options['content'] = input.value; 
            context.markGraphChanged();
          };
          input.onmouseup = () => { 
            node.updateRegion();
            context.markGraphChanged();
          };
          input.oncontextmenu = (e) => {   
            e.stopPropagation();
            e.preventDefault();
            context.showInputRightMenu(new Vector2(e.x, e.y), e.target as HTMLInputElement);
          };
          node.data['input-control'] = input;
          parentEle.appendChild(input);
        }
        return undefined;
      },
      onSave: (node) => {
        const input = node.data['input-control'] as HTMLInputElement;
        node.options['width'] = input.offsetWidth;
        node.options['height'] = input.offsetHeight;
        node.options['content'] = input.value;
      },
      onEditorEvent: (node, context, event) => {
        switch(event) {
          case 'unselect': {
            node.updateRegion();
            break;
          }
        }
      },
    },
    style: {
      logo: NodeIconInfo,
      minHeight: 100,
      noComment: true,
      noIsolate: true,
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
      onEditorCreate: (node) => {
        node.addClass('node-block-comment-block');
      },
      onCreateCustomEditor: (parentEle, node) => {
        if (!parentEle) 
          return undefined;
        
        const blockEle = parentEle.parentNode as HTMLDivElement;
        blockEle.style.minWidth = '250px';
        blockEle.style.minHeight = '150px';
    
        const ele = document.createElement('div');
        const input = document.createElement('input');
        const span = document.createElement('span');
        input.value = node.options.comment ? node.options.comment as string : '注释';
        input.onchange = () => {
          node.options['comment'] = input.value;
          span.innerText = input.value;
        };
        input.style.display = 'none';
        input.onkeypress = (e) => {
          if(e.key === 'Enter')
            input.blur();
        };
        input.onblur = () => {
          input.style.display = 'none';
          span.style.display = 'block';
        };
        input.oncontextmenu = (e) => {
          e.stopPropagation();
          //e.preventDefault();
          //context.showInputRightMenu(new Vector2(e.x, e.y), e.target as HTMLInputElement);
        };
        span.onclick = (e) => {
          e.stopPropagation();
          if(node.selected && !node.getLastMovedBlock()) {
            span.style.display = 'none';
            input.style.display = 'block';
            input.focus();
          }
        };
        span.innerText = input.value;
        ele.classList.add('comment-block-title');
        ele.appendChild(input);
        ele.appendChild(span);

        const borderLeft = document.createElement('div');
        const borderTop = document.createElement('div');
        const borderBottom = document.createElement('div');
        borderLeft.classList.add('comment-block-border','left');
        borderTop.classList.add('comment-block-border','right');
        borderBottom.classList.add('comment-block-border','bottom');
        parentEle.appendChild(borderLeft);
        parentEle.appendChild(borderTop);
        parentEle.appendChild(borderBottom);
        parentEle.appendChild(ele);
        node.data.input = input;
      },
      onAddToEditor: (node) => {
        node.data['list'] = [];
        node.data['rect'] = new Rect();
        node.data['mouseDownPos'] = { x: 0, y: 0 };
        node.data['mouseDown'] = false;
      },
      onEditorEvent: (node, context, event) => {
        switch(event) {
          case 'unselect': {
            const list = node.data['list'] as NodeEditor[];
            const input = node.data.input as HTMLInputElement;
            if (input)
              input.blur();
            if (list)
              ArrayUtils.clear(list);
            break;
          }
        }
      },
      onEditorMoseEvent: (node, context, event, e) => {
        if (e.button === 0) {
          const list = node.data['list'] as NodeEditor[];
          const rect = node.data['rect'] as Rect;
          const mouseDownPos = node.data['mouseDownPos'] as { x: number, y: number};

          switch(event) {
            case 'down':
              if (node.getCurrentSizeType() === 0) {
                node.data.mouseDown = true;
        
                mouseDownPos.x = e.x;
                mouseDownPos.y = e.y;
          
                //保存鼠标按下时区域内的所有单元
                rect.set(node.getRect());
                ArrayUtils.clear(list);
                context.getNodesInRect(rect).forEach((v) => {
                  if(v !== node) {
                    v.saveLastNodePos();
                    list.push(v);
                  }
                });
              }
              break;
            case 'move':
              if(node.data.mouseDown && node.getCurrentSizeType() === 0) {
      
                //移动包括在注释内的单元
                const viewPort = context.getViewPort();
                const offX = e.x - mouseDownPos.x, offY =  e.y - mouseDownPos.y;
                list.forEach((v) => {
                  if (v !== node) {
                    v.position.x = v.getLastPos().x + (viewPort.scaleScreenSizeToViewportSize(offX));
                    v.position.y = v.getLastPos().y + (viewPort.scaleScreenSizeToViewportSize(offY));
                    v.updateRegion();
                  }
                })
              }
              break;
            case 'up':
              if(node.data.mouseDown)
                node.data.mouseDown = false;
              node.updateRegion();
              break;  
          }
        }
        return false;
      }
    },
    style: {
      logo: NodeIconInfo2,
      minHeight: 100,
      noTooltip: true,
      noComment: true,
      noIsolate: true,
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
        const options = node.options as unknown as ICoverterNodeOptions;

        if (
          !StringUtils.isNullOrEmpty(options.coverterFrom) && 
          !StringUtils.isNullOrEmpty(options.coverterTo)
        ) {
          const fromType = NodeParamType.FromString(options.coverterFrom);
          const toType = NodeParamType.FromString(options.coverterTo);

          const fromPort = node.getPortByGUID('INPUT') as NodePort;
          const toPort = node.getPortByGUID('OUTPUT') as NodePort;
    
          node.changePortParamType(fromPort, fromType);
          node.changePortParamType(toPort, toType);
          
          node.description = node.define.description = '转换 ' + fromType.toUserFriendlyName() + 
            ' 至 ' + toType.toUserFriendlyName();
        }
      },
    },
    style: {
      logo: NodeIconEntryString,
      minWidth: 0,
      inputPortMinWidth: 0,
      titleState: 'hide',
      titleBakgroundColor: "rgba(250,250,250,0.6)",
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
        isFlexible: 'auto',
        direction: 'input',
        defaultConnectPort: true,
        style: {
          forceNoEditorControl: true,
        },
      },
      {
        guid: 'OUTPUT',
        paramType: NodeParamType.Any,
        isFlexible: 'auto',
        isRefPassing: true,
        direction: 'output',
        style: {
          forceNoEditorControl: true,
        },
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
        const type = node.options['type'] as string;
        if(!StringUtils.isNullOrEmpty(type)) {
          const paramType = NodeParamType.FromString(type);
          node.changePortParamType(node.getPortByGUID('INPUT')!, paramType); 
          node.changePortParamType(node.getPortByGUID('OUTPUT')!, paramType); 
        }
      },
      onEditorCreate: (node, context) => {
        node.addClass('node-block-extended-line');
        return {
          editorProp: [
            { 
              type: 'check',
              title: '是否是执行',
              getValue: () => node.options['type'] as string === 'execute',
              onUpdateValue(newValue) {
                node.options['type'] = newValue ? 'execute' : 'any';
                context.unConnectNodeConnectors(node);
                const paramType = newValue ? NodeParamType.Execute : NodeParamType.Any;
                node.changePortParamType(node.getPortByGUID('INPUT')!, paramType); 
                node.changePortParamType(node.getPortByGUID('OUTPUT')!, paramType); 
              },
            },
          ],
        }
      },
    },
  };
  const connNode2 : INodeDefine = {
    guid: '799E6D41-BB70-83FA-6995-F7A8B6037AEB',
    name: '执行延长线',
    author: 'imengyu',
    version: 1,
    category: '',
    ports: [
      {
        guid: 'INPUT',
        paramType: NodeParamType.Execute,
        isRefPassing: true,
        direction: 'input',
        defaultConnectPort: true,
      },
      {
        guid: 'OUTPUT',
        paramType: NodeParamType.Execute,
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
      onEditorCreate: (node) => {
        node.addClass('node-block-extended-line');
      },
    },
  };

  return [ connNode, connNode2 ];
}