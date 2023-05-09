import type { INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import { NodeParamTypeRegistry } from "@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry";
import StringUtils from "@/node-blueprint/Base/Utils/StringUtils";

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
    /* registerLoadLib(),
    registerCommentBlock(),
    registerConvertBlock(),
    registerConnBlock(), */
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
let commentBlock : INodeDefine;
let convertBlock : INodeDefine;

import BlockIconSwith from '../BlockIcon/switch.svg';
import BlockIconClock from '../BlockIcon/clock.svg';
import BlockIconClock2 from '../BlockIcon/clock2.svg';
import BlockIconEntryGo from '../BlockIcon/entry_go.svg';
import BlockIconEntryExit from '../BlockIcon/entry_exit.svg';
import BlockIconEntryWarning from '../BlockIcon/warning.svg';
import BlockIconEntryTrace from '../BlockIcon/trace.svg';
import BlockIconEntryNumber from '../BlockIcon/number.svg';
import BlockIconEntryString from '../BlockIcon/string.svg';
import BlockIconEntryBoolean from '../BlockIcon/boolean.svg';
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import { NodeRegistry } from "@/node-blueprint/Base/Flow/Registry/NodeRegistry";

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
      logo: BlockIconEntryGo,
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
      logo: BlockIconEntryExit,
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
      logo: BlockIconSwith,
      minWidth: 140,
      titleBakgroundColor: "rgba(255,20,147,0.6)",
      titleState: 'small',
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
      logo: BlockIconClock,
      logoRight: BlockIconClock,
    },
    simulate: {
      onPortExecuteIn: (node, port) => {
        /* let v = node.getInputParamValue('TIME');
        let context = block.currentRunningContext;
        context.markContexInUse();
        setTimeout(() => {
          block.activeOutputPortInNewContext('OUT');
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
        /* let context = block.currentRunningContext;
        let variables = block.variables();
        switch(port.guid) {
          case 'START': {
            let v = block.getInputParamValue('TIME');
            context.markContexInUse();
            variables['intervalId'] = setInterval(() => {
              block.activeOutputPortInNewContext('OUT');
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
      logo: BlockIconClock2,
      logoRight: BlockIconClock2,
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
      logo: BlockIconEntryWarning,
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
        /* let con = block.getInputParamValue('CONDITION');
        let throwError = block.getInputParamValue('THROWERR');
        if(con)
          block.activeOutputPort('SUCCESS');
        else {
          if(throwError)
            block.throwError('条件断言失败！', port, 'error', true);
          else {
            block.throwError('条件断言失败！', port, 'warning', false);
            block.activeOutputPort('FAILED');
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
      logo: BlockIconEntryTrace,
      titleBakgroundColor: "rgba(120,200,254,0.6)",
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
        //打印调用堆栈
        //logger.log(block.getName(), block.currentRunningContext.runner.mainContext.printCallStack(true));
        //block.activeOutputPort('OUT');
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
      logo: BlockIconEntryTrace,
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
      logo: BlockIconEntryTrace,
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
      logo: BlockIconEntryString,
      titleState: 'hide',
      titleBakgroundColor: "rgba(255,20,147,0.6)",
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
      logo: BlockIconEntryNumber,
      titleState: 'hide',
      titleBakgroundColor: "rgba(158,258,68,0.6)",
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
      logo: BlockIconEntryString,
      titleState: 'hide',
      titleBakgroundColor: "rgba(180,0,0,0.6)",
    },
    simulate: {
      onPortExecuteIn: (block, port) => {
      }
    },
  };

  return [ blockString, blockNumber, blockBoolean ];
}
/* function registerLoadLib() {
  return [];
}
function registerCommentBlock() {

  let block = new INodeDefine("088C2A25-192D-42E7-D31B-B5E9FB7C68DD", "文档注释", "", 'imengyu', '');
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

  commentBlock = new INodeDefine("24AA3DF0-49D9-84D9-8138-534505C33327", "注释块", "", 'imengyu', '');
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

  let block = new INodeDefine("8C7DA763-05C1-61AF-DCD2-174CB6C2C279", "转换器", "", 'imengyu', '基础/转换');
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
      let input = block.getInputParamValue('INPUT', context);
      return coverter.converter(input);
    } else {
      block.throwError('转换器没有设置转换方法，请删除之后重新添加', port, 'error');
      return undefined;
    }
  };
  
  convertBlock = block;

  let parseFloatBlock = new INodeDefine("6A644C89-F7FA-E615-6342-D7E747710DD6", "parseFloat", '转换为浮点数', 'imengyu', '基础/转换');
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
    let input = block.getInputParamValue('INPUT', context);
    return parseFloat(input);
  };

  let parseIntBlock = new INodeDefine("824AB4F0-7C8F-A12F-6CA6-87266464BD6E", "parseInt", '转换为整数', 'imengyu', '基础/转换');
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
    let input = block.getInputParamValue('INPUT', context);
    return parseInt(input);
  };

  return [ block, parseFloatBlock, parseIntBlock ];
}
function registerConnBlock() {
  let block = new INodeDefine("8A94A788-ED4E-E521-5BC2-4D69B59BAB80", "数据延长线", "", 'imengyu', '');

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
} */