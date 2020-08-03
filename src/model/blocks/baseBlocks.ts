import BlockServiceInstance from "../../sevices/BlockService";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { BlockParameterEnumRegData, BlockRegData } from "../BlockDef";
import { BlockParameterPort, BlockBehaviorPort, BlockParameteType } from "../Port";
import CommonUtils from "../../utils/CommonUtils";

export default { 
  register,
  getScriptBaseBlockIn() { return blockIn; },
  getScriptBaseBlockOut() { return blockOut;  }
}

function register() {
  registerScriptBase();
  registerDebugBase();
  registerCalcBase();
}

let blockIn : BlockRegData;
let blockOut : BlockRegData;

function registerScriptBase()  {

  blockIn = new BlockRegData("0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F", "脚本入口");
  blockOut = new BlockRegData("77885802-92C8-569B-1E7F-48938943A549", "脚本出口");

  blockIn.baseInfo.author = 'imengyu';
  blockIn.baseInfo.description = "脚本入口，脚本在这里开始运行";
  blockIn.baseInfo.category = '基础/脚本';
  blockIn.baseInfo.version = '2.0';
  blockIn.ports = [
    {
      name: "脚本开始",
      description: '脚本在这里开始运行',
      direction: 'output',
      guid: '00000001'
    },
  ]
  blockIn.callbacks.onCreate = () => {};
  blockIn.callbacks.onPortActive = (block, port) => {};
  blockIn.callbacks.onParameterUpdate = (block, port) => {};
  blockIn.settings.oneBlockOnly = true;

  blockOut.baseInfo.author = 'imengyu';
  blockOut.baseInfo.description = "脚本出口，调用此单元结束整个脚本的运行";
  blockOut.baseInfo.category = '基础/脚本';
  blockOut.baseInfo.version = '2.0';
  blockOut.ports = [
    {
      name: "结束脚本",
      description: '',
      direction: 'input',
      guid: '00000001'
    },
  ]
  blockOut.callbacks.onCreate = () => {};
  blockOut.callbacks.onPortActive = (block, port) => {};
  blockOut.callbacks.onParameterUpdate = (block, port) => {};
  blockOut.settings.oneBlockOnly = true;

  BlockServiceInstance.registerBlock(blockIn, false);
  BlockServiceInstance.registerBlock(blockOut, false);
}
function registerDebugBase() {

  ParamTypeServiceInstance.registerCustomType(new BlockParameterEnumRegData("DebugLogLevel", [
    'log','info','warn','error'
  ]));

  let blockDebug = new BlockRegData("4B6EA737-9702-A383-A268-AADC332038DF", "输出日志");
  blockDebug.baseInfo.author = 'imengyu';
  blockDebug.baseInfo.description = "脚本入口，脚本在这里开始运行";
  blockDebug.baseInfo.category = '基础/调试';
  blockDebug.baseInfo.version = '2.0';
  blockDebug.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: '00000001'
    },
    {
      name: "",
      description: '',
      direction: 'output',
      guid: '00000002'
    },
  ];
  blockDebug.parameters = [
    {
      name: "输出",
      description: '',
      direction: 'input',
      guid: '00000003',
      paramType: 'any',
      paramCustomType: 'any'
    },
    {
      name: "等级",
      description: '',
      direction: 'input',
      guid: '00000004',
      paramType: 'enum',
      paramCustomType: 'DebugLogLevel'
    },
  ];
  blockDebug.callbacks.onCreate = (block) => {
      block.data['paramInput'] = block.getPortByGUID('00000003');
      block.data['paramLevel'] = block.getPortByGUID('00000004');
      block.data['portOut'] = block.getPortByGUID('00000002');
  };
  blockDebug.callbacks.onPortActive = (block, port) => {
      if(port.direction == 'input') {
        let paramInput = <BlockParameterPort>block.data['paramInput'];
        let paramLevel = <BlockParameterPort>block.data['paramInput'];
        let portOut = <BlockBehaviorPort>block.data['portOut'];

        switch(<string>paramLevel.paramValue) {
          case 'log':
            console.log(paramInput.paramValue);
            break;
          case 'info':
            console.info(paramInput.paramValue);
            break; 
          case 'warn':
            console.warn(paramInput.paramValue);
            break;
          case 'error':
            console.error(paramInput.paramValue);
            break;
        }

        portOut.active();
      }
  };
  blockDebug.callbacks.onParameterUpdate = (block, port) => {};
  blockDebug.callbacks.onCreateCustomEditor = null;

  BlockServiceInstance.registerBlock(blockDebug, false);
}
function registerCalcBase() {

  let blockAddition = new BlockRegData("31CCFD61-0164-015A-04B1-732F0A7D6661", "相加");
  blockAddition.baseInfo.author = 'imengyu';
  blockAddition.baseInfo.description = "相加单元，相加两个或多个参数";
  blockAddition.baseInfo.category = '基础/运算';
  blockAddition.baseInfo.version = '2.0';
  blockAddition.ports = [
    {
      name: "",
      description: '默认入口单元',
      direction: 'input',
      guid: 'CDEDC799'
    },
    {
      name: "",
      description: '默认出口单元',
      direction: 'output',
      guid: 'F8E71C0D'
    },
  ];
  blockAddition.parameters = [
    {
      name: "参数1",
      description: '',
      direction: 'input',
      guid: '00000001',
      paramType: 'any',
      paramCustomType: ''
    },
    {
      name: "参数2",
      description: '',
      direction: 'input',
      guid: '00000002',
      paramType: 'any',
      paramCustomType: ''
    },
    {
      name: "结果",
      description: '',
      direction: 'output',
      guid: '00000000',
      paramType: 'any',
      paramCustomType: ''
    },
  ];
  blockAddition.settings = {
    parametersChangeSettings: {
      userCanAddInputParameter: true,
      userCanAddOutputParameter: false,
    },
    portsChangeSettings: {
      userCanAddInputPort: false,
      userCanAddOutputPort: false
    },
    oneBlockOnly: false
  };
  blockAddition.callbacks = {
    onCreate: (block) => {
      if(typeof block.options['opType'] == 'undefined')
        block.options['opType'] = 'any';
    },
    onPortActive : (block, port) => {

    },
    onPortAdd: null,
    onPortRemove: null,
    onUserAddPort: null,
    OnUserAddParam: (block, dirction) => {
      return {
        name: '参数' + (block.inputParameterCount + 1),
        guid: CommonUtils.pad((block.inputParameterCount + 1), 8),
        paramCustomType: '',
        paramType: block.options['opType'],
        direction: dirction,
        description: '',
      };
    },
    onParameterUpdate : (block, port) => {

    },
    onParameterAdd : (block, port) => {

    },
    onParameterRemove : (block, port) => {

    },
    onCreateCustomEditor : (parentEle, block, regData) => {
      let el = document.createElement('div');
      let typeSelector = document.createElement('select');
      typeSelector.innerHTML = '<option value="string">string</option>' +
        '<option value="number">number</option><option value="any">any</option>';
      typeSelector.value = block.options['opType'];
      typeSelector.onchange = () => {
        let newType : BlockParameteType;
        switch(typeSelector.value) {
          case 'string': newType = 'string'; break;
          case 'number': newType = 'number'; break;
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
    }
  };

  BlockServiceInstance.registerBlock(blockAddition, false);
}