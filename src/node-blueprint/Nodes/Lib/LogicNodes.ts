import type { INodeDefine, INodeEventSettings } from "@/node-blueprint/Base/Flow/Node/Node";
import type { INodePortDefine } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodePackage } from "@/node-blueprint/Base/Flow/Registry/NodePackage";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import type { ICalcScalarOptions } from "./OperatorNodes";

import NodeIconAnd from '../NodeIcon/and.svg';
import NodeIconOr from '../NodeIcon/or.svg';
import NodeIconNot from '../NodeIcon/not.svg';
import NodeIconXor from '../NodeIcon/xor.svg';
import NodeIconEqual from '../NodeIcon/equal.svg';
import NodeIconNotEqual from '../NodeIcon/not_equal.svg';
import NodeIconLess from '../NodeIcon/less.svg';
import NodeIconLessOrEqual from '../NodeIcon/less_or_equal.svg';
import NodeIconGreater from '../NodeIcon/greater.svg';
import NodeIconGreaterOrEqual from '../NodeIcon/greater_or_equal.svg';
import NodeIconLeftMove from '../NodeIcon/left_move.svg';
import NodeIconRightMove from '../NodeIcon/right_move.svg';

export default { 
  register,
  packageName: 'Logic',
  version: 1,
} as NodePackage;

function register() {

  const LogicBasePorts : INodePortDefine[] = [
    {
      direction: 'input',
      guid: 'PI0',
      paramType: NodeParamType.Any,
      isFlexible: 'auto',
    },
    {
      description: '',
      direction: 'input',
      guid: 'PI1',
      paramType: NodeParamType.Any,
      isFlexible: 'auto',
    },
    {
      description: '',
      direction: 'output',
      guid: 'OUTPUT',
      paramType: NodeParamType.Any,
      isFlexible: 'auto',
    },
  ];
  const LogicBaseComparePorts : INodePortDefine[] = [
    {
      direction: 'input',
      guid: 'PI1',
      paramType: NodeParamType.Any,
      isFlexible: 'auto',
    },
    {
      direction: 'input',
      guid: 'PI2',
      paramType: NodeParamType.Any,
      isFlexible: 'auto',
    },
    {
      direction: 'output',
      guid: 'RESULT',
      paramType: NodeParamType.Boolean,
    },
  ];
  const LogicBaseOnCreate : INodeEventSettings['onCreate'] = (node) => {
    const options = node.getOptions<ICalcScalarOptions>();
    if (typeof options.opType === 'undefined') {
      options.opType = 'any';
    } else {
      //更换数据类型
      node.ports.forEach((port) => {
        if (port.guid !== 'RESULT')
          node.changePortParamType(port, NodeParamType.FromString(options.opType), false);
      });
    }
  };
  const LogicBaseOnUserAddPort : INodeEventSettings['onUserAddPort'] = (node) => {
    const options = node.getOptions<ICalcScalarOptions>();
    options.opType = options.opType ?? 'any';
    return [{
      guid: node.getUseablePortGuid('INPUT'),
      paramType: NodeParamType.FromString(options.opType),
      direction: 'input',
      isFlexible: 'auto',
    }];
  };
  const LogicBaseOnPortFlexUpdate : INodeEventSettings['onPortFlexUpdate'] = (node, port, context, type) => {
    if (port.guid === 'OUTPUT' || port.guid === 'RESULT') {
      const options = node.getOptions<ICalcScalarOptions>();
      options.opType = type?.toString() ?? 'any';
    }
  };

  const And : INodeDefine = {
    guid: "F839DDA4-B666-74B6-E8B7-836D63708B65", 
    name: "与", 
    description: '逻辑与运算',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    userCanAddInputParam: true,
    ports: LogicBasePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onUserAddPort: LogicBaseOnUserAddPort,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconAnd,
      logoBackground: NodeIconAnd,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const Or : INodeDefine = {
    guid: "29D1D2D3-47E1-2B67-C527-9E9274E6C582", 
    name: "或", 
    description: '逻辑或运算',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    userCanAddInputParam: true,
    ports: LogicBasePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onUserAddPort: LogicBaseOnUserAddPort,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconOr,
      logoBackground: NodeIconOr,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const Not : INodeDefine = {
    guid: "E0D54F96-611E-C8AB-E347-5DEA1E9C227F", 
    name: "非", 
    description: '逻辑非运算',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBasePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconNot,
      logoBackground: NodeIconNot,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const ExclusiveOr : INodeDefine = {
    guid: "ED238520-58E6-AA7B-8787-26F2853D1248", 
    name: "异或", 
    description: '逻辑异或与运算',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBasePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconXor,
      logoBackground: NodeIconXor,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const Equal : INodeDefine = {
    guid: "B3D85366-FE65-1F1E-BAC8-F896668AD87C", 
    name: "相等", 
    description: '判断两个数是否相等',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconEqual,
      logoBackground: NodeIconEqual,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const NotEqual : INodeDefine = {
    guid: "6BE62EF6-A031-6D24-6720-99ABF1BBE5C1", 
    name: "不相等", 
    description: '判断两个数是否不相等',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconNotEqual,
      logoBackground: NodeIconNotEqual,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const Less : INodeDefine = {
    guid: "CFFCEB53-B68C-98AE-3363-455BDE728F88", 
    name: "小于", 
    description: '判断一个数是小于另一个数',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconLess,
      logoBackground: NodeIconLess,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const Greater : INodeDefine = {
    guid: "1FF0A894-C51E-F2ED-AEC8-9156ED490895", 
    name: "大于", 
    description: '判断一个数是大于另一个数',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconGreater,
      logoBackground: NodeIconGreater,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const LessOrEqual : INodeDefine = {
    guid: "57F7A1F6-51AE-6071-0926-5420877B9E20", 
    name: "小于或等于", 
    description: '判断一个数是小于或等于另一个数',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconLessOrEqual,
      logoBackground: NodeIconLessOrEqual,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const GreaterOrEqual : INodeDefine = {
    guid: "97DAB36F-B83F-9473-8B56-6FDB422E6D4F", 
    name: "大于或等于", 
    description: '判断一个数是大于或等于另一个数',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconGreaterOrEqual,
      logoBackground: NodeIconGreaterOrEqual,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const LeftMove : INodeDefine = {
    guid: "E9E8B9CD-3C86-081C-A46C-DE325062CD87", 
    name: "左移", 
    description: '按位左移',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconLeftMove,
      logoBackground: NodeIconLeftMove,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };
  const RightMove : INodeDefine = {
    guid: "3B3AB761-33B9-3CC6-45B0-AE9F6B300458", 
    name: "右移", 
    description: '按位右移',
    version: 1,
    author: 'imengyu',
    category: '逻辑',
    ports: LogicBaseComparePorts,
    events: {
      onCreate: LogicBaseOnCreate,
      onPortFlexUpdate: LogicBaseOnPortFlexUpdate,
    },
    style: {
      logo: NodeIconRightMove,
      logoBackground: NodeIconRightMove,
      titleState: 'hide',
      inputPortMinWidth: 0,
      outputPortMinWidth: 0,
    },
  };

  return [And, Or, Not, ExclusiveOr, Equal, NotEqual, Less, Greater, LessOrEqual, GreaterOrEqual, LeftMove, RightMove];
}