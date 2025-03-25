import { CreateObjectFactory, SerializableFactory } from "../../Serializable/SerializableFactory";
import { SerializableObject } from "../../Serializable/SerializableObject";
import type { IKeyValueObject } from "../../Utils/BaseTypes";
import { NodeParamType } from "../Type/NodeParamType";

/**
 * 变量定义
 */
export class NodeVariable extends SerializableObject<INodeVariableDefine> {

  static TAG = 'NodeVariable';

  static {
    CreateObjectFactory.addObjectFactory(NodeVariable.TAG, (define: INodeVariableDefine) => new NodeVariable(define));
    SerializableFactory.addSerializableObjectConfig(NodeVariable.TAG, {
      serializeSchemes: {
        default: {
          serializeAll: true,
        },
      }
    });
  }

  constructor(define?: INodeVariableDefine) {
    super(NodeVariable.TAG, define, NodeVariable.TAG);
  }

  name = '';  
  type = NodeParamType.Any;
  defaultValue : unknown = null;
  isStatic = false;
  customData : IKeyValueObject = {};
}

export interface INodeVariableDefine {
  name: string; 
  type: NodeParamType;
  defaultValue ?: unknown;
  static ?: boolean;
  customData ?: IKeyValueObject;
}