import CommonUtils from "../../utils/CommonUtils";
import { BlockRegData } from "../Define/BlockDef";
import { BlockPort } from "../Define/Port";
import { ValMap } from "../Define/ValMap";

export default { 
  register,
  packageName: 'Dictionary',
  version: 1,
}

function register() {

  //#region 创建映射

  let CreateDictionary = new BlockRegData("17486C99-2A43-B144-AF7D-765D117A2716", "创建映射", '创建一个映射', '', '映射')

  CreateDictionary.ports = [
    {
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      direction: 'input',
      guid: 'INKEY0',
      paramType: 'any',
      name: '键0',
      portAnyFlexable: { flexableA: true }
    },
    {
      direction: 'input',
      guid: 'INVAL0',
      paramType: 'any',
      name: '值0',
      portAnyFlexable: { flexableB: true, }
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
      paramDictionaryKeyType: 'any',
      paramSetType: 'dictionary',
      name: '映射',
      description: '生成的映射对象',
      portAnyFlexable: { flexableB: { get: 'paramType', set: 'paramType' }, flexableA: { get: 'paramDictionaryKeyType', set: 'paramDictionaryKeyType' }, },
    }
  ];
  CreateDictionary.portAnyFlexables = {
    flexableA: { setResultToOptions: 'opTypeA' },
    flexableB: { setResultToOptions: 'opTypeB' },
  }
  CreateDictionary.settings.parametersChangeSettings.userCanAddInputParameter = true;
  CreateDictionary.callbacks.onCreate = (block) => {
    if(!CommonUtils.isDefined(block.options['opTypeA'])) block.options['opTypeA'] = 'any';
    if(!CommonUtils.isDefined(block.options['opTypeB'])) block.options['opTypeB'] = 'any';
  };
  CreateDictionary.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let INKEY0 = block.getPortByGUID('INKEY0');
      let INVAL0 = block.getPortByGUID('INVAL0');
      let map = new ValMap(INKEY0.paramType, INVAL0.paramType);

      if(!map.created()) {
        block.throwError('创建映射失败，因为 ' + INKEY0.paramType.getType() + ' 不可作为键值，键值类型必须含有 getHashCode 函数', INKEY0);
        return;
      }

      Object.keys(block.inputPorts).forEach((key) => {
        let port = (<BlockPort>block.inputPorts[key]);
        if(port.guid.startsWith('INKEY')) {
          let INVAL = block.inputPorts['INVAL' + port.guid.substring(5)];
          if(INVAL) {
            let k = block.getInputParamValue(port), v = block.getInputParamValue(INVAL);
            if(CommonUtils.isDefinedAndNotNull(k) && CommonUtils.isDefinedAndNotNull(v))
              map.set(k, v);
          }
        }
      });

      block.setOutputParamValue('OUTSET', map);
      block.activeOutputPort('OUT');
    }
  };
  CreateDictionary.callbacks.onUserAddPort = (block, direction, type) => {
    block.data['portCount'] = typeof block.data['portCount'] == 'number' ? block.data['portCount'] + 2 : 1;
    return [
      {
        guid: 'INKEY' + block.data['portCount'],
        direction: 'input',
        paramType: block.options['opTypeA'],
        name: '键' + block.data['portCount'],
        portAnyFlexable: { flexableA: true }
      },
      {
        guid: 'INVAL' + block.data['portCount'],
        direction: 'input',
        paramType: block.options['opTypeB'],
        name: '值' + block.data['portCount'],
        portAnyFlexable: { flexableB: true }
      },
    ]
  };
  CreateDictionary.callbacks.onPortRemove = (block, port) => {
    if(port.guid.startsWith('INKEY')) {
      let id = port.guid.substr(5);
      let port2 = block.getPortByGUID('INVAL' + id);
      if(port2)
        block.deletePort(port2);
    }else if(port.guid.startsWith('INVAL')) {
      let id = port.guid.substr(5);
      let port2 = block.getPortByGUID('INKEY' + id);
      if(port2)
        block.deletePort(port2);
    }
  };

  //#endregion

  //#region 存在

  let DictionaryHas = new BlockRegData("AAACBE43-B537-162D-A399-5FF58C841987", "存在", '检查某个元素是否在映射中存在', '', '映射')

  DictionaryHas.ports = [
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'dictionary',
      description: '搜索项目的目标映射',
      portAnyFlexable: { flexableA: { get: 'paramDictionaryKeyType', set: 'paramDictionaryKeyType' }, flexableB: { get: 'paramType', set: 'paramType' } },
    },
    {
      direction: 'input',
      guid: 'INKEY',
      paramType: 'any',
      description: '要检查的键值',
      portAnyFlexable: { flexableA: true },
    },
    {
      direction: 'output',
      guid: 'OUTCONTAINS',
      paramType: 'boolean',
      description: '指定元素是否存在?',
    },
  ];
  DictionaryHas.portAnyFlexables = {
    flexableA: {},
    flexableB: {},
  }
  DictionaryHas.blockStyle.noTitle = true;
  DictionaryHas.blockStyle.logoBackground = '<span class="big-title">映射中存在</span>';
  DictionaryHas.blockStyle.minWidth = '160px';
  DictionaryHas.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTCONTAINS') {

      let map = <ValMap>block.getInputParamValue('INSET', context);
      let key = block.getInputParamValue('INKEY', context);

      block.setOutputParamValue('OUTCONTAINS', map.has(key), context);
    }
  };

  //#endregion

  //#region 添加

  let DictionarySet = new BlockRegData("DF9B4BF1-8D43-1486-AE24-538B58DF9EF6", "设置", '设置映射中指定键的元素', '', '映射')

  DictionarySet.ports = [
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
      paramSetType: 'dictionary',
      portAnyFlexable: { flexableA: { get: 'paramDictionaryKeyType', set: 'paramDictionaryKeyType' }, flexableB: { get: 'paramType', set: 'paramType' }, },
    },
    {
      direction: 'input',
      guid: 'INKEY',
      paramType: 'any',
      description: '要设置的键',
      portAnyFlexable: { flexableA: true },
    },
    {
      direction: 'input',
      guid: 'INITEM',
      paramType: 'any',
      description: '要设置的元素',
      portAnyFlexable: { flexableB: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  DictionarySet.portAnyFlexables = {
    flexableA: {},
    flexableB: {},
  }
  DictionarySet.blockStyle.noTitle = true;
  DictionarySet.blockStyle.logoBackground = '<span class="big-title">设置映射元素</span>';
  DictionarySet.blockStyle.minWidth = '170px';
  DictionarySet.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let map = <ValMap>block.getInputParamValue('INSET');
      let key = block.getInputParamValue('INKEY');
      let item = block.getInputParamValue('INITEM');

      map.set(key, item);
      block.activeOutputPort('OUT');
    }
  };

  //#endregion
  
  //#region 移除

  let DictionaryRemove = new BlockRegData("7C0959BD-DAA6-6F9B-6D72-AA33AAD47646", "移除", '从映射中移除元素', '', '映射')

  DictionaryRemove.ports = [
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
      paramSetType: 'dictionary',
      portAnyFlexable: { flexable: { get: 'paramDictionaryKeyType', set: 'paramDictionaryKeyType' } },
    },
    {
      direction: 'input',
      guid: 'INKEY',
      paramType: 'any',
      description: '要移除的元素键',
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
      description: '如果有元素被移除，返回真（返回假说明映射中没有对应的键）',
    },
  ];
  DictionaryRemove.portAnyFlexables = {
    flexable: {},
  }
  DictionaryRemove.blockStyle.noTitle = true;
  DictionaryRemove.blockStyle.logoBackground = '<span class="big-title">映射移除元素</span>';
  DictionaryRemove.blockStyle.minWidth = '170px';
  DictionaryRemove.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {

      let map = <ValMap>block.getInputParamValue('INSET');
      let key = block.getInputParamValue('INKEY');

      block.setOutputParamValue('OUTRMED', map.delete(key));
      block.activeOutputPort('OUT');
    }
  };

  //#endregion

  //#region 清空映射

  let DictionaryClear = new BlockRegData("040EC273-89EC-B657-C76E-7FAA821ED459", "清空映射", '清空一个映射，移除所有元素', '', '映射')

  DictionaryClear.ports = [
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
      paramSetType: 'dictionary',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  DictionaryClear.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      let map = <ValMap>block.getInputParamValue('INSET');
      map.clear();
      block.activeOutputPort('OUT');
    }
  };
  DictionaryClear.portAnyFlexables = {
    flexable: {},
  }
  DictionaryClear.blockStyle.noTitle = true;
  DictionaryClear.blockStyle.logoBackground = '<span class="big-title">清空映射</span>';
  DictionaryClear.blockStyle.minWidth = '140px';

  //#endregion

  //#region 映射长度

  let DictionaryLength = new BlockRegData("04261532-8B7F-D8CE-837F-00B0E3787138", "映射长度", '获取映射中元素的个数', '', '映射');
  DictionaryLength.ports = [
    {
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'dictionary',
      portAnyFlexable: { flexable: true }
    },
    {
      direction: 'output',
      guid: 'OUTLEN',
      paramType: 'number',
      description: '映射中元素的个数',
    },
  ];
  DictionaryLength.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTLEN') {
      let map = <ValMap>block.getInputParamValue('INSET', context);
      block.setOutputParamValue('OUTLEN', map.map.size, context);
    }
  };
  DictionaryLength.portAnyFlexables = {
    flexable: {},
  }
  DictionaryLength.blockStyle.noTitle = true;
  DictionaryLength.blockStyle.logoBackground = '<span class="big-title">映射长度</span>';
  DictionaryLength.blockStyle.minWidth = '150px';

  //#endregion

  //#region 所有键

  let DictionaryAllKeys = new BlockRegData("BFC4636E-5182-F9B7-FABD-676A711D8FF9", "所有键", '获取映射中所有键为数组', '', '映射')

  DictionaryAllKeys.ports = [
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
      paramSetType: 'dictionary',
      description: '搜索项目的目标映射',
      portAnyFlexable: { flexable:  { get: 'paramDictionaryKeyType', set: 'paramDictionaryKeyType' } },
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
      description: '此映射的所有键',
      portAnyFlexable: { flexable: true },
    },
  ];
  DictionaryAllKeys.portAnyFlexables = {
    flexable: {},
  }
  DictionaryAllKeys.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      let map = <ValMap>block.getInputParamValue('INSET');
      block.setOutputParamValue('OUTARRAY', Array.from(map.map.keys()));
      block.activeOutputPort('OUT');
    }
  };
  DictionaryAllKeys.blockStyle.noTitle = true;
  DictionaryAllKeys.blockStyle.logoBackground = '<span class="big-title">映射所有键</span>';
  DictionaryAllKeys.blockStyle.minWidth = '170px';

  //#endregion
  
  //#region 所有值

  let DictionaryAllValues = new BlockRegData("716BBE19-DCA5-13CB-7679-A87FB52714FC", "所有值", '获取映射中所有值为数组', '', '映射')

  DictionaryAllValues.ports = [
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
      paramSetType: 'dictionary',
      description: '搜索项目的目标映射',
      portAnyFlexable: { flexable: { get: 'paramType', set: 'paramType' } },
    },
    {
      direction: 'input',
      guid: 'OUTARRAY',
      paramType: 'any',
      paramSetType: 'dictionary',
      description: '此映射的所有值数组',
      portAnyFlexable: { flexable: true },
    },
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'execute',
    },
  ];
  DictionaryAllValues.portAnyFlexables = {
    flexable: {},
  }
  DictionaryAllValues.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      let map = <ValMap>block.getInputParamValue('INSET');
      block.setOutputParamValue('OUTARRAY', Array.from(map.map.values()));
      block.activeOutputPort('OUT');
    }
  };
  DictionaryAllValues.blockStyle.noTitle = true;
  DictionaryAllValues.blockStyle.logoBackground = '<span class="big-title">映射所有值</span>';
  DictionaryAllValues.blockStyle.minWidth = '170px';

  //#endregion

  //#region For Each Loop

  let DictionaryForeach = new BlockRegData("9CE385D7-2396-E9D2-4F76-97F8CDB8DFE5", "For Each Loop (映射)", '遍历循环指定的映射', '', '映射');

  DictionaryForeach.baseInfo.logo = require('../../assets/images/BlockIcon/loop.svg');
  DictionaryForeach.ports = [
    {
      name: "进入",
      direction: 'input',
      guid: 'IN',
      defaultConnectPort: true,
      paramType: 'execute',
    },
    {
      name: "映射",
      description: '要遍历的映射',
      direction: 'input',
      guid: 'INSET',
      paramType: 'any',
      paramSetType: 'dictionary',
      portAnyFlexable: { flexableA: { get: 'paramDictionaryKeyType', set: 'paramDictionaryKeyType' }, flexableB: { get: 'paramType', set: 'paramType' } },
    },
    {
      name: "终止",
      description: '终止遍历循环',
      direction: 'input',
      guid: 'BREAK',
      paramType: 'execute',
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
      portAnyFlexable: { flexableB: true },
    },
    {
      guid: 'KEY',
      paramType: 'any',
      direction: 'output',
      name: '当前键值',
      portAnyFlexable: { flexableA: true },
    },
    {
      guid: 'EXIT',
      paramType: 'execute',
      direction: 'output',
      name: '循环结束'
    },
  ];
  DictionaryForeach.portAnyFlexables = {
    flexableA: {},
    flexableB: {},
  }
  DictionaryForeach.callbacks.onPortExecuteIn = (block, port) => {
    if(port.guid == 'IN') {
      var variables = block.variables();
      variables['breakActived'] = false;

      let KEY = block.getPortByGUID('KEY');
      let EXIT = block.getPortByGUID('EXIT');
      let LOOP = block.getPortByGUID('LOOP');
      let ELEMENT = block.getPortByGUID('ELEMENT');

      let map = <ValMap>block.getInputParamValue('SET');
      let breakActived = variables['breakActived'];
      let keys = map.map.keys();
      let key = keys.next()
      while(!key.done) {

        block.setOutputParamValue(ELEMENT, map.get(key.value));
        block.setOutputParamValue(KEY, key.value);
        block.activeOutputPort(LOOP);

        breakActived = variables['breakActived']; if(breakActived) break;

        key = keys.next();
      }

      block.activeOutputPort(EXIT);

    }else if(port.guid == 'BREAK') {
      var variables = block.variables();
      variables['breakActived'] = true;
    }
  };

  //#endregion

  return [
    CreateDictionary,
    DictionaryHas,
    DictionarySet,
    DictionaryRemove, 
    DictionaryClear,
    DictionaryLength,
    DictionaryAllKeys, 
    DictionaryAllValues, 
    DictionaryForeach, 
  ];
}