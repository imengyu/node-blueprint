import type { VNode } from "vue";
import type { IKeyValueObject } from "../../Utils/BaseTypes";
import { SerializableObject } from "../../Utils/Serializable/SerializableObject";
import type { NodePort } from "../Node/NodePort";
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
  /**
   * 编辑器：编辑器
   */
  typeEditor?: NodeParamEditorCreateCallback|undefined;
  /**
   * 编辑器：自定义端口渲染
   */
  customPortIconRender?: NodeParamCustomPortIconRenderCallback|undefined;
}

export type NodeParamEditorCreateCallback = (props: IKeyValueObject) => VNode;

export type NodeParamCustomPortIconRenderCallback = (port: NodePort, param: NodeParamType) => VNode;

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
  public static Execute = new NodeParamType();

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
   * 检查当前类是否继承自某个类(包括父级)
   * @param another 
   */
  isInheritBy(another: NodeParamType) {
    let parentClass = another.inheritType;
    while(parentClass) {
      if (parentClass === another)
        return true;
      parentClass = parentClass.inheritType;
    }
    return false;
  }

  /**
   * Check whether the current type and other types are acceptable
   * Dirction : this -> another : list<aa> -> list<a> / aa -> a
   * @param another 
   */
  acceptable(another: NodeParamType, includeAny = true) {
    //通配符
    if (includeAny && (this.baseType === 'any' || another.baseType === 'any'))
      return true;
    //检查类型
    if (
      this.baseType === another.baseType //基础类型必须一致
      && (
        this.name === another.name //名称一致
        || this.isInheritBy(another) //或者继承自另外一个类，可以从父类转为子类
      )
      && this.genericTypes.length === another.genericTypes.length //泛型参数个数一致
    ) {

      //没有泛型
      if (this.genericTypes.length === 0)
        return true;

      //检查泛型
      for (let i = 0; i < this.genericTypes.length; i++) {
        if (this.genericTypes[i] !== another.genericTypes[i] 
          && 
            !(
              (includeAny && this.genericTypes[i].baseType === 'any')
              || (includeAny && another.genericTypes[i].baseType === 'any')
            ) //检查泛型的通配符
            && !(
              this.genericTypes[i].isInheritBy(another.genericTypes[i])
            ) //检查泛型的继承
          ) {
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
