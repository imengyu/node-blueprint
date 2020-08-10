import BlockServiceInstance from "../../sevices/BlockService";
import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { BlockParameterEnumRegData, BlockRegData } from "../Define/BlockDef";
import { BlockParameterPort, BlockBehaviorPort, BlockParameteType } from "../Define/Port";
import DebugWorkProviderInstance from "../WorkProvider/DebugWorkProvider";
import OperatorBlocks from "./OperatorBlocks";

export default { 
  register,
  getScriptBaseBlockIn() { return blockIn; },
  getScriptBaseBlockOut() { return blockOut;  }
}

function register() {
  registerScriptBase();
  registerDebugBase();
  registerTypeBase();

  OperatorBlocks.register();
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
  blockIn.baseInfo.logo = require('../../assets/images/BlockIcon/entry_go.svg');
  blockIn.ports = [
    {
      name: "脚本开始",
      description: '脚本在这里开始运行',
      direction: 'output',
      guid: '00000000',
      defaultConnectPort: true,
    },
  ]
  blockIn.callbacks.onCreate = () => {};
  blockIn.callbacks.onPortActive = (block, port) => {};
  blockIn.callbacks.onParameterUpdate = (block, port) => {};
  blockIn.settings.oneBlockOnly = true;
  blockIn.blockStyle.titleBakgroundColor = "rgba(25,25,112,0.6)";

  blockOut.baseInfo.author = 'imengyu';
  blockOut.baseInfo.description = "脚本出口，调用此单元结束整个脚本的运行";
  blockOut.baseInfo.category = '基础/脚本';
  blockOut.baseInfo.version = '2.0';
  blockOut.baseInfo.logo = require('../../assets/images/BlockIcon/entry_exit.svg');
  blockOut.ports = [
    {
      name: "结束脚本",
      description: '',
      direction: 'input',
      guid: '00000001',
      defaultConnectPort: false,
    },
  ]
  blockOut.callbacks.onCreate = () => {};
  blockOut.callbacks.onPortActive = (block, port) => {
    block.currentRunningContext.runner.notifyEnd();
  };
  blockOut.callbacks.onParameterUpdate = (block, port) => {};
  blockOut.settings.oneBlockOnly = true;
  blockOut.blockStyle.titleBakgroundColor = "rgba(112,30,133,0.6)";

  BlockServiceInstance.registerBlock(blockIn, false);
  BlockServiceInstance.registerBlock(blockOut, false);
}
function registerDebugBase() {

  ParamTypeServiceInstance.registerCustomType(new BlockParameterEnumRegData("DebugLogLevel", [
    'log','info','warn','error'
  ], '#F7C709'));

  let blockDebug = new BlockRegData("4B6EA737-9702-A383-A268-AADC332038DF", "输出日志");
  let blockModal = new BlockRegData("CB1FB757-631D-8A95-0AB1-3CB28CB04FBC", "显示一个信息对话框");
  let blockConfirm = new BlockRegData("84AB5443-1998-B4FB-773A-5F41F364BB7A", "显示一个确认对话框");
  let blockDelay = new BlockRegData("6C01D858-CF4D-D9EF-C18E-DE5DAE400702", "延时");

  blockDelay.baseInfo.author = 'imengyu';
  blockDelay.baseInfo.description = "延迟流程图的运行";
  blockDelay.baseInfo.category = '基础';
  blockDelay.baseInfo.version = '2.0';
  blockDelay.baseInfo.logo = require('../../assets/images/BlockIcon/clock.svg');
  blockDelay.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: '00000001',
      defaultConnectPort: false,
    },
    {
      name: "",
      description: '',
      direction: 'output',
      guid: '00000002',
      defaultConnectPort: false,
    },
  ];
  blockDelay.parameters = [
    {
      name: "时长",
      description: '延迟时长（毫秒）',
      direction: 'input',
      guid: '00000003',
      paramType: 'number',
      paramCustomType: '',
      paramDefaultValue: 1000,
      defaultConnectPort: false,
    },
  ];
  blockDelay.callbacks.onCreate = (block) => {};
  blockDelay.callbacks.onPortActive = (block, port) => {
    let v = block.getInputParamValue('00000003');
    setTimeout(() => block.activeOutputPortInNewContext('00000002'), v ? v : 1000);
  };
  blockDelay.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";
  blockDelay.blockStyle.logoRight = blockDelay.baseInfo.logo;

  blockDebug.baseInfo.author = 'imengyu';
  blockDebug.baseInfo.description = "输出调试日志至控制台";
  blockDebug.baseInfo.category = '基础/调试';
  blockDebug.baseInfo.version = '2.0';
  blockDebug.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: '00000001',
      defaultConnectPort: false,
    },
    {
      name: "",
      description: '',
      direction: 'output',
      guid: '00000002',
      defaultConnectPort: false,
    },
  ];
  blockDebug.parameters = [
    {
      name: "输出",
      description: '',
      direction: 'input',
      guid: '00000003',
      paramType: 'any',
      paramCustomType: 'any',
      paramDefaultValue: null,
      defaultConnectPort: false,
    },
    {
      name: "等级",
      description: '',
      direction: 'input',
      guid: '00000004',
      paramType: 'enum',
      paramCustomType: 'DebugLogLevel',
      paramDefaultValue: 'log',
      defaultConnectPort: false,
    },
  ];
  blockDebug.callbacks.onCreate = (block) => {
    block.data['paramInput'] = block.getPortByGUID('00000003');
    block.data['paramLevel'] = block.getPortByGUID('00000004');
    block.data['portOut'] = block.getPortByGUID('00000002');
  };
  blockDebug.callbacks.onPortActive = (block, port) => {
    let paramInput = <BlockParameterPort>block.data['paramInput'];
    let paramLevel = <BlockParameterPort>block.data['paramLevel'];
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

    portOut.active(block.currentRunningContext);
  };
  blockDebug.callbacks.onParameterUpdate = (block, port) => {};
  blockDebug.callbacks.onCreateCustomEditor = null;
  blockDebug.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  blockModal.baseInfo.author = 'imengyu';
  blockModal.baseInfo.description = "显示一个对话框";
  blockModal.baseInfo.category = '基础/调试';
  blockModal.baseInfo.version = '2.0';
  blockModal.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: '00000001',
      defaultConnectPort: false,
    },
    {
      name: "",
      description: '',
      direction: 'output',
      guid: '00000002',
      defaultConnectPort: false,
    },
  ];
  blockModal.parameters = [
    {
      name: "标题",
      description: '',
      direction: 'input',
      guid: '00000003',
      paramType: 'string',
      paramCustomType: '',
      paramDefaultValue: '',
      defaultConnectPort: false,
    },
    {
      name: "文字",
      description: '',
      direction: 'input',
      guid: '00000004',
      paramType: 'string',
      paramCustomType: '',
      paramDefaultValue: '',
      defaultConnectPort: false,
    },
    {
      name: "等级",
      description: '',
      direction: 'input',
      guid: '00000005',
      paramType: 'enum',
      paramCustomType: 'DebugLogLevel',
      paramDefaultValue: 'log',
      defaultConnectPort: false,
    },
  ];
  blockModal.callbacks.onCreate = (block) => {
    block.data['paramTitle'] = block.getPortByGUID('00000003');
    block.data['paramText'] = block.getPortByGUID('00000004');
    block.data['paramLevel'] = block.getPortByGUID('00000005');
    block.data['portOut'] = block.getPortByGUID('00000002');
  };
  blockModal.callbacks.onPortActive = (block, port) => {
    let paramText = <BlockParameterPort>block.data['paramText'];
    let paramTitle = <BlockParameterPort>block.data['paramTitle'];
    let paramLevel = <BlockParameterPort>block.data['paramLevel'];
    let portOut = <BlockBehaviorPort>block.data['portOut'];

    DebugWorkProviderInstance.ModalProvider(<string>paramLevel.paramValue, <string>paramTitle.paramValue, <string>paramText.paramValue, () => {
      portOut.activeInNewContext();
    });

  };
  blockModal.callbacks.onParameterUpdate = (block, port) => {};
  blockModal.callbacks.onCreateCustomEditor = null;
  blockModal.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  blockConfirm.baseInfo.author = 'imengyu';
  blockConfirm.baseInfo.description = "显示一个确认对话框，用户可选择确认或取消";
  blockConfirm.baseInfo.category = '基础/调试';
  blockConfirm.baseInfo.version = '2.0';
  blockConfirm.ports = [
    {
      name: "",
      description: '',
      direction: 'input',
      guid: '00000001',
      defaultConnectPort: true,
    },
    {
      name: "点击确认",
      description: '用户点击了确认按钮',
      direction: 'output',
      guid: '00000002',
      defaultConnectPort: false,
    },
    {
      name: "点击取消",
      description: '用户点击了取消按钮',
      direction: 'output',
      guid: '00000003',
      defaultConnectPort: false,
    },
  ];
  blockConfirm.parameters = [
    {
      name: "标题",
      description: '',
      direction: 'input',
      guid: '00000004',
      paramType: 'string',
      paramCustomType: '',
      paramDefaultValue: '',
      defaultConnectPort: false,
    },
    {
      name: "文字",
      description: '',
      direction: 'input',
      guid: '00000005',
      paramType: 'string',
      paramCustomType: '',
      paramDefaultValue: '',
      defaultConnectPort: false,
    },
  ];
  blockConfirm.callbacks.onCreate = (block) => {
  };
  blockConfirm.callbacks.onPortActive = (block, port) => {
    
    DebugWorkProviderInstance.ConfirmModalProvider(<string>block.getInputParamValue('00000004'), 
      <string>block.getInputParamValue('00000005'), () => {
        block.activeOutputPortInNewContext('00000002');
      }, () => {
        block.activeOutputPortInNewContext('00000003');
      });

  };
  blockConfirm.callbacks.onParameterUpdate = (block, port) => {};
  blockConfirm.callbacks.onCreateCustomEditor = null;
  blockConfirm.blockStyle.titleBakgroundColor = "rgba(120,200,254,0.6)";

  BlockServiceInstance.registerBlock(blockDelay, false);
  BlockServiceInstance.registerBlock(blockConfirm, false);
  BlockServiceInstance.registerBlock(blockDebug, false);
  BlockServiceInstance.registerBlock(blockModal, false);
}
function registerTypeBase() {

  let comUppdateFn = (block, port) => {
    block.setOutputParamValue('00000002', block.getInputParamValue('00000001'));
  };

  let block = new BlockRegData("A81899CF-766B-F511-B179-90A81BBB088B", "字符串", "字符串 string 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/string.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.parameters = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'string',
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'string',
    },
  ];
  block.callbacks.onParameterUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(255,20,147,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);

  block = new BlockRegData("EE8345CE-14FB-3CE5-C5CD-30CF3A102DE5", "数字", "数字 number 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/number.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.parameters = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'number',
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'number',
    },
  ];
  block.callbacks.onParameterUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(158,258,68,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);

  block = new BlockRegData("6CE4CA4F-E2F9-AD97-3F83-1B60289C9290", "BigInt", "BigInt 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/bigint.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.parameters = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'bigint',
      paramDefaultValue: 0,
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'bigint',
    },
  ];
  block.callbacks.onParameterUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(0,168,243,0.5)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);

  block = new BlockRegData("90833609-8CF7-2324-A4C0-781344701C06", "布尔值", "布尔 boolean 类型参数");
  block.baseInfo.logo = require('../../assets/images/BlockIcon/boolean.svg');
  block.baseInfo.author = 'imengyu';
  block.baseInfo.category = '基础/类型参数';
  block.baseInfo.version = '2.0';
  block.parameters = [
    {
      direction: 'input',
      guid: '00000001',
      paramType: 'boolean',
      paramDefaultValue: true,
    },
    {
      direction: 'output',
      guid: '00000002',
      paramType: 'boolean',
    },
  ];
  block.callbacks.onParameterUpdate = comUppdateFn;
  block.blockStyle.titleBakgroundColor = "rgba(180,0,0,0.6)";
  block.blockStyle.smallTitle = true;
  block.blockStyle.noTitle = true;
  block.blockStyle.hideLogo = true;

  BlockServiceInstance.registerBlock(block, false);
}