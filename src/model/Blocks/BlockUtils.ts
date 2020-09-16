import CommonUtils from "../../utils/CommonUtils";
import { BlockParameterType, BlockPort } from "../Define/Port";
import { BlockEditor } from "../Editor/BlockEditor";

export default {
  testAndChangeFlexablePortType,
  testAndResetFlexablePortType,
}

/**
 * 更改所有弹性端口至第一个连接端口的类型
 * @param block 目标单元
 * @param portTarget 当前事件连接的单元
 */
export function testAndChangeFlexablePortType(
  block: BlockEditor,
  portCurent: BlockPort, 
  portTarget: BlockPort, 
  flexablePropKey = 'flexable'
) {
  let currentType : BlockParameterType = null;
  let anyFlexablePortConnectedCount = 0;
  let anyFlexablePortConnectedInputCount = 0;

  if(!Object.keys(portCurent.portAnyFlexable).contains(flexablePropKey))
    return 'any';

  for (let i = block.allPorts.length - 1; i >= 0; i--) {
    if(!block.allPorts[i].paramType.isExecute()) {
      let prop = block.allPorts[i].portAnyFlexable[flexablePropKey];
      if (prop === true || typeof prop == 'object') {
        anyFlexablePortConnectedCount += block.allPorts[i].isConnected() ? 1 : 0;
        if (block.allPorts[i].direction == 'input') 
          anyFlexablePortConnectedInputCount += block.allPorts[i].isConnected() ? 1 : 0;
        if (anyFlexablePortConnectedCount > 1 && anyFlexablePortConnectedInputCount > 1) break;
      }
    }
  }
  if (anyFlexablePortConnectedCount == 1 || (anyFlexablePortConnectedInputCount == 1 && portCurent.direction == 'input')) {

    let targetKeyData = portTarget.portAnyFlexable[flexablePropKey];
    if(!CommonUtils.isDefined(targetKeyData)) {
      let keys = Object.keys(portTarget.portAnyFlexable);
      if(keys.length == 0) targetKeyData = '';
      else targetKeyData = portTarget.portAnyFlexable[keys[0]];
    }

    for (let i = block.allPorts.length - 1; i >= 0; i--) {
      if(!block.allPorts[i].paramType.isExecute()) {
        let prop = block.allPorts[i].portAnyFlexable[flexablePropKey];
        if(CommonUtils.isDefined(prop)) {
          currentType = typeof targetKeyData == 'object' ? portTarget[targetKeyData.get] : portTarget.paramType;
          if (prop === true) 
            block.changePortParamType(block.allPorts[i], currentType);
          else if(typeof prop == 'object') {;
            block.allPorts[i][prop.set] = currentType;
            block.changePortParamType(block.allPorts[i], undefined);
          }
        }
      }
    }
  }
  return currentType ? currentType.getType() : undefined;
}
/**
 * 恢复所有弹性端口
 * @param block 目标单元
 */
export function testAndResetFlexablePortType(block: BlockEditor, flexablePropKey = 'flexable') {
  let anyFlexablePortConnected = false;
  let result = false;
  for (let i = block.allPorts.length - 1; i >= 0; i--) {
    if(!block.allPorts[i].paramType.isExecute()) {
      let prop = block.allPorts[i].portAnyFlexable[flexablePropKey];
      if (prop === true || typeof prop == 'string') {
        anyFlexablePortConnected = block.allPorts[i].isConnected();
        if (anyFlexablePortConnected) break;
      }
    }
  }

  if (!anyFlexablePortConnected) {
    result = true;
    for (let i = block.allPorts.length - 1; i >= 0; i--) {
      if(!block.allPorts[i].paramType.isExecute()) {
        let prop = block.allPorts[i].portAnyFlexable[flexablePropKey];
        if (prop === true)
          block.changePortParamType(block.allPorts[i], "any");
        else if(typeof prop == 'object') {
          block.allPorts[i][prop.set] = BlockParameterType.Any;
          block.changePortParamType(block.allPorts[i], undefined);
        }
      }
    }
  }

  return result;
}
