import type { INodeDefine, NodeEventCallback } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodePackage } from "@/node-blueprint/Base/Flow/Registry/NodePackage";
import type { INodePortDefine } from "@/node-blueprint/Base/Flow/Node/NodePort";
import { NodeParamType } from "@/node-blueprint/Base/Flow/Type/NodeParamType";

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
import type { NodePortEditor } from "@/node-blueprint/Editor/Graph/Flow/NodePortEditor";
import StringEditor from "@/node-blueprint/Editor/Graph/TypeEditor/StringEditor.vue";
import { h } from "vue";

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
  const CalcBaseOnCreate : NodeEventCallback<void, undefined> = (node) => {
    const options = node.getOptions<ICalcScalarOptions>();
    if (typeof options.opType === 'undefined') {
      options.opType = 'any';
    } else {
      //更换数据类型
      node.ports.forEach((port) => {
        if (!port.paramType.isExecute)
          node.changePortParamType(port, NodeParamType.FromString(options.opType));
      });
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
    },
    events: {
      onCreate: CalcBaseOnCreate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
    userCanAddOutputParam: true,
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
    },
    events: {
      onCreate: CalcBaseOnCreate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
    userCanAddOutputParam: true,
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
    },
    events: {
      onCreate: CalcBaseOnCreate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
    userCanAddOutputParam: true,
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
    },
    events: {
      onCreate: CalcBaseOnCreate,
    },
    ports: CalcBaseCommonPorts,
    userCanAddInputParam: true,
    userCanAddOutputParam: true,
  };

  return [blockAddition, blockSubstract, blockMultiply, blockDivide];
}

function registerCalcScalar() {
  return []
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
      },
    ],
    events: {
      onUserAddPort: async (node) => {
        const options = node.getOptions<IOtherDynamicPortNodeOptions>();
        options.portCount = options.portCount || 0;
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
          },
        ]
      },
      onUserDeletePort: async (node, context, port) => {
        if (!port)
          return undefined;
        const options = node.getOptions<IOtherDynamicPortNodeOptions>();
        options.portCount--;
        if (port.guid.startsWith('KEY')) {
          const id = port.guid.substr(3);
          const port2 = node.getPortByGUID('VALUE' + id);
          if (port2)
            context.userDeletePort(port2 as NodePortEditor);
        } else if (port.guid.startsWith('VALUE')) {
          const id = port.guid.substr(5);
          const port2 = node.getPortByGUID('KEY' + id);
          if (port2)
            context.userDeletePort(port2 as NodePortEditor);
        }
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