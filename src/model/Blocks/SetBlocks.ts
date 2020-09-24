import BlockServiceInstance from "../../sevices/BlockService";
import CommonUtils from "../../utils/CommonUtils";
import { BlockRegData } from "../Define/BlockDef";
import { BlockPort } from "../Define/Port";

export default { 
  register,
}

function register() {

  //#region 创建集

  let CreateSet = new BlockRegData("C3A78FF7-7A0E-D3E7-2211-CEE67C9C330E", "创建集", '创建一个集。\n集是一种元素不重复的数据结构。', '', '集合')

  CreateSet.ports = [
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
      guid: 'SET',
      paramType: 'any',
      paramSetType: 'set',
      name: '集合',
      description: '创建的集合实例',
      portAnyFlexable: { flexable: true }
    }
  ];
  CreateSet.portAnyFlexables = {
    flexable: { setResultToData: 'opType' }
  }
  CreateSet.settings.parametersChangeSettings.userCanAddInputParameter = true;
  CreateSet.callbacks.onCreate = (block) => {
    if(!CommonUtils.isDefined(block.data['opType'])) block.data['opType'] = 'any';
  };
  CreateSet.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      let set = new Set<any>();

      Object.keys(block.inputPorts).forEach((key) => {
        let port = (<BlockPort>block.inputPorts[key]);
        if(!port.paramType.isExecute()) 
        set.add(block.getInputParamValue(port));
      });

      block.setOutputParamValue('SET', set);
      block.activeOutputPort('OUT');
    }
  };
  CreateSet.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 1 : block.inputPortCount;
    return {
      guid: 'IN' + block.data['portCount'],
      direction: 'input',
      name: '元素' + block.data['portCount'],
      paramType: block.data['opType'],
      portAnyFlexable: { flexable: true }
    }
  };

  //#endregion

  //#region 存在

  let SetHas = new BlockRegData("69A2F63E-7377-D5DB-52F1-2CBE47E03B04", "存在", '检查某个元素是否在集中存在', '', '集合')

  SetHas.ports = [
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
      description: '搜索项目的目标集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'any',
      description: '要检查的元素',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUTCONTAINS',
      paramType: 'boolean',
      description: '存在?',
    },
  ];
  SetHas.portAnyFlexables = {
    flexable: {}
  }
  SetHas.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTCONTAINS') {

      let set = <Set<any>>block.getInputParamValue('INSET', context);
      let item = block.getInputParamValue('INITEM', context);

      block.setOutputParamValue('OUTCONTAINS', set.has(item), context);
    }
  };
  SetHas.blockStyle.noTitle = true;
  SetHas.blockStyle.logoBackground = '<span class="big-title">集合中存在</span>';
  SetHas.blockStyle.minWidth = '150px';

  //#endregion

  //#region 添加

  let SetAdd = new BlockRegData("39EF0D42-8EE8-7FD9-34D0-A7C4FC487E02", "添加", '添加元素至集中', '', '集合')

  SetAdd.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'any',
      description: '要添加的元素',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  SetAdd.portAnyFlexables = {
    flexable: {}
  }
  SetAdd.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set = <Set<any>>block.getInputParamValue('INSET');
      let item = block.getInputParamValue('INITEM');

      set.add(item);
      block.activeOutputPort('OUT');
    }
  };
  SetAdd.blockStyle.noTitle = true;
  SetAdd.blockStyle.logoBackground = '<span class="big-title">集合添加元素</span>';
  SetAdd.blockStyle.minWidth = '170px';

  //#endregion
  
  //#region 移除

  let SetRemove = new BlockRegData("CBDC0AC7-402A-F91D-A4D4-7B30AA25B61D", "移除", '从集中移除元素', '', '集合')

  SetRemove.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'any',
      description: '要移除的元素',
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
      description: '如果有元素被移除，返回真（返回假说明元素不在集中）',
    },
  ];
  SetRemove.portAnyFlexables = {
    flexable: {}
  }
  SetRemove.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set = <Set<any>>block.getInputParamValue('INSET');
      let item = block.getInputParamValue('INITEM');

      block.setOutputParamValue('OUTRMED', set.delete(item));
      block.activeOutputPort('OUT');
    }
  };
  SetRemove.blockStyle.noTitle = true;
  SetRemove.blockStyle.logoBackground = '<span class="big-title">集合移除元素</span>';
  SetRemove.blockStyle.minWidth = '170px';

  //#endregion

  //#region 清空集合

  let SetClear = new BlockRegData("1AFC3FF1-D4F8-2190-F041-4277F9F0C6BE", "清空集合", '清空一个集合，移除所有元素', '', '集合')

  SetClear.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  SetClear.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      let set = <Set<any>>block.getInputParamValue('INSET');
      set.clear();
      block.activeOutputPort('OUT');
    }
  };
  SetClear.blockStyle.noTitle = true;
  SetClear.blockStyle.logoBackground = '<span class="big-title">清空集合</span>';
  SetClear.blockStyle.minWidth = '150px';

  //#endregion

  //#region 集合长度

  let SetLength = new BlockRegData("2FE1C73E-E14A-11EC-AEF5-107EB5BB9B43", "集合长度", '获取集合中元素的个数', '', '集合');
  SetLength.ports = [
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'array',
    },
    {
      direction: 'output',
      guid: 'OUTLEN',
      paramType: 'number',
      description: '集合中元素的个数',
    },
  ];
  SetLength.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTLEN') {
      let set = <Set<any>>block.getInputParamValue('INSET', context);
      block.setOutputParamValue('OUTLEN', set.size, context);
    }
  };
  SetLength.blockStyle.noTitle = true;
  SetLength.blockStyle.logoBackground = '<span class="big-title">集合长度</span>';
  SetLength.blockStyle.minWidth = '150px';

  //#endregion

  //#region 添加数组

  let SetAddArray = new BlockRegData("D0256F02-97D2-5514-5E21-48EB09297F51", "添加", '添加数组中的所有元素至集中', '', '集合')

  SetAddArray.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
      description: '搜索项目的目标集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      paramType: 'any',
      paramSetType: 'array',
      description: '要添加的元素数组',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  SetAddArray.portAnyFlexables = {
    flexable: {}
  }
  SetAddArray.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set = <Set<any>>block.getInputParamValue('INSET');
      let array = <Array<any>>block.getInputParamValue('INARRAY');

      array.forEach((item) => set.add(item))
      block.activeOutputPort('OUT');
    }
  };
  SetAddArray.blockStyle.noTitle = true;
  SetAddArray.blockStyle.logoBackground = '<span class="big-title">添加数组到集合</span>';
  SetAddArray.blockStyle.minWidth = '175px';

  //#endregion
  
  //#region 移除数组

  let SetRemoveArray = new BlockRegData("FC4B31C3-B8B1-FE7E-FEF7-2C32A33A4B15", "移除数组", '从集中移除数组中的元素', '', '集合')

  SetRemoveArray.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
      description: '搜索项目的目标集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INARRAY',
      paramType: 'any',
      paramSetType: 'array',
      description: '要移除的元素数组',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  SetRemoveArray.portAnyFlexables = {
    flexable: {}
  }
  SetRemoveArray.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set = <Set<any>>block.getInputParamValue('INSET');
      let array = <Array<any>>block.getInputParamValue('INARRAY');

      array.forEach((item) => {
        if(set.has(item)) set.delete(item)
      });
      block.activeOutputPort('OUT');
    }
  };
  SetRemoveArray.blockStyle.noTitle = true;
  SetRemoveArray.blockStyle.logoBackground = '<span class="big-title">从集合移除数组</span>';
  SetRemoveArray.blockStyle.minWidth = '175px';

  //#endregion

  //#region 联合

  let SetAddUnion = new BlockRegData("AEDAF3A2-C2E2-F851-B1ED-EE07AAFF43C7", "联合", '获取两个集合的并集（A+B），因为\n集的元素不可重复，因此两个集中相同的元素会被合并', '', '集合')

  SetAddUnion.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET1',
      paramType: 'any',
      paramSetType: 'set',
      description: '进行联合的一个集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INSET2',
      paramType: 'any',
      paramSetType: 'set',
      description: '进行联合的另一个集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTSET',
      paramType: 'any',
      paramSetType: 'set',
      portAnyFlexable: { flexable: true },
    },
  ];
  SetAddUnion.portAnyFlexables = {
    flexable: {}
  }
  SetAddUnion.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set1 = <Set<any>>block.getInputParamValue('INSET1');
      let set2 = <Set<any>>block.getInputParamValue('INSET2');
      let set3 = new Set<any>();

      set1.forEach((k, v) => set3.add(v));
      set2.forEach((k, v) => set3.add(v));

      block.setOutputParamValue('OUTSET', set3);
      block.activeOutputPort('OUT');
    }
  };
  SetAddUnion.blockStyle.noTitle = true;
  SetAddUnion.blockStyle.logoBackground = '<span class="big-title">联合</span>';
  SetAddUnion.blockStyle.minWidth = '175px';

  //#endregion
  
  //#region 交集

  let SetAddIntersection = new BlockRegData("9A6DCBC1-17D0-0965-E736-FA8A434BF489", "交集", '获取两个集合（A和B）的交集，即结果包含既在A中也在B中的元素', '', '集合')

  SetAddIntersection.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET1',
      paramType: 'any',
      paramSetType: 'set',
      description: '进行交叉的一个集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INSET2',
      paramType: 'any',
      paramSetType: 'set',
      description: '进行交叉的一个集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTSET',
      paramType: 'any',
      paramSetType: 'set',
      portAnyFlexable: { flexable: true },
    },
  ];
  SetAddIntersection.portAnyFlexables = {
    flexable: {}
  }
  SetAddIntersection.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set1 = <Set<any>>block.getInputParamValue('INSET1');
      let set2 = <Set<any>>block.getInputParamValue('INSET2');
      let set3 = new Set<any>();

      set1.forEach((k, v) => {
        if(set2.has(v))
          set3.add(v)
      });

      block.setOutputParamValue('OUTSET', set3);
      block.activeOutputPort('OUT');
    }
  };
  SetAddIntersection.blockStyle.noTitle = true;
  SetAddIntersection.blockStyle.logoBackground = '<span class="big-title">交集</span>';
  SetAddIntersection.blockStyle.minWidth = '175px';

  //#endregion
  
  //#region 差异

  let SetAddDifference = new BlockRegData("6B9298BB-AB17-1444-B545-D67FF74F86D9", "差异", '获取两个集合（A和B）的差异，即在A中存在但在B中不存在的所有元素。\n注意，开始集才会保留元素，开始集与比较集不能对调。', '', '集合')

  SetAddDifference.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET1',
      paramType: 'any',
      paramSetType: 'set',
      description: '开始集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'input',
      guid: 'INSET2',
      paramType: 'any',
      paramSetType: 'set',
      description: '比较集',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTSET',
      paramType: 'any',
      paramSetType: 'set',
      portAnyFlexable: { flexable: true },
    },
  ];
  SetAddDifference.portAnyFlexables = {
    flexable: {}
  }
  SetAddDifference.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let set1 = <Set<any>>block.getInputParamValue('INSET1');
      let set2 = <Set<any>>block.getInputParamValue('INSET2');
      let set3 = new Set<any>();

      set1.forEach((k, v) => {
        if(!set2.has(v))
          set3.add(v);
      });

      block.setOutputParamValue('OUTSET', set3);
      block.activeOutputPort('OUT');
    }
  };
  SetAddDifference.blockStyle.noTitle = true;
  SetAddDifference.blockStyle.logoBackground = '<span class="big-title">差异</span>';
  SetAddDifference.blockStyle.minWidth = '175px';

  //#endregion
  
  //#region 到数组

  let SetToArray = new BlockRegData("B5DAE865-44AD-6E03-5189-A6AC3373AC9E", "到数组", '将此集合拷贝到一个新数组', '', '集合')

  SetToArray.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },    
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
    {
      direction: 'output',
      guid: 'OUTARRAY',
      paramType: 'any',
      paramSetType: 'array',
      portAnyFlexable: { flexable: true },
    },
  ];
  SetToArray.portAnyFlexables = {
    flexable: {}
  }
  SetToArray.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      let set = <Set<any>>block.getInputParamValue('INSET');
      block.setOutputParamValue('OUTARRAY', Array.from(set));
      block.activeOutputPort('OUT');
    }
  };
  SetToArray.blockStyle.noTitle = true;
  SetToArray.blockStyle.logoBackground = '<span class="big-title">到数组</span>';
  SetToArray.blockStyle.minWidth = '150px';

  //#endregion
  
  //#region For Each Loop

  let SetForeach = new BlockRegData("37D2BF42-1EA8-4910-EF36-8E036E6C8C94", "For Each Loop (集合)", '遍历循环指定的集合', '', '集合');

  SetForeach.baseInfo.logo = require('../../assets/images/BlockIcon/loop.svg');
  SetForeach.ports = [
    {
      name: "进入",
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      name: "集",
      description: '要遍历的集合',
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'set',
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
  ];
  SetForeach.portAnyFlexables = {
    flexable: {}
  }
  SetForeach.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      var variables = block.variables();
      variables['breakActived'] = false;


      let EXIT = block.getPortByGUID('EXIT');
      let LOOP = block.getPortByGUID('LOOP');
      let ELEMENT = block.getPortByGUID('ELEMENT');

      let set = <Set<any>>block.getInputParamValue('SET');
      let breakActived = variables['breakActived'];
      let values = set.values();
      let value = values.next()
      while(!value.done) {

        block.setOutputParamValue(ELEMENT, value.value);
        block.activeOutputPort(LOOP);

        breakActived = variables['breakActived']; if(breakActived) break;
        value = values.next();
      }

      block.activeOutputPort(EXIT);

    }else if(port.guid == 'BREAK') {
      var variables = block.variables();
      variables['breakActived'] = true;
    }
  };

  //#endregion

  BlockServiceInstance.registerBlock(CreateSet, false);
  BlockServiceInstance.registerBlock(SetHas, false);
  BlockServiceInstance.registerBlock(SetAdd, false);
  BlockServiceInstance.registerBlock(SetRemove, false);
  BlockServiceInstance.registerBlock(SetClear, false);
  BlockServiceInstance.registerBlock(SetLength, false);
  BlockServiceInstance.registerBlock(SetAddArray, false);
  BlockServiceInstance.registerBlock(SetRemoveArray, false);
  BlockServiceInstance.registerBlock(SetAddUnion, false);
  BlockServiceInstance.registerBlock(SetAddIntersection, false);
  BlockServiceInstance.registerBlock(SetAddDifference, false);
  BlockServiceInstance.registerBlock(SetToArray, false);
  BlockServiceInstance.registerBlock(SetForeach, false);
}