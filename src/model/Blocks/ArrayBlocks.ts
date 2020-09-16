import BlockServiceInstance from "../../sevices/BlockService";
import CommonUtils from "../../utils/CommonUtils";
import { BlockRegData } from "../Define/BlockDef";
import { BlockPort } from "../Define/Port";

export default { 
  register,
}

function register() {

  //#region 创建数组

  let CreateArray = new BlockRegData("9C432A9B-25DD-49D1-C504-16B9A207C3EC", "创建数组", '创建一个数组', '', '数组')
  CreateArray.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'IN0',
      paramType: 'any',
      name: '元素0',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'ARRAY',
      paramType: 'any',
      paramSetType: 'array',
      name: '数组',
      description: '创建的数组实例',
      portAnyFlexable: { flexable: true }
    }
  ];
  CreateArray.portAnyFlexables = {
    flexable: { setResultToData: 'opType' }
  };
  CreateArray.settings.parametersChangeSettings.userCanAddInputParameter = true;
  CreateArray.callbacks.onCreate = (block) => {
    if(!CommonUtils.isDefined(block.data['opType'])) block.data['opType'] = 'any';
  };
  CreateArray.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = new Array<any>();

      Object.keys(block.inputPorts).forEach((key) => {
        let port = (<BlockPort>block.inputPorts[key]);
        if(!port.paramType.isExecute()) 
          array.push(block.getInputParamValue(port));
      });

      block.setOutputParamValue('ARRAY', array);
      block.activeOutputPort('OUT');
    }
  };
  CreateArray.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'IN' + block.data['portCount'],
      direction: 'input',
      paramType: block.data['opType'],
      name: '元素' + block.data['portCount'],
      portAnyFlexable: { flexable: true }
    }
  };

  //#endregion

  //#region 清空数组

  let EmptyArray = new BlockRegData("2B376B16-32E0-2D5E-080F-144586F6DC65", "清空数组", '清空一个数组，移除所有元素', '', '数组');
  EmptyArray.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  EmptyArray.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      array.empty();
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 获取

  let ArrayGetItem = new BlockRegData("B19B4F6D-86DC-23C2-4430-8E5720E8927A", "获取", '获取数组指定索引的元素', '', '数组');
  ArrayGetItem.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'ININDEX',
      paramType: 'number',
      name: '索引',
      description: '要获取的索引位置，如果为负值，则索引从末尾开始',
    },
    {
      direction: 'input',
      guid: 'INISREF',
      paramType: 'boolean',
      name: '复制?',
      description: '如果复制为真，那么将会拷贝\n数组元素的一个副本，对此元素的更改不会在返回数组中。\n如果复制为假，那么对此元素的修改\n将会体现在数组中。',
    },
    {
      direction: 'output',
      guid: 'OUTITEM',
      paramType: 'any',
      name: '元素',
      portAnyFlexable: { flexable: true },
    },
  ];
  ArrayGetItem.portAnyFlexables = {
    flexable: {}
  };
  ArrayGetItem.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTITEM') {

      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      let index = <number>block.getInputParamValue('ININDEX', context);
      let ref = <boolean>block.getInputParamValue('INISREF', context);

      if(index < 0) index = array.length - 1;

      block.setOutputParamValue('OUTITEM', ref ? CommonUtils.clone(array[index]) : array[index], context);
    }
  };

  //#endregion

  //#region 插入

  let ArrayInsert = new BlockRegData("56F43FA6-3FFE-0421-37D3-BDC28174FC98", "插入", '将元素插入数组指定索引', '', '数组');
  ArrayInsert.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      name: '元素',
      description: '要插入的元素',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'ININDEX',
      name: '索引',
      description: '要插入的索引位置，如果为负值，则索引从末尾开始',
      paramType: 'number',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTARRLEN',
      paramType: 'number',
      name: '数组长度',
      description: '修改之后的数组长度',
    },
  ];
  ArrayInsert.portAnyFlexables = {
    flexable: {}
  };
  ArrayInsert.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let index = <number>block.getInputParamValue('ININDEX');
      let item = <number>block.getInputParamValue('INITEM');

      if(index < 0) index = array.length - 1;

      array.splice(index, 2, item);

      block.setOutputParamValue('OUTARRLEN', array.length);
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 添加

  let ArrayAdd = new BlockRegData("71BC8260-2BF4-6E58-70CC-6154518958A0", "添加", '将元素添加至数组末尾', '', '数组');
  ArrayAdd.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      name: '元素',
      description: '要插入的元素',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTARRLEN',
      paramType: 'number',
      name: '数组长度',
      description: '修改之后的数组长度',
    },
  ];
  ArrayAdd.portAnyFlexables = {
    flexable: {}
  };
  ArrayAdd.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let item = <number>block.getInputParamValue('INITEM');

      array.push(item);

      block.setOutputParamValue('OUTARRLEN', array.length);
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 添加唯一

  let ArrayAddOnce = new BlockRegData("56942A7E-D747-1F59-7297-EBF1DDE8572E", "添加唯一", '将元素添加至数组，如果元素已经在数组中，则不会添加', '', '数组');
  ArrayAddOnce.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      name: '元素',
      description: '要插入的元素',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTARRLEN',
      paramType: 'number',
      name: '数组长度',
      description: '修改之后的数组长度',
    },
  ];
  ArrayAddOnce.portAnyFlexables = {
    flexable: {}
  };
  ArrayAddOnce.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let item = <number>block.getInputParamValue('INITEM');

      array.addOnce(item);

      block.setOutputParamValue('OUTARRLEN', array.length);
      block.activeOutputPort('OUT');
    }
  }

  //#endregion

  //#region 包含

  let ArrayContains = new BlockRegData("55B1D5F5-CED3-0E91-70B4-BFCF71F1E5D6", "包含", '检查数组是否包含某个元素', '', '数组');
  ArrayContains.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'number',
      name: '元素',
      description: '要检查的元素',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUTCONTAINS',
      paramType: 'boolean',
      name: '包含?',
    },
  ];
  ArrayContains.portAnyFlexables = {
    flexable: {}
  };
  ArrayContains.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTCONTAINS') {

      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      let item = block.getInputParamValue('INITEM', context);

      block.setOutputParamValue('OUTCONTAINS', array.contains(item), context);
    }
  };

  //#endregion

  //#region 查找元素

  let ArrayFind = new BlockRegData("AE91FCFC-1697-70F8-9304-6E39031EF284", "查找元素", '在数组中查找某个元素，返回它的第一个索引', '', '数组');
  ArrayFind.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'number',
      name: '元素',
      description: '要检查的元素',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUTINDEX',
      paramType: 'boolean',
      name: '索引',
      description: '返回这个元素在此数组中的索引位置，如果没有找到，则返回-1',
    },
  ];
  ArrayFind.portAnyFlexables = {
    flexable: {}
  };
  ArrayFind.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTINDEX') {

      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      let item = block.getInputParamValue('INITEM', context);
      let index = array.indexOf(item);

      block.setOutputParamValue('OUTINDEX', index, context);
    }
  };

  //#endregion

  //#region 反向查找元素

  let ArrayFindReverse = new BlockRegData("15BF61B9-F974-6700-7CD2-661F31842E96", "反向查找元素", '在数组中查找某个元素，返回它的最后一个索引', '', '数组');
  ArrayFindReverse.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'number',
      name: '元素',
      description: '要检查的元素',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUTINDEX',
      paramType: 'boolean',
      name: '索引',
      description: '返回这个元素在此数组中的索引位置，如果没有找到，则返回-1',
    },
  ];
  ArrayFindReverse.portAnyFlexables = {
    flexable: {}
  };
  ArrayFindReverse.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTINDEX') {

      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      let item = block.getInputParamValue('INITEM', context);
      let index = array.lastIndexOf(item);

      block.setOutputParamValue('OUTINDEX', index, context);
    }
  };

  //#endregion

  //#region 为有效索引

  let ArrayIndexValid = new BlockRegData("C874AEB3-B16B-B10E-8D40-65186840D8D0", "为有效索引", '测试一个索引数字在数组中是否有效', '', '数组');
  ArrayIndexValid.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'input',
      guid: 'ININDEX',
      paramType: 'number',
      name: '索引',
      description: '想要测试有效的索引',
    },
    {
      direction: 'output',
      guid: 'OUTVALID',
      paramType: 'boolean',
      name: '是否有效',
    },
  ];
  ArrayIndexValid.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTVALID') {

      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      let index = block.getInputParamValue('ININDEX', context);

      block.setOutputParamValue('OUTVALID', index >= 0 && index < array.length, context);
    }
  };

  //#endregion

  //#region 最后一个索引

  let ArrayLastIndex = new BlockRegData("169EA221-5EB0-B42E-83BD-3C9AA9C48E91", "最后一个索引", '获取数组中的最后一个索引', '', '数组');
  ArrayLastIndex.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'output',
      guid: 'OUTVALIDINDEX',
      paramType: 'number',
      name: '索引',
      description: '数组的最后一个有效索引',
    },
  ];
  ArrayLastIndex.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTVALIDINDEX') {
      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      block.setOutputParamValue('OUTVALIDINDEX', array.length - 1, context);
    }
  };

  //#endregion

  //#region 移除元素

  let ArrayRemove = new BlockRegData("F0BC5166-7E22-1D90-AD2F-7E1C61DC498E", "移除元素", '移除数组中的一个元素', '', '数组');
  ArrayRemove.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',

    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      name: '元素',
      description: '要移除的元素',
      paramType: 'any',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTRMED',
      paramType: 'boolean',
      description: '如果元素不在数组中，返回假，如果在数组中并且被移除，返回真',
    },
  ];
  ArrayRemove.portAnyFlexables = {
    flexable: {}
  };
  ArrayRemove.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let item = <number>block.getInputParamValue('INITEM');

      block.setOutputParamValue('OUTRMED', array.remove(item));
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 按索引移除元素

  let ArrayRemoveIndex = new BlockRegData("BAF8135D-886B-4FD2-F683-06DAA67C5A0A", "按索引移除元素", '按索引移除数组中的一个元素', '', '数组');
  ArrayRemoveIndex.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'input',
      guid: 'ININDEX',
      name: '索引',
      description: '要移除的索引位置，如果为负值，则索引从末尾开始',
      paramType: 'number',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTARRLEN',
      paramType: 'boolean',
      description: '如果索引在数组中并且元素被移除，返回真',
    },
  ];
  ArrayRemoveIndex.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let index = <number>block.getInputParamValue('ININDEX');

      if(index < 0) index = array.length - 1;

      block.setOutputParamValue('OUTARRLEN', array.remove(index));
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 交换数组元素

  let ArraySwap = new BlockRegData("A087E766-18FD-F466-6EC2-A89A581E668F", "交换数组元素", '交换数组中的两个元素', '', '数组');
  ArraySwap.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'input',
      guid: 'ININDEX1',
      description: '一个待切换的索引位置，如果为负值，则索引从末尾开始',
      paramType: 'number',
    },
    {
      direction: 'input',
      guid: 'ININDEX2',
      description: '另一个待切换的索引位置，如果为负值，则索引从末尾开始',
      paramType: 'number',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  ArrayRemoveIndex.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let index2 = <number>block.getInputParamValue('ININDEX2');
      let index1 = <number>block.getInputParamValue('ININDEX1');
      CommonUtils.swapItems(array, index1, index2);
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 数组长度

  let ArrayLength = new BlockRegData("6DC6FBF7-A154-C666-B78B-06DE7DD96D02", "数组长度", '获取一个数组的长度', '', '数组');
  ArrayLength.ports = [
    {
      direction: 'input',
      guid: 'INARRAY',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'output',
      guid: 'OUTLEN',
      paramType: 'number',
      description: '数组的元素个数',
    },
  ];
  ArrayLength.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTLEN') {
      let array = <Array<any>>block.getInputParamValue('INARRAY', context);
      block.setOutputParamValue('OUTLEN', array.length, context);
    }
  };

  //#endregion

  //#region 重设长度

  let ArraySetLength = new BlockRegData("B0FD037C-0EE9-E104-8B60-CD1270F759E9", "重设长度", '重新设置一个数组的长度', '', '数组');
  ArraySetLength.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      name: '数组',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'input',
      guid: 'INSIZE',
      description: '数组的新长度',
      paramType: 'number',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  ArraySetLength.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let len = <number>block.getInputParamValue('INSIZE');
      array.length = len;
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 数组合并

  let ArrayContact = new BlockRegData("E9681FF2-A9C9-3E4F-2FBE-D77BB75A2E54", "数组合并", '合并两个数组', '', '数组');
  ArrayContact.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      paramType: 'any',
      paramSetType: 'array',
      description: '一个待合并的数组',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INARRAY2',
      paramType: 'any',
      paramSetType: 'array',
      description: '另一个待合并的数组',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'OUTARRAY',
      paramType: 'any',
      paramSetType: 'array',
      description: '返回合并后的数组',
    },
  ];
  ArrayContact.portAnyFlexables = {
    flexable: {}
  };
  ArrayContact.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let array = <Array<any>>block.getInputParamValue('INARRAY');
      let array2 = <Array<any>>block.getInputParamValue('INARRAY2');
      
      block.setOutputParamValue('OUTARRAY', array.concat(array2));
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region For Each Loop

  let ArrayForeach = new BlockRegData("284C7F0E-3105-9E59-06B8-9BF809519396", "For Each Loop（数组）", '遍历循环指定的数组', '', '数组');

  ArrayForeach.baseInfo.logo = require('../../assets/images/BlockIcon/loop.svg');
  ArrayForeach.ports = [
    {
      name: "进入",
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      name: "数组",
      description: '要遍历的数组',
      direction: 'input',
      guid: 'ARRAY',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
    {
      name: "终止",
      description: '终止遍历循环',
      direction: 'input',
      guid: 'BREAK',
      paramType: 'execute',
    },
    {
      guid: 'EXIT',
      paramType: 'execute',
      direction: 'output',
      name: '循环结束'
    },
    {
      guid: 'LOOPBODY',
      paramType: 'execute',
      direction: 'output',
      name: '循环体',
    },
    {
      guid: 'ELEMENT',
      paramType: 'number',
      direction: 'output',
      name: '当前元素',
      portAnyFlexable: { flexable: true },
    },
    {
      guid: 'INDEX',
      paramType: 'number',
      direction: 'output',
      name: '当前索引',
    },
    
  ];
  ArrayForeach.portAnyFlexables = {
    flexable: {}
  };
  ArrayForeach.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      var variables = block.variables();
      variables['breakActived'] = false;

      let INDEX = block.getPortByGUID('INDEX');
      let ELEMENT = block.getPortByGUID('ELEMENT');
      let EXIT = block.getPortByGUID('EXIT');
      let LOOP = block.getPortByGUID('LOOP');

      let array = <Array<any>>block.getInputParamValue('ARRAY');
      let breakActived = variables['breakActived'];

      for(let i = 0, len = array.length; i < len; i++) {
          
        block.setOutputParamValue(ELEMENT, array[i]);
        block.setOutputParamValue(INDEX, i);
        block.activeOutputPort(LOOP);

        breakActived = variables['breakActived']; if(breakActived) break;
      }

      block.activeOutputPort(EXIT);

    }else if(port.guid == 'BREAK') {
      var variables = block.variables();
      variables['breakActived'] = true;
    }
  };

  //#endregion

  BlockServiceInstance.registerBlock(CreateArray, false);
  BlockServiceInstance.registerBlock(EmptyArray, false);

  BlockServiceInstance.registerBlock(ArrayGetItem, false);
  BlockServiceInstance.registerBlock(ArrayInsert, false);
  BlockServiceInstance.registerBlock(ArrayAdd, false);
  BlockServiceInstance.registerBlock(ArrayAddOnce, false);

  BlockServiceInstance.registerBlock(ArrayContains, false);
  BlockServiceInstance.registerBlock(ArrayFind, false);
  BlockServiceInstance.registerBlock(ArrayFindReverse, false);
  BlockServiceInstance.registerBlock(ArrayIndexValid, false);
  BlockServiceInstance.registerBlock(ArrayLastIndex, false);
  BlockServiceInstance.registerBlock(ArrayRemove, false);
  BlockServiceInstance.registerBlock(ArrayRemoveIndex, false);
  
  BlockServiceInstance.registerBlock(ArraySwap, false);
  BlockServiceInstance.registerBlock(ArrayLength, false);
  BlockServiceInstance.registerBlock(ArrayContact, false);
  BlockServiceInstance.registerBlock(ArraySetLength, false);

  BlockServiceInstance.registerBlock(ArrayForeach, false);
}