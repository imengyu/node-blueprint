import type { INodeDefine, INodeEventSettings } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodePackage } from "@/node-blueprint/Base/Flow/Registry/NodePackage";
import type { INodePortDefine } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodePortEditor } from "@/node-blueprint/Editor/Graph/Flow/NodePortEditor";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";
import { h } from "vue";
import StringEditor from "@/node-blueprint/Editor/Graph/TypeEditor/StringEditor.vue";

export default { 
  register() {
    return registerCalcBase().concat(
      registerCalcScalar()).concat(
      registerOperatorBase());
  },
  packageName: 'Operator',
  version: 1,
} as NodePackage;

import NodeIconAdd from '../NodeIcon/add.svg';
import NodeIconSub from '../NodeIcon/sub.svg';
import NodeIconMul from '../NodeIcon/multiply.svg';
import NodeIconDiv from '../NodeIcon/divide.svg';
import NodeIconAbs from '../NodeIcon/abs.svg';
import NodeIconMin from '../NodeIcon/min.svg';
import NodeIconMax from '../NodeIcon/max.svg';
import NodeIconAvg from '../NodeIcon/avg.svg';
import NodeIconRound from '../NodeIcon/round.svg';
import NodeIconSqrt from '../NodeIcon/sqrt.svg';
import NodeIconExp from '../NodeIcon/exp.svg';
import NodeIconModulo from '../NodeIcon/modulo.svg';

export interface ICalcScalarOptions {
  opType: string;
}
export interface IOtherDynamicPortNodeOptions {
  portCount: number;
}

function registerCalcBase() {

  const CalcBaseCommonPorts : INodePortDefine[] = [
    {
      direction: 'input',
      guid: 'INPUT0',
      paramType: NodeParamType.Any,
      isFlexible: 'auto',
    },
    {
      description: '',
      direction: 'input',
      guid: 'INPUT1',
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
  const CalcBaseOnCreate : INodeEventSettings['onCreate'] = (node) => {
    const options = node.getOptions<ICalcScalarOptions>();
    if (typeof options.opType === 'undefined') {
      options.opType = 'any';
    } else {
      //更换数据类型
      node.ports.forEach((port) => {
        if (!port.paramType.isExecute)
          node.changePortParamType(port, NodeParamType.FromString(options.opType), false);
      });
    }
  };
  const CalcBaseOnUserAddPort : INodeEventSettings['onUserAddPort'] = (node) => {
    const options = node.getOptions<ICalcScalarOptions>();
    options.opType = options.opType ?? 'any';
    return [{
      guid: node.getUseablePortGuid('INPUT'),
      paramType: NodeParamType.FromString(options.opType),
      direction: 'input',
      isFlexible: 'auto',
    }];
  };
  const CalcBaseOnPortFlexUpdate : INodeEventSettings['onPortFlexUpdate'] = (node, port, context, type) => {
    if (port.guid === 'OUTPUT') {
      const options = node.getOptions<ICalcScalarOptions>();
      options.opType = type?.toString() ?? 'any';
    }
  };

  const blockAddition : INodeDefine = {
    guid: "31CCFD61-0164-015A-04B1-732F0A7D6661",
    name: "加",
    description: '相加单元，相加两个或多个参数',
    author: 'imengyu',
    category: '运算',
    version: 1,
    style: {
      logo: NodeIconAdd,
      logoBackground: NodeIconAdd,
      titleState: 'hide',
      inputPortMinWidth: 0,
      snapGridOffsetY: -5,
    },
    events: {
      onCreate: CalcBaseOnCreate,
      onUserAddPort: CalcBaseOnUserAddPort,
      onPortFlexUpdate: CalcBaseOnPortFlexUpdate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
  };
  const blockSubstract : INodeDefine = {
    guid: '1B0A8EDC-D8FE-C6D1-0DD6-803BC08562EB',
    name: "减",
    description: '相减单元，相减两个或多个参数',
    author: 'imengyu',
    category: '运算',
    version: 1,
    style: {
      logo: NodeIconSub,
      logoBackground: NodeIconSub,
      titleState: 'hide',
      inputPortMinWidth: 0,
      snapGridOffsetY: -5,
    },
    events: {
      onCreate: CalcBaseOnCreate,
      onUserAddPort: CalcBaseOnUserAddPort,
      onPortFlexUpdate: CalcBaseOnPortFlexUpdate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
  };
  const blockMultiply : INodeDefine = {
    guid: "49984155-77D8-3C54-AEB1-24F4695C0609",
    name: "乘",
    description: '相乘单元，相乘两个或多个参数',
    author: 'imengyu',
    category: '运算',
    version: 1,
    style: {
      logo: NodeIconMul,
      logoBackground: NodeIconMul,
      titleState: 'hide',
      inputPortMinWidth: 0,
      snapGridOffsetY: -5,
    },
    events: {
      onCreate: CalcBaseOnCreate,
      onUserAddPort: CalcBaseOnUserAddPort,
      onPortFlexUpdate: CalcBaseOnPortFlexUpdate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
  };
  const blockDivide : INodeDefine = {
    guid: "FFCA28BB-B182-0D05-5ECE-AF2F7B549B6B",
    name: "除",
    description: '相除单元，相除两个或多个参数',
    author: 'imengyu',
    category: '运算',
    version: 1,
    style: {
      logo: NodeIconDiv,
      logoBackground: NodeIconDiv,
      titleState: 'hide',
      inputPortMinWidth: 0,
      snapGridOffsetY: -5,
    },
    events: {
      onCreate: CalcBaseOnCreate,
      onUserAddPort: CalcBaseOnUserAddPort,
      onPortFlexUpdate: CalcBaseOnPortFlexUpdate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
  };

  return [blockAddition, blockSubstract, blockMultiply, blockDivide];
}

function registerCalcScalar() {

  const CalcScalar_onUserAddPort : INodeEventSettings['onUserAddPort'] = async (node, context, data) => {
    return [{
      guid: node.getUseablePortGuid('PI'),
      paramType: data?.type === 'execute' ? NodeParamType.Execute : NodeParamType.Number,
      direction: data?.direction ?? 'input',
    }];
  };

  const CalcScalarCommonPorts : INodePortDefine[] = [
    {
      direction: 'input',
      guid: 'BI',
      paramType: NodeParamType.Execute,
    },
    {
      direction: 'output',
      guid: 'BO',
      paramType: NodeParamType.Execute,
    }
  ];
  const CalcScalarCommonParamPorts : INodePortDefine[] = [
    {
      direction: 'input',
      guid: 'PI1',
      paramType: NodeParamType.Number,
      paramDefaultValue: 0,
    },
    {
      direction: 'input',
      guid: 'PI2',
      paramType: NodeParamType.Number,
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: 'PO1',
      paramType: NodeParamType.Number,
      paramDefaultValue: 0,
    },
  ];

  const blockAbsolute : INodeDefine = { 
    guid: "24CC6573-C39B-915C-5356-AAEB8EEF9CAF", 
    name: '绝对值', 
    description: '求一个数的绝对值', 
    category: '运算',
    version: 1,
    ports: CalcScalarCommonPorts.concat([
      {
        description: '需要取绝对值的数',
        direction: 'input',
        paramDefaultValue: 0,
        guid: 'PI1',
        paramType: NodeParamType.Number,
      },
      {
        description: '绝对值',
        direction: 'output',
        guid: 'PO1',
        paramType: NodeParamType.Number,
      },
    ]),
    style: {
      logo: NodeIconAbs,
      inputPortMinWidth: 0,
    },
  };
  const blockExponentiate : INodeDefine = { 
    guid: "3279E42C-0A2D-38B2-9B46-5E1BD444A817", 
    name: '指数',  
    description: '求一个数的n次方', 
    category: '运算',
    version: 1,
    ports: CalcScalarCommonPorts.concat([
      {
        name: "x",
        description: '底数',
        paramDefaultValue: 2,
        direction: 'input',
        guid: 'PI1',
        paramType: NodeParamType.Number,
      },
      {
        name: "n",
        description: '指数',
        paramDefaultValue: 3,
        direction: 'input',
        guid: 'PI2',
        paramType: NodeParamType.Number,
      },
      {
        name: "xⁿ",
        description: 'x的n次方',
        direction: 'output',
        guid: 'PO1',
        paramType: NodeParamType.Number,
      },
    ]),
    style: {
      logo: NodeIconExp,
      inputPortMinWidth: 0,
    },
  };
  const blockRoot : INodeDefine = { 
    guid: "83AB5460-07E1-6F55-CE3E-841DD117D891", 
    name: '开方',  
    description: '开一个数的n次方', 
    category: '运算',
    version: 1,
    ports: CalcScalarCommonPorts.concat([
      {
        name: "x",
        description: '被开方数',
        direction: 'input',
        paramDefaultValue: 9,
        guid: 'PI1',
        paramType: NodeParamType.Number,
      },
      {
        name: "n",
        description: '开方次数',
        direction: 'input',
        paramDefaultValue: 2,
        guid: 'PI2',
        paramType: NodeParamType.Number,
      },
      {
        name: "ⁿ√x",
        description: 'x的n次根',
        direction: 'output',
        guid: 'PO1',
        paramType: NodeParamType.Number,
      },
    ]),
    style: {
      logo: NodeIconSqrt,
      inputPortMinWidth: 0,
    },
  };
  const blockRound : INodeDefine = { 
    guid: "ACE2AF65-C644-9B68-C3E0-92484F60301A", 
    name: '取整',  
    description: '将一个数取整', 
    category: '运算',
    version: 1,
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'input',
        guid: 'MIN',
        name: '最小值',
        paramType: NodeParamType.Number,
        paramDefaultValue: 0,
      },
      {
        direction: 'input',
        guid: 'MAX',
        name: '最大值',
        paramType: NodeParamType.Number,
        paramDefaultValue: 10,
      },
      {
        direction: 'output',
        guid: 'VALUE',
        paramType: NodeParamType.Number,
      },
    ],
    style: {
      logo: NodeIconRound,
      inputPortMinWidth: 0,
    },
  };
  const blockAverage : INodeDefine = { 
    guid: "C71EB51A-A0D8-9C12-A5F2-0D3CAE3111FC", 
    name: '平均值',  
    description: '求一些数的平均值', 
    category: '运算',
    version: 1,
    userCanAddInputParam: true,
    ports: CalcScalarCommonPorts.concat(CalcScalarCommonParamPorts),
    style: {
      logo: NodeIconAvg,
      inputPortMinWidth: 0,
    },
    events: {
      onUserAddPort: CalcScalar_onUserAddPort,
    },
  };
  const blockMaximum : INodeDefine = { 
    guid: "62FCF10F-1891-9DD7-1C53-129F5F580E18", 
    name: '最大值',  
    description: '获取一些数中的最大值', 
    category: '运算',
    version: 1,
    userCanAddInputParam: true,
    ports: CalcScalarCommonPorts.concat(CalcScalarCommonParamPorts),
    style: {
      logo: NodeIconMax,
      inputPortMinWidth: 0,
    },
    events: {
      onUserAddPort: CalcScalar_onUserAddPort,
    },
  };
  const blockMinimum  : INodeDefine = { 
    guid: "FA97A675-A872-0967-715D-57F0E0FFB75B", 
    name: '最小值',  
    description: '获取一些数中的最小值', 
    category: '运算',
    version: 1,
    userCanAddInputParam: true,
    ports: CalcScalarCommonPorts.concat(CalcScalarCommonParamPorts),
    style: {
      logo: NodeIconMin,
      inputPortMinWidth: 0,
    },
    events: {
      onUserAddPort: CalcScalar_onUserAddPort,
    },
  };
  const blockModulo : INodeDefine = { 
    guid: "ECD228AA-D88D-E02D-51FB-DAEE67ABA31C", 
    name: "求余",  
    description: '求余单元，对两个参数求余', 
    category: '运算',
    version: 1,
    ports: CalcScalarCommonPorts.concat(CalcScalarCommonParamPorts),
    style: {
      logo: NodeIconModulo,
      inputPortMinWidth: 0,
    },
  };
  const blockRandom : INodeDefine = { 
    guid: "2076EDF9-91D4-5C77-28A1-D6390ECD5BFC", 
    name: "随机数",  
    description: '生成指定范围的随机数', 
    category: '运算',
    version: 1,
    ports: [
      {
        direction: 'input',
        guid: 'IN',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'output',
        guid: 'OUT',
        paramType: NodeParamType.Execute,
      },
      {
        direction: 'input',
        guid: 'MIN',
        name: '最小值',
        paramType: NodeParamType.Number,
        paramDefaultValue: 0,
      },
      {
        direction: 'input',
        guid: 'MAX',
        name: '最大值',
        paramType: NodeParamType.Number,
        paramDefaultValue: 10,
      },
      {
        direction: 'output',
        guid: 'VALUE',
        paramType: NodeParamType.Number,
      },
    ],
  };

  return [
    blockAbsolute, blockExponentiate, blockRoot,
    blockRound, blockAverage, blockMaximum, 
    blockMinimum, blockModulo, blockRandom
  ];
}

function registerOperatorBase() {
  const blockAccessObject : INodeDefine = {
    guid: "CDC97AAC-1E4F-3C65-94D8-1566A246D0A2", 
    name: "访问对象属性", 
    description: '通过键值访问对象的属性', 
    author: '',
    category: '基础/对象',
    version: 1,
    userCanAddInputParam: true,
    ports: [
      {
        guid: 'IN',
        direction: 'input',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OBJECT',
        name : 'OBJECT',
        direction: 'input',
        paramType: NodeParamType.Object,
        description: '要访问的对象',
      },
      {
        guid: 'KEY0',
        name: '键0',
        direction: 'input',
        paramType: NodeParamType.String,
        description: '要访问的字段键值0',
      },
      {
        guid: 'OUT',
        direction: 'output',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'VALUE0', 
        name : '键值0',
        direction: 'output',
        description: '键值0的字段',
        paramType: NodeParamType.Any,
        style: {
          topSpace: 1,
        },
      },
    ],
    events: {
      onUserAddPort: async (node) => {
        const options = node.getOptions<IOtherDynamicPortNodeOptions>();
        options.portCount = options.portCount ?? 0;
        options.portCount++;
        return [
          {
            guid: 'KEY' + options.portCount,
            name: '键' + options.portCount,
            direction: 'input',
            paramType: NodeParamType.String,
            description: '要访问的字段键值' + options.portCount,
          },
          {
            guid: 'VALUE' + options.portCount,
            direction: 'output',
            paramType: NodeParamType.Any,
            name: '键值' + options.portCount,
            description: '键值' + options.portCount + '的字段',
            style: {
              forceNoDelete: true,
            },
          },
        ]
      },
      onUserDeletePort: async (node, context, port) => {
        if (!port)
          return undefined;
        if (port.guid.startsWith('VALUE'))
          return true;
        if (port.guid.startsWith('KEY')) {
          const id = port.guid.substr(3);
          const port2 = node.getPortByGUID('VALUE' + id);
          if (port2)
            context.userDeletePort(port2 as NodePortEditor);
          return true;
        }
      },
      onCreatePortCustomEditor: (port) => {
        if (port.guid.startsWith('KEY')) 
          return (props) => h('div', [ 
              h(StringEditor, {
                ...props,
                'onUpdate:value': (newV) => {
                  port.description = '键为 ' + newV + ' 的值';
                  port.define.description = port.description;
                  (props['onUpdate:value'] as any)(newV);
                }
              }) ,
              h('span', '键 = '),
            ]
          );
      },
    },
  };
  const blockCreateObject : INodeDefine = {
    guid: "B46A7D4E-3A89-D190-4D15-57A1D176FA8B", 
    name: "创建对象",
    description: '创建一个复合对象', 
    author: '', 
    category: '基础/对象',
    version: 1,
    userCanAddInputParam: true,
    ports: [
      {
        guid: 'IN',
        direction: 'input',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OUT',
        direction: 'output',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OUTOBJ',
        direction: 'output',
        paramType: NodeParamType.Object,
      },
    ],
    style: {
      titleState: 'hide',
      logoBackground: 'title:创建对象',
      minWidth: 200,
    },
    events: {
      onUserAddPort: async (node) => {
        const options = node.getOptions<IOtherDynamicPortNodeOptions>();
        options.portCount = options.portCount || 0;
        options.portCount++;
        return [
          {
            guid: 'KEY' + options.portCount,
            direction: 'input',
            paramType: NodeParamType.Any,
            name: '键' + options.portCount,
            description: '键' + options.portCount,
            forceEditorControlOutput: true,
          },
        ]
      },
      onCreatePortCustomEditor: (port) => {
        if (port.guid.startsWith('KEY')) 
          return (props) => h('div', [ 
              h(StringEditor, {
                ...props,
                'onUpdate:value': (newV) => {
                  port.description = '键为 ' + newV + ' 的值';
                  port.define.description = port.description;
                  (props['onUpdate:value'] as any)(newV);
                }
              }) ,
              h('span', '键 = '),
            ]
          );
      },
    },
  };
  const blockSetObject : INodeDefine = {
    guid: "42CCD2DC-8BA4-C6BC-82B6-A783C58F6804", 
    name: "设置对象属性", 
    description: '通过键值设置对象的属性', 
    author: '', 
    category: '基础/对象',
    version: 1,
    ports: [
      {
        guid: 'IN',
        direction: 'input',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OBJECT',
        direction: 'input',
        paramType: NodeParamType.Object,
        name: 'OBJECT',
        description: '要设置的对象',
      },
      {
        guid: 'KEY',
        direction: 'input',
        paramType: NodeParamType.String,
        name: 'KEY',
        description: '要设置的字段键值',
      },
      {
        guid: 'INVAL',
        direction: 'input',
        paramType: NodeParamType.Any,
        isFlexible: 'auto',
        name: 'VALUE',
        description: '要设置的值',
      },
      {
        guid: 'OUT',
        direction: 'output',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OUTVAL', 
        direction: 'output',
        description: '键值的字段',
        isFlexible: 'auto',
        name: 'VALUE',
        paramType: NodeParamType.Any,
      },
    ],
  };
  const blockObjectKeys : INodeDefine = {
    guid: "41A68F58-F8F6-DA97-65C4-0C5D89A6FA46", 
    name: "获取对象所有键值", 
    description: '', 
    author: '', 
    category: '基础/对象',
    version: 1,
    ports: [
      {
        guid: 'IN',
        direction: 'input',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OUT',
        direction: 'output',
        paramType: NodeParamType.Execute,
      },
      {
        guid: 'OBJECT',
        direction: 'input',
        paramType: NodeParamType.Object,
        name: 'OBJECT',
        description: '要获取键值的对象'
      },
      {
        guid: 'KEYS',
        direction: 'output',
        paramType: NodeParamType.FromString('array<string>'),
        name: 'KEYS',
        description: '对象的所有键值'
      },
    ],
  };

  return [blockAccessObject, blockCreateObject, blockSetObject, blockObjectKeys];
}