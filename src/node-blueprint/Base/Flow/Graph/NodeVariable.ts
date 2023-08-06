import { SerializableObject } from "../../Serializable/SerializableObject";
import type { IKeyValueObject } from "../../Utils/BaseTypes";
import { NodeParamType } from "../Type/NodeParamType";

/**
 * 变量定义
 */
export class NodeVariable extends SerializableObject<INodeVariableDefine> {
  constructor() {
    super('NodeVariable');
  }

  name = '';  
  type = NodeParamType.Any;
  defaultValue : unknown = null;
  value : unknown = null;
  static = false;
  customData : IKeyValueObject = {};
}

export interface INodeVariableDefine {
  name: string; 
  type: NodeParamType;
  defaultValue ?: unknown;
  value ?: unknown;
  static ?: boolean;
  customData ?: IKeyValueObject;
}