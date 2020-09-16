import { BlockRegData, BlockPortRegData } from "../Define/BlockDef";
import { Block } from "../Define/Block";
import { BlockParameterBaseType, BlockParameterType, BlockPort } from "../Define/Port";
import BlockServiceInstance from "../../sevices/BlockService";
import CommonUtils from "../../utils/CommonUtils";
import { BlockEditor } from "../Editor/BlockEditor";
import HtmlUtils from "../../utils/HtmlUtils";

export default {
  register() {
    registerLogicBlocks();
  }
}

function registerLogicBlocks() {

  let And = new BlockRegData("F839DDA4-B666-74B6-E8B7-836D63708B65", "与", '逻辑与运算');
  let Or = new BlockRegData("29D1D2D3-47E1-2B67-C527-9E9274E6C582", "或", '逻辑或运算');
  let Not = new BlockRegData("E0D54F96-611E-C8AB-E347-5DEA1E9C227F", "非", '逻辑非运算');
  let ExclusiveOr = new BlockRegData("ED238520-58E6-AA7B-8787-26F2853D1248", "异或", '逻辑异或与运算');
  let Equal = new BlockRegData("B3D85366-FE65-1F1E-BAC8-F896668AD87C", "相等", '判断两个数是否相等');
  let NotEqual = new BlockRegData("6BE62EF6-A031-6D24-6720-99ABF1BBE5C1", "不相等", '判断两个数是否不相等');
  let Less = new BlockRegData("CFFCEB53-B68C-98AE-3363-455BDE728F88", "小于", '判断一个数是小于另一个数');
  let Greater = new BlockRegData("1FF0A894-C51E-F2ED-AEC8-9156ED490895", "大于", '判断一个数是大于另一个数');
  let LessOrEqual = new BlockRegData("57F7A1F6-51AE-6071-0926-5420877B9E20", "小于或等于", '判断一个数是小于或等于另一个数');
  let GreaterOrEqual = new BlockRegData("97DAB36F-B83F-9473-8B56-6FDB422E6D4F", "大于或等于", '判断一个数是大于或等于另一个数');
  let LeftMove = new BlockRegData("E9E8B9CD-3C86-081C-A46C-DE325062CD87", "左移", '按位左移');
  let RightMove = new BlockRegData("3B3AB761-33B9-3CC6-45B0-AE9F6B300458", "右移", '按位右移');

  let LogicBase_onCreate = (block : Block) => {
    if(typeof block.options['opType'] == 'undefined')
      block.options['opType'] = block.data['requireNumber'] ? 'number' : 'any';
    
    //更换数据类型
    block.allPorts.forEach((port) => {
      if(port.paramType.isExecute())
        block.changePortParamType(port, block.options['opType']);
    });
    
  };
  let LogicBase_onUserAddPort = (block : Block, dirction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'PI' + block.data['portCount'],
      paramType: type == 'execute' ? 'execute' : block.options['opType'],
      direction: dirction,
      portAnyFlexable: { flexable: true }
    };
  };
  let LogicBase_onPortConnectCheck = (block : BlockEditor, port : BlockPort, portSource : BlockPort) => {
    if(portSource.paramType.baseType == 'number' || portSource.paramType.baseType == 'boolean' || portSource.paramType.baseType == 'bigint')
      return null;
    return '与 ' + portSource.getTypeFriendlyString() + ' 不兼容，无法连接';
  };

  let LogicBase_portAnyFlexables = { flexable: { setResultToOptions: 'opType' } };

  let LogicBase_cm_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'PI0',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      description: '',
      direction: 'input',
      guid: 'PI1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      description: '',
      direction: 'output',
      guid: 'PO1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
  ];
  let LogicBase_compare_ports : Array<BlockPortRegData> = [
    {
      direction: 'input',
      guid: 'PI1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'input',
      guid: 'PI2',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'output',
      guid: 'PO',
      paramType: 'boolean'
    },
  ]

  //#region And

  And.baseInfo.author = 'imengyu';
  And.baseInfo.category = '逻辑';
  And.baseInfo.version = '2.0';
  And.baseInfo.logo = require('../../assets/images/BlockIcon/and.svg');
  And.settings.parametersChangeSettings.userCanAddInputParameter = true;
  And.blockStyle.noTitle = true;
  And.blockStyle.logoBackground = And.baseInfo.logo;
  And.ports = LogicBase_cm_ports;
  And.callbacks.onCreate = LogicBase_onCreate;
  And.callbacks.onUserAddPort = LogicBase_onUserAddPort;
  And.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  And.callbacks.onPortParamRequest = (block, port, context) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid, context);
      if(!CommonUtils.isDefinedAndNotNull(v))
        return;
      
      if(block.options['opType'] == 'boolean') {
        if(rs == null) rs = v
        else rs = rs && v;
      } else {
        if(rs == null) rs = v
        else rs = rs & v;
      }
      
    });

    if(rs != null) block.setOutputParamValue('PO1', rs, context);
  };
  And.portAnyFlexables = LogicBase_portAnyFlexables;

  //#endregion

  //#region Or

  Or.baseInfo.author = 'imengyu';
  Or.baseInfo.category = '逻辑';
  Or.baseInfo.version = '2.0';
  Or.baseInfo.logo = require('../../assets/images/BlockIcon/or.svg');
  Or.blockStyle.noTitle = true;
  Or.blockStyle.logoBackground = Or.baseInfo.logo;
  Or.settings.parametersChangeSettings.userCanAddInputParameter = true;
  Or.ports = LogicBase_cm_ports;
  Or.callbacks.onCreate =LogicBase_onCreate;
  Or.callbacks.onUserAddPort = LogicBase_onUserAddPort;
  Or.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  Or.callbacks.onPortParamRequest = (block, port, context) => { 
    let rs = null;
    Object.keys(block.inputPorts).forEach(guid => {
      let v = block.getInputParamValue(guid, context);
      if(!CommonUtils.isDefinedAndNotNull(v))
        return;
      
      if(block.options['opType'] == 'boolean') {
        if(rs == null) rs = v
        else rs = rs || v;
      } else {
        if(rs == null) rs = v
        else rs = rs | v;
      }
      
    });

    if(rs != null) block.setOutputParamValue('PO1', rs, context);
  };
  Or.portAnyFlexables = LogicBase_portAnyFlexables;

  //#endregion

  //#region Not

  Not.baseInfo.author = 'imengyu';
  Not.baseInfo.category = '逻辑';
  Not.baseInfo.version = '2.0';
  Not.baseInfo.logo = require('../../assets/images/BlockIcon/not.svg');
  Not.blockStyle.noTitle = true;
  Not.blockStyle.logoBackground = Not.baseInfo.logo;
  Not.blockStyle.minWidth = '111px';
  Not.blockStyle.minHeight = '50px';
  Not.portAnyFlexables = LogicBase_portAnyFlexables;
  Not.ports = [
    {
      direction: 'input',
      guid: 'PI1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      description: '',
      direction: 'output',
      guid: 'PO1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
  ];
  Not.callbacks.onCreate = LogicBase_onCreate;
  Not.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  Not.callbacks.onPortParamRequest = (block, port, context) => { 
    let v = block.getInputParamValue('PI1', context);    
    if(CommonUtils.isDefinedAndNotNull(v))
      block.setOutputParamValue('PO1', (block.options['opType'] == 'boolean' ? !v : ~v), context);
  };

  //#endregion

  //#region ExclusiveOr

  ExclusiveOr.baseInfo.author = 'imengyu';
  ExclusiveOr.baseInfo.category = '逻辑';
  ExclusiveOr.baseInfo.version = '2.0';
  ExclusiveOr.baseInfo.logo = require('../../assets/images/BlockIcon/xor.svg');
  ExclusiveOr.blockStyle.noTitle = true;
  ExclusiveOr.blockStyle.logoBackground = ExclusiveOr.baseInfo.logo;
  ExclusiveOr.blockStyle.minWidth = '111px';
  ExclusiveOr.portAnyFlexables = LogicBase_portAnyFlexables;
  ExclusiveOr.ports = [
    {
      direction: 'input',
      guid: 'PI1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'input',
      guid: 'PI2',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'output',
      guid: 'PO1',
      paramType: 'any',
      portAnyFlexable: { flexable: true }
    },
  ];
  ExclusiveOr.callbacks.onCreate = LogicBase_onCreate;
  ExclusiveOr.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  ExclusiveOr.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context);
    let v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO1', v1 ^ v2, context);
  };
  

  //#endregion


  //#region Equal

  Equal.baseInfo.author = 'imengyu';
  Equal.baseInfo.category = '逻辑';
  Equal.baseInfo.version = '2.0';
  Equal.baseInfo.logo = require('../../assets/images/BlockIcon/equal.svg');
  Equal.blockStyle.noTitle = true;
  Equal.blockStyle.logoBackground = Equal.baseInfo.logo;
  Equal.ports = LogicBase_compare_ports;
  Equal.portAnyFlexables = LogicBase_portAnyFlexables;
  Equal.callbacks.onCreate = LogicBase_onCreate;
  Equal.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 == v2, context);
  };

  //#endregion

  //#region NotEqual

  NotEqual.baseInfo.author = 'imengyu';
  NotEqual.baseInfo.category = '逻辑';
  NotEqual.baseInfo.version = '2.0';
  NotEqual.baseInfo.logo = require('../../assets/images/BlockIcon/not_equal.svg');
  NotEqual.blockStyle.noTitle = true;
  NotEqual.blockStyle.logoBackground = NotEqual.baseInfo.logo;
  NotEqual.portAnyFlexables = LogicBase_portAnyFlexables;
  NotEqual.ports = LogicBase_compare_ports;
  NotEqual.callbacks.onCreate = LogicBase_onCreate;
  NotEqual.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 != v2, context);
  };

  //#endregion

  //#region Less

  Less.baseInfo.author = 'imengyu';
  Less.baseInfo.category = '逻辑';
  Less.baseInfo.version = '2.0';
  Less.baseInfo.logo = require('../../assets/images/BlockIcon/less.svg');
  Less.blockStyle.noTitle = true;
  Less.blockStyle.logoBackground = Less.baseInfo.logo;
  Less.portAnyFlexables = LogicBase_portAnyFlexables;
  Less.ports = LogicBase_compare_ports;
  Less.callbacks.onCreate = LogicBase_onCreate;
  Less.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  Less.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 < v2, context);
  };

  //#endregion
  
  //#region Greater

  Greater.baseInfo.author = 'imengyu';
  Greater.baseInfo.category = '逻辑';
  Greater.baseInfo.version = '2.0';
  Greater.baseInfo.logo = require('../../assets/images/BlockIcon/greater.svg');
  Greater.blockStyle.noTitle = true;
  Greater.blockStyle.logoBackground = Greater.baseInfo.logo;
  Greater.portAnyFlexables = LogicBase_portAnyFlexables;
  Greater.ports = LogicBase_compare_ports;
  Greater.callbacks.onCreate = LogicBase_onCreate;
  Greater.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  Greater.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 > v2, context);
  };

  //#endregion
  
  //#region LessOrEqual

  LessOrEqual.baseInfo.author = 'imengyu';
  LessOrEqual.baseInfo.category = '逻辑';
  LessOrEqual.baseInfo.version = '2.0';
  LessOrEqual.baseInfo.logo = require('../../assets/images/BlockIcon/less_or_equal.svg');
  LessOrEqual.blockStyle.noTitle = true;
  LessOrEqual.blockStyle.logoBackground = LessOrEqual.baseInfo.logo;
  LessOrEqual.portAnyFlexables = LogicBase_portAnyFlexables;
  LessOrEqual.ports = LogicBase_compare_ports;
  LessOrEqual.callbacks.onCreate = LogicBase_onCreate;
  LessOrEqual.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  LessOrEqual.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 <= v2, context);
  };

  //#endregion

  //#region GreaterOrEqual

  GreaterOrEqual.baseInfo.author = 'imengyu';
  GreaterOrEqual.baseInfo.category = '逻辑';
  GreaterOrEqual.baseInfo.version = '2.0';
  GreaterOrEqual.baseInfo.logo = require('../../assets/images/BlockIcon/greater_or_equal.svg');
  GreaterOrEqual.blockStyle.noTitle = true;
  GreaterOrEqual.blockStyle.logoBackground = GreaterOrEqual.baseInfo.logo;
  GreaterOrEqual.portAnyFlexables = LogicBase_portAnyFlexables;
  GreaterOrEqual.ports = LogicBase_compare_ports;
  GreaterOrEqual.callbacks.onCreate = LogicBase_onCreate;
  GreaterOrEqual.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  GreaterOrEqual.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 >= v2, context);
  };

  //#endregion

  //#region LeftMove

  LeftMove.baseInfo.author = 'imengyu';
  LeftMove.baseInfo.category = '逻辑';
  LeftMove.baseInfo.version = '2.0';
  LeftMove.baseInfo.logo = require('../../assets/images/BlockIcon/left_move.svg');
  LeftMove.blockStyle.noTitle = true;
  LeftMove.blockStyle.logoBackground = LeftMove.baseInfo.logo;
  LeftMove.portAnyFlexables = LogicBase_portAnyFlexables;
  LeftMove.ports = LogicBase_compare_ports;
  LeftMove.callbacks.onCreate = LogicBase_onCreate;
  LeftMove.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  LeftMove.callbacks.onPortParamRequest = (block, port, context) => { 
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 << v2, context);
  };

  //#endregion

  //#region RightMove

  RightMove.baseInfo.author = 'imengyu';
  RightMove.baseInfo.category = '逻辑';
  RightMove.baseInfo.version = '2.0';
  RightMove.baseInfo.logo = require('../../assets/images/BlockIcon/right_move.svg');
  RightMove.blockStyle.noTitle = true;
  RightMove.blockStyle.logoBackground = RightMove.baseInfo.logo;
  RightMove.portAnyFlexables = LogicBase_portAnyFlexables;
  RightMove.ports = LogicBase_compare_ports;
  RightMove.callbacks.onCreate = LogicBase_onCreate;
  RightMove.callbacks.onPortConnectCheck = LogicBase_onPortConnectCheck;
  RightMove.callbacks.onPortParamRequest = (block, port, context) => {
    let v1 = block.getInputParamValue('PI1', context), v2 = block.getInputParamValue('PI2', context);    
    if(CommonUtils.isDefinedAndNotNull(v1) && CommonUtils.isDefinedAndNotNull(v2))
      block.setOutputParamValue('PO', v1 >> v2, context);
  };

  //#endregion

  BlockServiceInstance.registerBlock(And, false);
  BlockServiceInstance.registerBlock(Or, false);
  BlockServiceInstance.registerBlock(Not, false);
  BlockServiceInstance.registerBlock(ExclusiveOr, false);
  BlockServiceInstance.registerBlock(Equal, false);
  BlockServiceInstance.registerBlock(NotEqual, false);
  BlockServiceInstance.registerBlock(Less, false);
  BlockServiceInstance.registerBlock(Greater, false);
  BlockServiceInstance.registerBlock(LessOrEqual, false);
  BlockServiceInstance.registerBlock(GreaterOrEqual, false);
  BlockServiceInstance.registerBlock(LeftMove, false);
  BlockServiceInstance.registerBlock(RightMove, false);
}