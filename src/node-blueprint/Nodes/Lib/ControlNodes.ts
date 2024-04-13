import type { INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodePackage } from "@/node-blueprint/Base/Flow/Registry/NodePackage";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";

import NodeIconBranch from '../NodeIcon/branch.svg';
import NodeIconSwitch from '../NodeIcon/switch.svg';
import NodeIconSelect from '../NodeIcon/select.svg';
import NodeIconLoop from '../NodeIcon/loop.svg';
import NodeIconFlipflop from '../NodeIcon/flipflop.svg';
import NodeIconGate from '../NodeIcon/gate.svg';
import NodeIconDoN from '../NodeIcon/do_n.svg';
import NodeIconDoOnce from '../NodeIcon/do_once.svg';
import NodeIconSequence from '../NodeIcon/sequence.svg';

export default { 
  register,
  packageName: 'Control',
  version: 1,
} as NodePackage;

function register() {

  const blockBranch : INodeDefine = {
    guid: 'E8DB1B75-FDBD-1A0A-6D99-F91FAEAB3131',
    name: '条件分支',
    description: '通过判断条件为真或假分支流图',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI0',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        name: '条件',
        guid: 'PICON',
        paramType: NodeParamType.Boolean,
        paramDefaultValue: true,
        direction: 'input'
      },
      {
        name: '为真',
        guid: 'POTRUE',
        paramType: NodeParamType.Execute,
        direction: 'output'
      },
      {
        name: '为假',
        guid: 'POFALSE',
        paramType: NodeParamType.Execute,
        direction: 'output'
      },
    ],
    style: {
      logo: NodeIconBranch,
      inputPortMinWidth: 0,
    },
  };
  const blockSwitch : INodeDefine = {
    guid: "BC9184EA-2866-3C9A-5A22-75E79DA5AF181",
    name: "分支",
    author: 'imengyu',
    version: 1,
    category: '控制',
    style: {
      logo: NodeIconSwitch,
      inputPortMinWidth: 0,
    },
    //TODO: 完成节点
  };
  const blockSelect : INodeDefine = {
    guid: "144AB2CC-F807-7021-1442-A8E7CD1FF1BE",
    name: "选择",
    author: 'imengyu',
    version: 1,
    category: '控制',
    style: {
      logo: NodeIconSelect,
      inputPortMinWidth: 0,
    },
    //TODO: 完成节点
  };
  const blockWhile : INodeDefine = {
    guid: "28ADE8D9-50E9-FA84-0BFB-A48AF754D1FD", 
    name: "While 循环",
    description: '如果条件为真则循环',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports:[
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PICON',
        paramType: NodeParamType.Boolean,
        paramDefaultValue: true,
        direction: 'input',
        name: '条件',
      },
      {
        guid: 'POEXIT',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '循环结束'
      },
      {
        guid: 'POLOOP',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '循环体',
      },
    ],
    style: {
      logo: NodeIconLoop,
      inputPortMinWidth: 0,
    },
  };
  const blockDoWhile : INodeDefine = {
    guid: "18CD0C99-C47C-525F-D757-0712441B794E", 
    name: "Do While 循环",
    description: '先执行循环体，然后再判断条件是否为真',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PICON',
        paramType: NodeParamType.Boolean,
        paramDefaultValue: true,
        direction: 'input',
        name: '条件',
      },
      {
        guid: 'POEXIT',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '循环结束'
      },
      {
        guid: 'POLOOP',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '循环体',
      },
    ],
    style: {
      logo: NodeIconLoop,
      inputPortMinWidth: 0,
    },
  };
  const blockFor : INodeDefine = {
    guid: "949F91AA-D35E-E9E8-8B4B-36EDBD5B1AAD", 
    name: "For 循环",
    description: "从 起始索引值 至 结束索引值 按 步长 进行循环",
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PISTINX',
        paramType: NodeParamType.Number,
        direction: 'input',
        name: '起始索引值',
        paramDefaultValue: 0,
      },
      {
        guid: 'PIENINX',
        paramType: NodeParamType.Number,
        direction: 'input',
        name: '结束索引值',
        paramDefaultValue: 10,
      },
      {
        guid: 'PISTEP',
        paramType: NodeParamType.Number,
        direction: 'input',
        name: '步长',
        description: '循环自增步长。可以为负数，但 结束索引值 必须 小于 起始索引值',
        paramDefaultValue: 1,
      },
      {
        guid: 'POEXIT',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '循环结束'
      },
      {
        guid: 'POLOOP',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '循环体',
      },
      {
        guid: 'POINDEX',
        paramType: NodeParamType.Number,
        direction: 'output',
        name: '当前索引',
      },
    ],
    style: {
      logo: NodeIconLoop,
      inputPortMinWidth: 0,
    },
  };
  const blockSequence : INodeDefine = {
    guid: "4253F127-DEDB-D1BE-AF0E-9795E421DFF0", 
    name: "顺序执行",
    description: '按顺序执行每个输入',
    author: 'imengyu',
    version: 1,
    category: '控制',
    userCanAddOutputExecute: true,
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PO',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: '执行0'
      },
    ],
    events: {
      onUserAddPort: (node) => {
        const newGuid = node.getUseablePortGuid('P');
        return [{
          guid: newGuid,
          paramType: NodeParamType.Execute,
          direction: 'output',
          name: `执行${newGuid.substring(1)}`,
        }]
      },
    },
    style: {
      logo: NodeIconSequence,
      inputPortMinWidth: 0,
    },
  };
  const blockDoOnce : INodeDefine = {
    guid: "79EC0B90-F5B7-BAA3-C3C5-1D2371E8AF0F", 
    name: "Do Once",
    description: '使执行只通过1次',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PIRESET',
        paramType: NodeParamType.Execute,
        direction: 'input',
        name: '重置'
      },
      {
        guid: 'PISTARTOFF',
        paramType: NodeParamType.Boolean,
        direction: 'input',
        name: '开始时是关闭的'
      },
      {
        guid: 'PO',
        paramType: NodeParamType.Execute,
        direction: 'output',
      },
    ],
    style: {
      logo: NodeIconDoOnce,
      inputPortMinWidth: 0,
    },
  };
  const blockDoN : INodeDefine = {
    guid: "38F76740-BE6A-23E4-1F6F-FC252314ADDB", 
    name: "Do N",
    description: '使执行只通过N次',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PIN',
        paramType: NodeParamType.Number,
        direction: 'input',
        name: 'N'
      },
      {
        guid: 'PIRESET',
        paramType: NodeParamType.Execute,
        direction: 'input',
        name: '重置'
      },
      {
        guid: 'PO',
        paramType: NodeParamType.Execute,
        direction: 'output',
      },
      {
        guid: 'POCOUNT',
        paramType: NodeParamType.Number,
        direction: 'output',
        name: '当前计数',
      },
    ],
    style: {
      logo: NodeIconDoN,
      inputPortMinWidth: 0,
    },
  };
  const blockFlipFlop : INodeDefine = {
    guid: "6E4471BE-6022-5FA9-368D-8CB784E3F73B", 
    name: "Flip Flop",
    description: '在A和B之间循环往复',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'POA',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: 'A',
      },
      {
        guid: 'POB',
        paramType: NodeParamType.Execute,
        direction: 'output',
        name: 'B'
      },
      {
        guid: 'POC',
        paramType: NodeParamType.Boolean,
        direction: 'output',
        name: '是否是A'
      },
    ],
    style: {
      logo: NodeIconFlipflop,
      inputPortMinWidth: 0,
    },
  };
  const blockToggle : INodeDefine = {
    guid: "A8AC23FE-EB32-D6B0-A9DA-BFAA1BC1EB8D", 
    name: "开关",
    description: '开关门，通过一个开关来控制流程的通或断',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
      {
        guid: 'PION',
        paramType: NodeParamType.Execute,
        direction: 'input',
        name: '开',
      },
      {
        guid: 'PIOFF',
        paramType: NodeParamType.Execute,
        direction: 'input',
        name: '关'
      },
      {
        guid: 'PITOGGLE',
        paramType: NodeParamType.Execute,
        direction: 'input',
        name: '切换'
      },
      {
        guid: 'PISTARTOFF',
        paramType: NodeParamType.Boolean,
        direction: 'input',
        name: '开始时是关闭的'
      },
      {
        guid: 'PO',
        paramType: NodeParamType.Execute,
        direction: 'output',
      },
    ],
    style: {
      logo: NodeIconGate,
      inputPortMinWidth: 0,
    },
  };
  const blockBreak : INodeDefine = {
    guid: "2C75DB8A-1061-ABE0-B7E9-09953C335050", 
    name: "终止循环",
    description: '终止当前调用栈上的一层For或者While循环',
    author: 'imengyu',
    version: 1,
    category: '控制',
    ports: [
      {
        guid: 'PI',
        paramType: NodeParamType.Execute,
        direction: 'input'
      },
    ],
    style: {
      logo: NodeIconGate,
      inputPortMinWidth: 0,
    },
  };

  return [
    blockBranch,
    blockSwitch,
    blockSelect,
    blockWhile,
    blockDoWhile,
    blockFor,
    blockSequence,
    blockDoOnce,
    blockDoN,
    blockFlipFlop,
    blockToggle,
    blockBreak,
  ];
}