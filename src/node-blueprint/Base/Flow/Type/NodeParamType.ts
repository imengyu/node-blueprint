import { IKeyValueObject } from "../../Utils/BaseTypes";
import { SerializableObject } from "../../Utils/Serializable/SerializableObject";
import { NodeParamTypeRegistry } from "./NodeParamTypeRegistry";

/**
 * Base types
 */
export type NodeParamBaseTypes = 
  | "execute"
  | 'string'
  | 'boolean'
  | 'number'
  | 'object'
  | 'enum'
  | 'any'
  | 'null';

export interface NodeParamTypeDefine {
  /**
   * 基础类型
   */
  baseType: NodeParamBaseTypes;
  /**
   * object 继承类型
   */
  inheritType: NodeParamType|null;
  /**
   * 默认值
   */
  defaultValue: () => unknown;
  /**
   * 当此类型是 enum 时，是否自动创建转换器 
   */
  autoCreateEnumConverter?: boolean;
  /**
   * [Editor only] Type color
   */
  typeColor: string;
  /**
   * [Editor only] Description of this type
   */
  typeDescription: string;
  /**
   * [Editor only] Title of this type
   */
  typeTitle: string;
}

/**
 * Type instance
 */
export class NodeParamType extends SerializableObject<NodeParamTypeDefine> {

  constructor() {
    super('NodeParamType');
    this.serializableProperties = [];
  }

  /**
   * 内置类型 通配符
   */
  public static Any: NodeParamType;
  /**
   * 内置类型 字符串
   */
  public static String: NodeParamType;
  /**
   * 内置类型 数字
   */
  public static Number: NodeParamType;
  /**
   * 内置类型 布尔值
   */
  public static Boolean: NodeParamType;
  /**
   * 内置类型 执行
   */
  public static Execute: NodeParamType;

  override save(): IKeyValueObject {
    return {
      name: this.toString(),
    };
  }
  override load(data: NodeParamTypeDefine) {
    return NodeParamTypeRegistry.getInstance().getTypeByString((data as unknown as IKeyValueObject).name as string)
      || NodeParamTypeRegistry.getInstance().getTypeByString('any') as NodeParamType;
  }

  /**
   * 类型名称
   */
  name = '';
  /**
   * 类型名称
   */
  genericTypes: NodeParamType[] = [];
  /**
   * 基础类型名称
   */
  baseType: NodeParamBaseTypes = 'null';
  /**
   * object 继承类型
   */
  inheritType: NodeParamType|null = null;

  define : NodeParamTypeDefine|null = null;

  /**
   * Get whether the current type is generic
   */
  get isGeneric() {
    return this.genericTypes.length > 0;
  }
  /**
   * 获取类型是不是执行
   */
  get isExecute() {
    return this.baseType === 'execute';
  }
  /**
   * 获取类型是不是通配符
   */
  get isAny() {
    return this.baseType === 'any';
  }

  /**
   * Get the definition string for this type.
   * @returns 
   */
  toString() : string {
    return `${this.name}${this.genericTypes.length > 0 ? ('<' + this.genericTypes.join(',') + '>') : ''}`;
  }

  /**
   * Check whether the current type and other types are acceptable
   * @param another 
   */
  acceptable(another: NodeParamType) {
    //通配符
    if (this.baseType === 'any' || another.baseType === 'any')
      return true;
    //检查类型
    if (
      this.baseType === another.baseType
      && this.name === another.name
      && this.genericTypes.length === another.genericTypes.length) {

      //没有泛型
      if (this.genericTypes.length === 0)
        return true;

      //检查泛型的通配符
      for (let i = 0; i < this.genericTypes.length; i++) {
        if (this.genericTypes[i] !== another.genericTypes[i] 
          && !(this.genericTypes[i].baseType === 'any'
          || another.genericTypes[i].baseType === 'any')) {
            return false;
        }
      }
      return true;
    }
    return false;
  }

  /**
   * Check that the current type is the same as another type
   * @param another 
   */
  equal(another: NodeParamType) {
    return this.toString() == another.toString();
  }
}
