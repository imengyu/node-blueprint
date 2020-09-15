import BlockServiceInstance from "../../sevices/BlockService";
import { BlockRegData } from "../Define/BlockDef";

export default { 
  register,
}

function register() {
  
  let CreateArray = new BlockRegData("9C432A9B-25DD-49D1-C504-16B9A207C3EC", "创建数组", '创建一个数组', '', '数组');
  let EmptyArray = new BlockRegData("2B376B16-32E0-2D5E-080F-144586F6DC65", "清空数组", '清空数组所有项目', '', '数组');

  let ArrayGetItem = new BlockRegData("B19B4F6D-86DC-23C2-4430-8E5720E8927A", "获取", '获取数组指定索引的项目', '', '数组');
  let ArrayInsert = new BlockRegData("56F43FA6-3FFE-0421-37D3-BDC28174FC98", "插入", '将项目插入数组指定索引', '', '数组');
  let ArrayAdd = new BlockRegData("71BC8260-2BF4-6E58-70CC-6154518958A0", "添加", '将项目添加至数组末尾', '', '数组');
  let ArrayAddOnce = new BlockRegData("56942A7E-D747-1F59-7297-EBF1DDE8572E", "添加唯一", '将项目添加至数组，如果项目已经在数组中，则不会添加', '', '数组');

  let ArrayContains = new BlockRegData("55B1D5F5-CED3-0E91-70B4-BFCF71F1E5D6", "包含", '检查数组是否包含某个项目', '', '数组');
  let ArrayFind = new BlockRegData("AE91FCFC-1697-70F8-9304-6E39031EF284", "查找项目", '在数组中查找某个项目，返回它的第一个索引', '', '数组');
  let ArrayFindReverse = new BlockRegData("15BF61B9-F974-6700-7CD2-661F31842E96", "反向查找项目", '在数组中查找某个项目，返回它的最后一个索引', '', '数组');
  let ArrayIndexValid = new BlockRegData("C874AEB3-B16B-B10E-8D40-65186840D8D0", "为有效索引", '测试一个索引数字在数组中是否有效', '', '数组');
  
  let ArrayRemove = new BlockRegData("F0BC5166-7E22-1D90-AD2F-7E1C61DC498E", "移除项目", '移除数组中的一个项目', '', '数组');
  let ArrayRemoveIndex = new BlockRegData("169EA221-5EB0-B42E-83BD-3C9AA9C48E91", "按索引移除项目", '按索引移除数组中的一个项目', '', '数组');

  let ArrayLength = new BlockRegData("6DC6FBF7-A154-C666-B78B-06DE7DD96D02", "数组长度", '获取一个数组的长度', '', '数组');
  let ArrayContact = new BlockRegData("E9681FF2-A9C9-3E4F-2FBE-D77BB75A2E54", "数组合并", '合并两个数组', '', '数组');

  let ArrayForeach = new BlockRegData("284C7F0E-3105-9E59-06B8-9BF809519396", "For Each Loop", '遍历循环', '', '数组');

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
    },
    {
      guid: 'INDEX',
      paramType: 'number',
      direction: 'output',
      name: '当前索引',
    },
    
  ];
  ArrayForeach.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      var variables = block.variables();
      variables['breakActived'] = false;

      let INDEX = block.getPortByGUID('INDEX');
      let EXIT = block.getPortByGUID('EXIT');
      let LOOP = block.getPortByGUID('LOOP');

      let array = <Array<any>>block.getInputParamValue('ARRAY');
      let breakActived = variables['breakActived'];

      for(let i = 0, len = array.length; i < len; i++) {
          
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

  BlockServiceInstance.registerBlock(ArrayForeach, false);
}