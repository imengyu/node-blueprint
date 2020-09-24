import CommonUtils from "../../../utils/CommonUtils";
import { BlockParameterType } from "../../Define/BlockParameterType";
import { BlockPort } from "../../Define/Port";
import { BlockEditor } from "../../Editor/BlockEditor";

export default {
  doChangeBlockFlexablePort,
  testAndResetFlexablePortType,
}

/**
 * 恢复所有弹性端口
 * @param block 目标单元
 */
export function testAndResetFlexablePortType(block: BlockEditor, flexablePropKey = 'flexable') {
  let anyFlexablePortConnected = false;
  let result = false;
  let port : BlockPort = null;
  
  for (let i = block.allPorts.length - 1; i >= 0; i--) {
    port = block.allPorts[i];
    if(!port.paramType.isExecute()) {
      let prop = port.portAnyFlexable[flexablePropKey];
      if (prop === true || typeof prop == 'string') {
        anyFlexablePortConnected = port.isConnected();
        if (anyFlexablePortConnected) break;
      }
    }
  }

  if (!anyFlexablePortConnected) {
    result = true;
    for (let i = block.allPorts.length - 1; i >= 0; i--) {
      port = block.allPorts[i];
      if(!port.paramType.isExecute()) {
        let prop = port.portAnyFlexable[flexablePropKey];
        if (prop === true)
          block.changePortParamType(port, 'any', undefined, 'any');
        else if(typeof prop == 'object') {
          port[prop.set] = BlockParameterType.Any();
          block.changePortParamType(port, undefined);
        }
      }
    }
  }

  return result;
}

export function doChangeBlockFlexablePort(block: BlockEditor, portCurrent: BlockPort, flexablePropKey : string) {
  let currentType : BlockParameterType = null;
  let port : BlockPort = null;

  if(Object.keys(portCurrent.portAnyFlexable).indexOf(flexablePropKey) < 0)
    return 'any';

  let targetKeyData = portCurrent.portAnyFlexable[flexablePropKey];
  if(!CommonUtils.isDefined(targetKeyData)) {
    let keys = Object.keys(portCurrent.portAnyFlexable);
    if(keys.length == 0) targetKeyData = '';
    else targetKeyData = portCurrent.portAnyFlexable[keys[0]];
  }

  for (let i = block.allPorts.length - 1; i >= 0; i--) {
    port = block.allPorts[i];
    if(!port.paramType.isExecute() && port != portCurrent) {
      let prop = port.portAnyFlexable[flexablePropKey];
      if(CommonUtils.isDefined(prop)) {
        currentType = typeof targetKeyData == 'object' ? portCurrent[targetKeyData.get] : portCurrent.paramType;
        if (prop === true) 
          block.changePortParamType(port, currentType);
        else if(typeof prop == 'object') {;
          (<BlockParameterType>port[prop.set]).set(currentType);
          block.changePortParamType(port, undefined);
        }
      }
    }
  }
  
  return currentType ? currentType.getType() : undefined;
}
