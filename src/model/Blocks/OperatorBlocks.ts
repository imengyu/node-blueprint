import { BlockRegData, BlockPortRegData } from "../Define/BlockDef";
import { Block } from "../Define/Block";
import CommonUtils from "../../utils/CommonUtils";
import AllEditors from "../TypeEditors/AllEditors";
import StringUtils from "../../utils/StringUtils";
import { BlockPack } from "./Utils/BlockRegister";
import { BlockPort } from "../Define/Port";

export default {
  register() {
    return registerCalcBase().concat(
      registerCalcScalar()).concat(
      registerOperatorBase());
  },
  packageName: 'Operator',
  version: 1,
}

function registerCalcBase() {

  let blockAddition = new BlockRegData("31CCFD61-0164-015A-04B1-732F0A7D6661", "加", '相加单元，相加两个或多个参数', 'imengyu', '运算');
  let blockSubstract = new BlockRegData("1B0A8EDC-D8FE-C6D1-0DD6-803BC08562EB", "减", '相减单元，相减两个或多个参数', 'imengyu', '运算');
  let blockMultiply = new BlockRegData("49984155-77D8-3C54-AEB1-24F4695C0609", "乘", '相乘单元，相乘两个或多个参数', 'imengyu', '运算');
  let blockDivide = new BlockRegData("FFCA28BB-B182-0D05-5ECE-AF2F7B549B6B", "除", '相除单元，相除两个或多个参数', 'imengyu', '运算');

  let CalcBase_onCreate = (block : Block) => {
    if(typeof block.options['opType'] == 'undefined') {
      block.options['opType'] = 'any';
    }else {
      //更换数据类型
      block.allPorts.forEach((port) => {
        if(!port.paramType.isExecute())
          block.changePortParamType(port, block.options['opType']);
      });
    }
  };
  let CalcBase_onUserAddPort = (block : Block, dirction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'PI' + block.data['portCount'],
      paramType: type == 'execute' ? 'execute' : block.options['opType'],
      direction: dirction,
      portAnyFlexable: { flexable: true }
    };
  };
  let CalcBase_portAnyFlexables = { flexable: { setResultToOptions: 'opType' } };

  let CalcBase_cm_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'PI0',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
    {
      description: '',
      direction: 'input',
      guid: 'PI1',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
    {
      description: '',
      direction: 'output',
      guid: 'PO1',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
  ];

  //#region 加

  blockAddition.baseInfo.version = '2.0';
  blockAddition.baseInfo.logo = require('../../assets/images/BlockIcon/add.svg');
  blockAddition.ports = CalcBase_cm_ports;
  blockAddition.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockAddition.portAnyFlexables = CalcBase_portAnyFlexables;
  blockAddition.callbacks.onCreate = CalcBase_onCreate;
  blockAddition.callbacks.onPortParamRequest = (block, port, context) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid, context);
      if(typeof v != 'undefined')
        if(rs == null) rs = v
        else rs += v;
    });
    block.setOutputParamValue('PO1', rs, context);
  };
  blockAddition.callbacks.onUserAddPort = CalcBase_onUserAddPort;
  blockAddition.blockStyle.logoBackground = blockAddition.baseInfo.logo;
  blockAddition.blockStyle.noTitle = true;

  //#endregion

  //#region 减

  blockSubstract.baseInfo.version = '2.0';
  blockSubstract.baseInfo.logo = require('../../assets/images/BlockIcon/sub.svg');
  blockSubstract.ports = CalcBase_cm_ports;
  blockSubstract.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockSubstract.portAnyFlexables = CalcBase_portAnyFlexables;
  blockSubstract.callbacks.onCreate = CalcBase_onCreate;
  blockSubstract.callbacks.onPortParamRequest = (block, port, context) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid, context);
      if(typeof v != 'undefined')
        if(rs == null) rs = v;
        else rs -= v;
    });
    block.setOutputParamValue('PO1', rs, context);
  };
  blockSubstract.callbacks.onUserAddPort = CalcBase_onUserAddPort;
  blockSubstract.blockStyle.logoBackground = blockSubstract.baseInfo.logo;
  blockSubstract.blockStyle.noTitle = true;

  //#endregion

  //#region 乘

  blockMultiply.baseInfo.version = '2.0';
  blockMultiply.baseInfo.logo = require('../../assets/images/BlockIcon/multiply.svg');
  blockMultiply.ports = CalcBase_cm_ports;
  blockMultiply.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockDivide.portAnyFlexables = CalcBase_portAnyFlexables;
  blockMultiply.callbacks.onCreate = CalcBase_onCreate;
  blockMultiply.callbacks.onPortParamRequest = (block, port, context) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid, context);
      if(typeof v != 'undefined')
        if(rs == null) rs = v;
        else rs *= v;
    });
    block.setOutputParamValue('PO1', rs, context);
  };
  blockMultiply.callbacks.onUserAddPort = CalcBase_onUserAddPort;
  blockMultiply.blockStyle.logoBackground = blockMultiply.baseInfo.logo;
  blockMultiply.blockStyle.noTitle = true;

  //#endregion

  //#region 除

  blockDivide.baseInfo.version = '2.0';
  blockDivide.baseInfo.logo = require('../../assets/images/BlockIcon/divide.svg');
  blockDivide.ports = CalcBase_cm_ports;
  blockDivide.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockDivide.portAnyFlexables = CalcBase_portAnyFlexables;
  blockDivide.callbacks.onCreate = CalcBase_onCreate;
  blockDivide.callbacks.onPortParamRequest = (block, port, context) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid, context);
      if(typeof v != 'undefined')
        if(rs == null) rs = v;
        else rs /= v;
    });
    block.setOutputParamValue('PO1', rs, context);
  };
  blockDivide.callbacks.onUserAddPort = CalcBase_onUserAddPort;
  blockDivide.blockStyle.noTitle = true;
  blockDivide.blockStyle.logoBackground = blockDivide.baseInfo.logo;

  //#endregion

  return [
    blockAddition, 
    blockSubstract, 
    blockMultiply, 
    blockDivide, 
  ]
}

function registerCalcScalar() {

  let CalcScalar_onUserAddPort = (block, dirction, type) : BlockPortRegData => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'PI' + block.data['portCount'],
      paramType: type == 'execute' ? 'execute' : 'number',
      direction: dirction,
    };
  };

  let CalcScalar_cm_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'BI',
      paramType: 'execute'
    },
    {
      direction: 'output',
      guid: 'BO',
      paramType: 'execute'
    }
  ];
  let CalcScalar_cm_param_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'PI1',
      paramType: 'number'
    },
    {
      direction: 'input',
      guid: 'PI2',
      paramType: 'number'
    },
    {
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ];

  let blockAbsolute = new BlockRegData("24CC6573-C39B-915C-5356-AAEB8EEF9CAF", '绝对值', '求一个数的绝对值', '基础', '运算');
  let blockExponentiate = new BlockRegData("3279E42C-0A2D-38B2-9B46-5E1BD444A817", '指数', '求一个数的n次方', '基础', '运算');
  let blockRoot = new BlockRegData("83AB5460-07E1-6F55-CE3E-841DD117D891", '开方', '开一个数的n次方', '基础', '运算');
  let blockRound = new BlockRegData("ACE2AF65-C644-9B68-C3E0-92484F60301A", '取整', '将一个数取整', '基础', '运算');
  let blockAverage = new BlockRegData("C71EB51A-A0D8-9C12-A5F2-0D3CAE3111FC", '平均值', '求一些数的平均值', '基础', '运算');
  let blockMaximum = new BlockRegData("62FCF10F-1891-9DD7-1C53-129F5F580E18", '最大值', '获取一些数中的最大值', '基础', '运算');
  let blockMinimum  = new BlockRegData("FA97A675-A872-0967-715D-57F0E0FFB75B", '最小值', '获取一些数中的最小值', '基础', '运算');
  let blockModulo = new BlockRegData("ECD228AA-D88D-E02D-51FB-DAEE67ABA31C", "求余", '求余单元，对两个参数求余', '基础', '运算');

  //#region 最小值

  blockMinimum.baseInfo.category = '运算';
  blockMinimum.baseInfo.version = '2.0';
  blockMinimum.baseInfo.logo = require('../../assets/images/BlockIcon/min.svg');
  blockMinimum.ports = CalcScalar_cm_ports.concat(CalcScalar_cm_param_ports);
  blockMinimum.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockMinimum.callbacks.onPortExecuteIn = (block, port) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid);
      if(typeof v != 'undefined')
        if(rs == null) rs = v;
        else {
          let vn : number = v;
          if(vn < rs) rs = v;
        }
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockMinimum.callbacks.onUserAddPort = CalcScalar_onUserAddPort;

  //#endregion

  //#region 最大值

  blockMaximum.baseInfo.version = '2.0';
  blockMaximum.baseInfo.logo = require('../../assets/images/BlockIcon/max.svg');
  blockMaximum.ports = CalcScalar_cm_ports.concat(CalcScalar_cm_param_ports);
  blockMaximum.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockMaximum.callbacks.onPortExecuteIn = (block, port) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid);
      if(typeof v != 'undefined')
        if(rs == null) rs = v;
        else {
          let vn : number = v;
          if(vn > rs) rs = v;
        }
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockMaximum.callbacks.onUserAddPort = CalcScalar_onUserAddPort;

  //#endregion
  
  //#region 平均值

  blockAverage.baseInfo.version = '2.0';
  blockAverage.baseInfo.logo = require('../../assets/images/BlockIcon/avg.svg');
  blockAverage.ports = CalcScalar_cm_ports.concat(CalcScalar_cm_param_ports);
  blockAverage.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockAverage.callbacks.onPortExecuteIn = (block, port) => { 
    let rs = null;
    let paramCount = 0;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid);
      if(v != null && typeof v == 'number') {
        if(rs == null) rs = v;
        else rs += v;
        paramCount++;
      }
    });
    block.setOutputParamValue('PO1', rs / paramCount);
    block.activeOutputPort('BO');
  };
  blockAverage.callbacks.onUserAddPort = CalcScalar_onUserAddPort;

  //#endregion

  //#region 取整

  blockRound.baseInfo.version = '2.0';
  blockRound.baseInfo.logo = require('../../assets/images/BlockIcon/round.svg');
  blockRound.ports = CalcScalar_cm_ports.concat([
    {
      direction: 'input',
      guid: 'PI1',
      paramType: 'number'
    },
    {
      name: "结果",
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ]);
  blockRound.callbacks.onCreate = (block) => {
    if(typeof block.options['opType'] == 'undefined')
      block.options['opType'] = 'floor';
  };
  blockRound.callbacks.onPortExecuteIn = (block, port) => { 
    let rs = block.getInputParamValue('PI1');

    switch(block.options['opType']) {
      case 'floor': rs = Math.floor(rs); break;
      case 'ceil': rs = Math.ceil(rs); break;
      case 'round': rs = Math.round(rs); break;
    }

    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockRound.callbacks.onCreateCustomEditor = (parentEle, block : Block, regData) => {
    let el = document.createElement('div');
    let typeSelector = document.createElement('select');
    typeSelector.innerHTML = '<option value="floor">向上取整</option><option value="ceil">向下取整</option><option value="round">四舍五入</option>';
    typeSelector.value = block.options['opType'];
    typeSelector.onchange = () => block.options['opType'] = typeSelector.value;
    el.appendChild(typeSelector);
    parentEle.appendChild(el);
  };

  //#endregion
  
  //#region 开方

  blockRoot.baseInfo.version = '2.0';
  blockRoot.baseInfo.logo = require('../../assets/images/BlockIcon/sqrt.svg');
  blockRoot.ports = CalcScalar_cm_ports.concat([
    {
      name: "x",
      description: '被开方数',
      direction: 'input',
      paramDefaultValue: 9,
      guid: 'PI1',
      paramType: 'number'
    },
    {
      name: "n",
      description: '开方次数',
      direction: 'input',
      paramDefaultValue: 2,
      guid: 'PI2',
      paramType: 'number'
    },
    {
      name: "ⁿ√x",
      description: 'x的n次根',
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ]);
  blockRoot.callbacks.onPortExecuteIn = (block, port) => { 
    let x = block.getInputParamValue('PI1');
    let n = block.getInputParamValue('PI2');

    block.setOutputParamValue('PO1', Math.pow(x, 1 / n));
    block.activeOutputPort('BO');
  };

  //#endregion
  
  //#region 指数

  blockExponentiate.baseInfo.version = '2.0';
  blockExponentiate.baseInfo.logo = require('../../assets/images/BlockIcon/exp.svg');
  blockExponentiate.ports = CalcScalar_cm_ports.concat([
    {
      name: "x",
      description: '底数',
      direction: 'input',
      paramDefaultValue: 2,
      guid: 'PI1',
      paramType: 'number'
    },
    {
      name: "n",
      description: '指数',
      direction: 'input',
      paramDefaultValue: 3,
      guid: 'PI2',
      paramType: 'number'
    },
    {
      name: "xⁿ",
      description: 'x的n次方',
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ]);
  blockExponentiate.callbacks.onPortExecuteIn = (block, port) => { 
    let x = block.getInputParamValue('PI1');
    let n = block.getInputParamValue('PI2');

    block.setOutputParamValue('PO1', Math.pow(x, n));
    block.activeOutputPort('BO');
  };

  //#endregion
    
  //#region 绝对值

  blockAbsolute.baseInfo.version = '2.0';
  blockAbsolute.baseInfo.logo = require('../../assets/images/BlockIcon/abs.svg');
  blockAbsolute.ports = CalcScalar_cm_ports.concat([
    {
      description: '需要取绝对值的数',
      direction: 'input',
      paramDefaultValue: 0,
      guid: 'PI1',
      paramType: 'number'
    },
    {
      description: '绝对值',
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ]);
  blockAbsolute.callbacks.onPortExecuteIn = (block, port) => { 
    let x = block.getInputParamValue('PI1');
    block.setOutputParamValue('PO1', Math.abs(x));
    block.activeOutputPort('BO');
  };

  //#endregion
      
  //#region 求余

  blockModulo.baseInfo.version = '2.0';
  blockModulo.baseInfo.logo = require('../../assets/images/BlockIcon/modulo.svg');
  blockModulo.ports = CalcScalar_cm_ports.concat(CalcScalar_cm_param_ports);
  blockModulo.callbacks.onPortExecuteIn = (block, port) => { 
    let v1 = block.getInputParamValue('PI1') , v2 = block.getInputParamValue('PI2');
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO1', v1 % v2);
    block.activeOutputPort('BO');
  };

  //#endregion

  return [   
    blockModulo, 
    blockMaximum, 
    blockMinimum, 
    blockExponentiate, 
    blockAbsolute, 
    blockRoot, 
    blockRound, 
    blockAverage, 
  ];
}

function registerOperatorBase() {

  let blockAccessObject = new BlockRegData("CDC97AAC-1E4F-3C65-94D8-1566A246D0A2", "访问对象属性", '通过键值访问对象的属性', '', '基础/对象');
  let blockCreateObject = new BlockRegData("B46A7D4E-3A89-D190-4D15-57A1D176FA8B", "创建对象", '创建一个复合对象', '', '基础/对象');
  let blockSetObject = new BlockRegData("42CCD2DC-8BA4-C6BC-82B6-A783C58F6804", "设置对象属性", '通过键值设置对象的属性', '', '基础/对象');
  let blockObjectKeys = new BlockRegData("41A68F58-F8F6-DA97-65C4-0C5D89A6FA46", "获取对象所有键值", '', '', '基础/对象');

  //#region 通过键值访问对象的属性

  blockAccessObject.baseInfo.version = '2.0';
  blockAccessObject.ports = [
    {
      guid: 'IN',
      direction: 'input',
      paramType: 'execute'
    },
    {
      guid: 'OBJECT',
      direction: 'input',
      paramType: 'object',
      description: '要访问的对象',
    },
    {
      guid: 'KEY0',
      direction: 'input',
      paramType: 'string',
      description: '要访问的字段键值0',
    },
    {
      guid: 'OUT',
      direction: 'output',
      paramType: 'execute'
    },
    {
      guid: 'VALUE0', 
      direction: 'output',
      description: '键值0的字段',
      paramType: 'any'
    },
  ]
  blockAccessObject.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockAccessObject.blockStyle.noTitle = true;
  blockAccessObject.blockStyle.logoBackground = 'title:通过键值访问对象的属性';
  blockAccessObject.blockStyle.minWidth = '170px';
  blockAccessObject.callbacks.onPortExecuteIn = (block, port) => {
    Object.keys(block.inputPorts).forEach((key) => {
      let port = block.inputPorts[key];
      let id = port.guid.substr(3);

      if(port.guid.startsWith('KEY'))
        block.setOutputParamValue('VALUE' + id, block.getInputParamValue('OBJECT')[block.getInputParamValue('KEY' + id)])
    });
   
    block.activeOutputPort('OUT');
  };
  blockAccessObject.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 2 : 1;
    return [
      {
        guid: 'KEY' + block.data['portCount'],
        direction: 'input',
        paramType: 'string',
        description: '要访问的字段键值' + block.data['portCount'],
      },
      {
        guid: 'VALUE' + block.data['portCount'],
        direction: 'output',
        paramType: 'any',
        name: '键值' + block.data['portCount'] + '的字段',
      },
    ];
  };
  blockAccessObject.callbacks.onPortRemove = (block, port) => {
    if(port.guid.startsWith('KEY')) {
      let id = port.guid.substr(3);
      let port2 = block.getPortByGUID('VALUE' + id);
      if(port2)
        block.deletePort(port2);
    }else if(port.guid.startsWith('VALUE')) {
      let id = port.guid.substr(5);
      let port2 = block.getPortByGUID('KEY' + id);
      if(port2)
        block.deletePort(port2);
    }
  };

  //#endregion

  //#region 通过键值设置对象的属性

  blockSetObject.baseInfo.version = '2.0';
  blockSetObject.blockStyle.noTitle = true;
  blockSetObject.blockStyle.logoBackground = 'title:通过键值设置对象的属性';
  blockSetObject.blockStyle.minWidth = '170px';
  blockSetObject.ports = [
    {
      guid: 'IN',
      direction: 'input',
      paramType: 'execute'
    },
    {
      guid: 'OBJECT',
      direction: 'input',
      paramType: 'object',
      description: '要设置的对象',
    },
    {
      guid: 'KEY',
      direction: 'input',
      paramType: 'string',
      description: '要设置的字段键值',
    },
    {
      guid: 'INVAL',
      direction: 'input',
      paramType: 'any',
      description: '要设置的值',
    },
    {
      guid: 'OUT',
      direction: 'output',
      paramType: 'execute'
    },
    {
      guid: 'OUTVAL', 
      direction: 'output',
      description: '键值的字段',
      paramType: 'any'
    },
  ]
  blockSetObject.callbacks.onPortExecuteIn = (block, port) => {
    let val = block.getInputParamValue('INVAL');

    block.getInputParamValue('OBJECT')[block.getInputParamValue('KEY')] = val;
    block.setOutputParamValue('OUTVAL', val);
    block.activeOutputPort('OUT');
  };

  //#endregion

  //#region 创建对象

  blockCreateObject.baseInfo.version = '2.0';
  blockCreateObject.ports = [
    {
      guid: 'IN',
      direction: 'input',
      paramType: 'execute'
    },
    {
      guid: 'OUT',
      direction: 'output',
      paramType: 'execute'
    },
    {
      guid: 'OUTOBJ',
      direction: 'output',
      paramType: 'object'
    },
  ];
  blockCreateObject.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockCreateObject.blockStyle.noTitle = true;
  blockCreateObject.blockStyle.logoBackground = 'title:创建对象';
  blockCreateObject.blockStyle.minWidth = '160px';
  blockCreateObject.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 2 : 1;
    return [
      {
        guid: 'KEY' + block.data['portCount'],
        direction: 'input',
        paramType: 'any',
        description: '键' + block.data['portCount'],
      },
    ];
  };
  blockCreateObject.callbacks.onCreatePortCustomEditor = (parentEle, block, port) => { 
    let el = document.createElement('div');
    let input = AllEditors.getBaseEditors('string').editorCreate(block, port, parentEle, (newV) => {
      port.options['key'] = newV;
      port.description = '键为 ' + StringUtils.valueToStr(newV) +  ' 的值';
      port.regData.description = port.description;
      block.updatePort(port);
      return newV;
    }, port.options['key'], null, null);

    el.style.display = 'inline-block';
    el.innerText = '键 = ';
    el.appendChild(input);
    return el;
  };
  blockCreateObject.callbacks.onPortExecuteIn = (block, port) => {
    let object = new Object();
    Object.keys(block.inputPorts).forEach((key) => {
      let port = <BlockPort>block.inputPorts[key];
      if(!CommonUtils.isNullOrEmpty(port.options['key']))
        object[port.options['key']] = port.rquestInputValue(block.currentRunningContext);
    });
    block.setOutputParamValue('VALUE', object);
    block.activeOutputPort('OUTOBJ');
  };

  //#endregion

  //#region 获取对象所有键值

  blockObjectKeys.blockStyle.noTitle = true;
  blockObjectKeys.blockStyle.logoBackground = 'title:获取对象所有键值';
  blockObjectKeys.blockStyle.minWidth = '170px';
  blockObjectKeys.ports = [
    {
      guid: 'IN',
      direction: 'input',
      paramType: 'execute'
    },
    {
      guid: 'OUT',
      direction: 'output',
      paramType: 'execute'
    },
    {
      guid: 'OBJECT',
      direction: 'input',
      paramType: 'object',
      description: '要获取键值的对象'
    },
    {
      guid: 'KEYS',
      direction: 'output',
      paramType: 'string',
      paramSetType: 'array',
      description: '对象的所有键值'
    },
  ];
  blockObjectKeys.callbacks.onPortExecuteIn = (block, port) => {
    block.setOutputParamValue('KEYS', Object.keys(block.getInputParamValue('OBJECT')));
    block.activeOutputPort('OUT');
  };

  //#endregion

  return [
    blockAccessObject,
    blockSetObject,
    blockCreateObject,
  ];
}