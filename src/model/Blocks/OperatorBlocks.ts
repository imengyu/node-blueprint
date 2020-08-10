import { BlockRegData, BlockParameterPortRegData, BlockPortRegData } from "../Define/BlockDef";
import { BlockParameterPort, BlockParameteType } from "../Define/Port";
import StringUtils from "../../utils/StringUtils";
import BlockServiceInstance from "../../sevices/BlockService";
import { Block } from "../Define/Block";

export default {
  register() {
    registerCalcBase();
    registerCalcScalar();
  }
}

function registerCalcBase() {

  let blockAddition = new BlockRegData("31CCFD61-0164-015A-04B1-732F0A7D6661", "加");
  let blockSubstract = new BlockRegData("1B0A8EDC-D8FE-C6D1-0DD6-803BC08562EB", "减");
  let blockMultiply = new BlockRegData("49984155-77D8-3C54-AEB1-24F4695C0609", "乘");
  let blockDivide = new BlockRegData("FFCA28BB-B182-0D05-5ECE-AF2F7B549B6B", "除");
  let blockModulo = new BlockRegData("ECD228AA-D88D-E02D-51FB-DAEE67ABA31C", "求余");

  let CalcBase_onCreate = (block) => {
    if(typeof block.options['opType'] == 'undefined') {
      block.options['opType'] = 'any';
    }else {
      //更换数据类型
      block.allPorts.forEach((port) => {
        if(port.type == 'Parameter') {
          block.changePortParamType(<BlockParameterPort>port, block.options['opType']);
        }
      });
    }
  };
  let CalcBase_onUserAddParam = (block, dirction) => {
    return {
      name: '参数' + (block.inputParameterCount + 1),
      guid: 'PI' + (block.inputParameterCount + 1),
      paramType: block.options['opType'],
      direction: dirction
    };
  };
  let CalcBase_onCreateCustomEditor = (parentEle, block : Block, regData) => {
    let el = document.createElement('div');
    let typeSelector = document.createElement('select');
    typeSelector.innerHTML = '<option value="number">number</option><option value="any">any</option>' + 
      (block.regData == blockAddition ? '<option value="string">string</option>' : '');
    typeSelector.value = block.options['opType'];
    typeSelector.onchange = () => {
      let newType : BlockParameteType;
      switch(typeSelector.value) {
        case 'string': newType = 'string'; break;
        case 'number': newType = 'number'; break;
        case 'bigint': newType = 'bigint'; break;
        case 'any': 
        default: newType = 'any'; break;
      }
      block.options['opType'] = newType;
      //更换数据类型
      block.allPorts.forEach((port) => {
        if(port.type == 'Parameter') {
          block.changePortParamType(<BlockParameterPort>port, newType);
        }
      });
    };
    el.innerText = '类型：';
    el.appendChild(typeSelector);
    parentEle.appendChild(el);
  };

  let CalcBase_cm_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'BI'
    },
    {
      direction: 'output',
      guid: 'BO'
    },
  ];
  let CalcBase_cm_parameters : Array<BlockParameterPortRegData> = [
    {
      name: "参数1",
      description: '',
      direction: 'input',
      guid: 'PI1',
      paramType: 'any'
    },
    {
      name: "参数2",
      description: '',
      direction: 'input',
      guid: 'PI2',
      paramType: 'any'
    },
    {
      name: "结果",
      description: '',
      direction: 'output',
      guid: 'PO1',
      paramType: 'any'
    },
  ];

  //#region 加

  blockAddition.baseInfo.author = 'imengyu';
  blockAddition.baseInfo.description = "相加单元，相加两个或多个参数";
  blockAddition.baseInfo.category = '运算';
  blockAddition.baseInfo.version = '2.0';
  blockAddition.baseInfo.logo = require('../../assets/images/BlockIcon/add.svg');
  blockAddition.ports = CalcBase_cm_ports;
  blockAddition.parameters = CalcBase_cm_parameters
  blockAddition.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockAddition.callbacks.onCreate = CalcBase_onCreate;
  blockAddition.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else rs += block.getInputParamValue(guid);
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockAddition.callbacks.onUserAddParam = CalcBase_onUserAddParam;
  blockAddition.callbacks.onCreateCustomEditor = CalcBase_onCreateCustomEditor;
  blockAddition.blockStyle.smallTitle = true;
  blockAddition.blockStyle.minWidth = '150px';

  //#endregion

  //#region 减

  blockSubstract.baseInfo.author = 'imengyu';
  blockSubstract.baseInfo.description = "相减单元，相减两个或多个参数";
  blockSubstract.baseInfo.category = '运算';
  blockSubstract.baseInfo.version = '2.0';
  blockSubstract.baseInfo.logo = require('../../assets/images/BlockIcon/sub.svg');
  blockSubstract.ports = CalcBase_cm_ports;
  blockSubstract.parameters = CalcBase_cm_parameters;
  blockSubstract.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockSubstract.callbacks.onCreate = CalcBase_onCreate;
  blockSubstract.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else rs -= block.getInputParamValue(guid);
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockSubstract.callbacks.onUserAddParam = CalcBase_onUserAddParam;
  blockSubstract.callbacks.onCreateCustomEditor = CalcBase_onCreateCustomEditor;
  blockSubstract.blockStyle.smallTitle = true;
  blockSubstract.blockStyle.minWidth = '150px';

  //#endregion

  //#region 乘

  blockMultiply.baseInfo.author = 'imengyu';
  blockMultiply.baseInfo.description = "相乘单元，相乘两个或多个参数";
  blockMultiply.baseInfo.category = '运算';
  blockMultiply.baseInfo.version = '2.0';
  blockMultiply.baseInfo.logo = require('../../assets/images/BlockIcon/multiply.svg');
  blockMultiply.ports = CalcBase_cm_ports;
  blockMultiply.parameters = CalcBase_cm_parameters;
  blockMultiply.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockMultiply.callbacks.onCreate = CalcBase_onCreate;
  blockMultiply.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else rs *= block.getInputParamValue(guid);
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockMultiply.callbacks.onUserAddParam = CalcBase_onUserAddParam;
  blockMultiply.callbacks.onCreateCustomEditor = CalcBase_onCreateCustomEditor;
  blockMultiply.blockStyle.smallTitle = true;
  blockMultiply.blockStyle.minWidth = '150px';

  //#endregion

  //#region 除

  blockDivide.baseInfo.author = 'imengyu';
  blockDivide.baseInfo.description = "相除单元，相除两个或多个参数";
  blockDivide.baseInfo.category = '运算';
  blockDivide.baseInfo.version = '2.0';
  blockDivide.baseInfo.logo = require('../../assets/images/BlockIcon/divide.svg');
  blockDivide.ports = CalcBase_cm_ports;
  blockDivide.parameters = CalcBase_cm_parameters;
  blockDivide.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockDivide.callbacks.onCreate = CalcBase_onCreate;
  blockDivide.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else rs /= block.getInputParamValue(guid);
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockDivide.callbacks.onUserAddParam = CalcBase_onUserAddParam;
  blockDivide.callbacks.onCreateCustomEditor = CalcBase_onCreateCustomEditor;
  blockDivide.blockStyle.smallTitle = true;
  blockDivide.blockStyle.minWidth = '150px';

  //#endregion

  //#region 求余

  blockModulo.baseInfo.author = 'imengyu';
  blockModulo.baseInfo.description = "求余单元，相减两个参数";
  blockModulo.baseInfo.category = '运算';
  blockModulo.baseInfo.version = '2.0';
  blockModulo.baseInfo.logo = require('../../assets/images/BlockIcon/modulo.svg');
  blockModulo.ports = CalcBase_cm_ports;
  blockModulo.parameters = CalcBase_cm_parameters;
  blockModulo.callbacks.onCreate = CalcBase_onCreate;
  blockModulo.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else rs -= block.getInputParamValue(guid);
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockModulo.callbacks.onUserAddParam = CalcBase_onUserAddParam;

  //#endregion


  BlockServiceInstance.registerBlock(blockAddition, false);
  BlockServiceInstance.registerBlock(blockSubstract, false);
  BlockServiceInstance.registerBlock(blockMultiply, false);
  BlockServiceInstance.registerBlock(blockDivide, false);
  BlockServiceInstance.registerBlock(blockModulo, false);
}

function registerCalcScalar() {

  let CalcScalar_onUserAddParam = (block, dirction) : BlockParameterPortRegData => {
    return {
      name: '参数' + (block.inputParameterCount + 1),
      guid: 'PI' + (block.inputParameterCount + 1),
      paramType: 'any',
      direction: dirction
    };
  };

  let CalcScalar_cm_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'BI'
    },
    {
      direction: 'output',
      guid: 'BO'
    },
  ];
  let CalcScalar_cm_parameters : Array<BlockParameterPortRegData> = [
    {
      name: "参数1",
      direction: 'input',
      guid: 'PI1',
      paramType: 'number'
    },
    {
      name: "参数2",
      direction: 'input',
      guid: 'PI2',
      paramType: 'number'
    },
    {
      name: "结果",
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ];

  let blockAbsolute = new BlockRegData("24CC6573-C39B-915C-5356-AAEB8EEF9CAF", '绝对值', '求一个数的绝对值');
  let blockExponentiate = new BlockRegData("3279E42C-0A2D-38B2-9B46-5E1BD444A817", '指数', '求一个数的n次方');
  let blockRoot = new BlockRegData("83AB5460-07E1-6F55-CE3E-841DD117D891", '开方', '开一个数的n次方');
  let blockRound = new BlockRegData("ACE2AF65-C644-9B68-C3E0-92484F60301A", '取整', '将一个数取整');
  let blockAverage = new BlockRegData("C71EB51A-A0D8-9C12-A5F2-0D3CAE3111FC", '平均值', '求一些数的平均值');
  let blockMaximum = new BlockRegData("62FCF10F-1891-9DD7-1C53-129F5F580E18", '最大值', '获取一些数中的最大值');
  let blockMinimum  = new BlockRegData("FA97A675-A872-0967-715D-57F0E0FFB75B", '最小值', '获取一些数中的最小值');

  //#region 最小值

  blockMinimum.baseInfo.category = '运算';
  blockMinimum.baseInfo.version = '2.0';
  blockMinimum.baseInfo.logo = require('../../assets/images/BlockIcon/min.svg');
  blockMinimum.ports = CalcScalar_cm_ports;
  blockMinimum.parameters = CalcScalar_cm_parameters;
  blockMinimum.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockMinimum.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else {
        let v : number = block.getInputParamValue(guid);
        if(v < rs) rs = v;
      }
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockMinimum.callbacks.onUserAddParam = CalcScalar_onUserAddParam;

  //#endregion

  //#region 最大值

  blockMaximum.baseInfo.category = '运算';
  blockMaximum.baseInfo.version = '2.0';
  blockMaximum.baseInfo.logo = require('../../assets/images/BlockIcon/max.svg');
  blockMaximum.ports = CalcScalar_cm_ports;
  blockMaximum.parameters = CalcScalar_cm_parameters;
  blockMaximum.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockMaximum.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    Object.keys(block.inputParameters).forEach(guid => {
      if(rs == null) rs = block.getInputParamValue(guid);
      else {
        let v : number = block.getInputParamValue(guid);
        if(v > rs) rs = v;
      }
    });
    block.setOutputParamValue('PO1', rs);
    block.activeOutputPort('BO');
  };
  blockMaximum.callbacks.onUserAddParam = CalcScalar_onUserAddParam;

  //#endregion
  
  //#region 平均值

  blockAverage.baseInfo.category = '运算';
  blockAverage.baseInfo.version = '2.0';
  blockAverage.baseInfo.logo = require('../../assets/images/BlockIcon/avg.svg');
  blockAverage.ports = CalcScalar_cm_ports;
  blockAverage.parameters = CalcScalar_cm_parameters;
  blockAverage.settings.parametersChangeSettings.userCanAddInputParameter = true;
  blockAverage.callbacks.onPortActive = (block, port) => { 
    let rs = null;
    let paramCount = 0;
    Object.keys(block.inputParameters).forEach(guid => {
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
  blockAverage.callbacks.onUserAddParam = CalcScalar_onUserAddParam;

  //#endregion

  //#region 取整

  blockRound.baseInfo.category = '运算';
  blockRound.baseInfo.version = '2.0';
  blockRound.baseInfo.logo = require('../../assets/images/BlockIcon/round.svg');
  blockRound.ports = CalcScalar_cm_ports;
  blockRound.parameters = [
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
  ];
  blockRound.callbacks.onCreate = (block) => {
    if(typeof block.options['opType'] == 'undefined')
      block.options['opType'] = 'any';
  };
  blockRound.callbacks.onPortActive = (block, port) => { 
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

  blockRoot.baseInfo.category = '运算';
  blockRoot.baseInfo.version = '2.0';
  blockRoot.baseInfo.logo = require('../../assets/images/BlockIcon/sqrt.svg');
  blockRoot.ports = CalcScalar_cm_ports;
  blockRoot.parameters = [
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
  ];
  blockRoot.callbacks.onPortActive = (block, port) => { 
    let x = block.getInputParamValue('PI1');
    let n = block.getInputParamValue('PI2');

    block.setOutputParamValue('PO1', Math.pow(x, 1 / n));
    block.activeOutputPort('BO');
  };

  //#endregion
  
  //#region 指数

  blockExponentiate.baseInfo.category = '运算';
  blockExponentiate.baseInfo.version = '2.0';
  blockExponentiate.baseInfo.logo = require('../../assets/images/BlockIcon/exp.svg');
  blockExponentiate.ports = CalcScalar_cm_ports;
  blockExponentiate.parameters = [
    {
      name: "x",
      description: '底数',
      direction: 'input',
      paramDefaultValue: 9,
      guid: 'PI1',
      paramType: 'number'
    },
    {
      name: "n",
      description: '指数',
      direction: 'input',
      paramDefaultValue: 2,
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
  ];
  blockExponentiate.callbacks.onPortActive = (block, port) => { 
    let x = block.getInputParamValue('PI1');
    let n = block.getInputParamValue('PI2');

    block.setOutputParamValue('PO1', Math.pow(x, n));
    block.activeOutputPort('BO');
  };

  //#endregion
    
  //#region 绝对值

  blockAbsolute.baseInfo.category = '运算';
  blockAbsolute.baseInfo.version = '2.0';
  blockAbsolute.baseInfo.logo = require('../../assets/images/BlockIcon/abs.svg');
  blockAbsolute.ports = CalcScalar_cm_ports;
  blockAbsolute.parameters = [
    {
      description: '需要取绝对值的数',
      direction: 'input',
      paramDefaultValue: 9,
      guid: 'PI1',
      paramType: 'number'
    },
    {
      description: '绝对值',
      direction: 'output',
      guid: 'PO1',
      paramType: 'number'
    },
  ];
  blockAbsolute.callbacks.onPortActive = (block, port) => { 
    let x = block.getInputParamValue('PI1');
    block.setOutputParamValue('PO1', Math.abs(x));
    block.activeOutputPort('BO');
  };

  //#endregion
      

  BlockServiceInstance.registerBlock(blockMaximum, false);
  BlockServiceInstance.registerBlock(blockMinimum, false);
  BlockServiceInstance.registerBlock(blockExponentiate, false);
  BlockServiceInstance.registerBlock(blockAbsolute, false);
  BlockServiceInstance.registerBlock(blockRoot, false);
  BlockServiceInstance.registerBlock(blockRound, false);
  BlockServiceInstance.registerBlock(blockAverage, false);
}