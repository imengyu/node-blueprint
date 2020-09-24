import CommonUtils from "../../utils/CommonUtils";
import { BlockRegData } from "../Define/BlockDef";
import { BlockPort } from "../Define/Port";
import os from 'os';

export default { 
  register,
  packageName: 'OS',
  version: 1,
}

function register() {

  //#region EOL

  let OSEOL = new BlockRegData("CB10526D-70D0-94F0-7E00-DF8C26A7B32E", "EOL", '操作系统特定的行末标志。<br>在 POSIX 上是 <code>\\n</code>。<br>在 Windows 上是 <code>\\r\\n</code>。', '', '系统（os）')

  OSEOL.ports = [
    {
      direction: 'output',
      guid: 'OUTEOL',
      paramType: 'string',
      description: '操作系统特定的行末标志',
    },
  ]; 
  OSEOL.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTEOL') {
      block.setOutputParamValue('OUTEOL', os.EOL, context);
    }
  };
  OSEOL.blockStyle.noTitle = true;
  OSEOL.blockStyle.logoBackground = 'title:EOL';
  OSEOL.blockStyle.minWidth = '130px';

  //#endregion

  //#region arch

  let OSarch = new BlockRegData("09F7385-D897-525D-871F-BBE8C4E5F63B", "arch()", 
    '返回为其编译 Node.js 二进制文件的操作系统的 CPU 架构。 可能的值有：\'arm\'、 \'arm64\'、 \'ia32\'、 \'mips\'、\
\'mipsel\'、 \'ppc\'、 \'ppc64\'、 \'s390\'、 \'s390x\'、 \'x32\' 和 \'x64\'。', '', '系统（os）');

  OSarch.ports = [
    {
      direction: 'output',
      guid: 'OUTARCH',
      paramType: 'string',
    },
  ]; 
  OSarch.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUTARCH') {
      block.setOutputParamValue('OUTARCH', os.arch(), context);
    }
  };
  OSarch.blockStyle.noTitle = true;
  OSarch.blockStyle.logoBackground = 'title:arch()';
  OSarch.blockStyle.minWidth = '130px';

  //#endregion

  //#region constants

  let OSconstants = new BlockRegData("9509B5E0-4246-FE54-6420-36D0558A6227", "EOL", 
  '包含错误码、进程信号等常用的操作系统特定的常量。 定义的特定常量在 OS 常量中描述。', '', '系统（os）')

  OSconstants.ports = [
    {
      direction: 'output',
      guid: 'OUT',
      paramType: 'object',
    },
  ]; 
  OSconstants.callbacks.onPortParamRequest = (block, port, context) => {
    if(port.guid == 'OUT') {
      block.setOutputParamValue('OUT', os.constants, context);
    }
  };
  OSconstants.blockStyle.noTitle = true;
  OSconstants.blockStyle.logoBackground = 'title:EOL';
  OSconstants.blockStyle.minWidth = '130px';

  //#endregion
  
  return [
    OSEOL,
    OSarch,
    OSconstants,

  ];
}