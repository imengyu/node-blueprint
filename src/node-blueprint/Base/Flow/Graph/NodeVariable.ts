import { SerializableObject } from "../../Serializable/SerializableObject";
import type { IKeyValueObject } from "../../Utils/BaseTypes";
import { NodeParamType } from "../Type/NodeParamType";

/**
 * 变量定义
 */
export class NodeVariable extends SerializableObject<INodeVariableDefine> {
  constructor(define?: INodeVariableDefine) {
    super('NodeVariable', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
        },
      }
    });
  }

  name = '';  
  type = NodeParamType.Any;
  defaultValue : unknown = null;
  static = false;
  customData : IKeyValueObject = {};
}

export interface INodeVariableDefine {
  name: string; 
  type: NodeParamType;
  defaultValue ?: unknown;
  static ?: boolean;
  customData ?: IKeyValueObject;
}