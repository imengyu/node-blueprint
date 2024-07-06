import type { VNode } from "vue";
import type { IKeyValueObject } from "../../Utils/BaseTypes";
import { SerializableObject } from "../../Serializable/SerializableObject";
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
  inheritType?: NodeParamType|null|undefined;
  /**
   * 默认值
   */
  defaultValue: () => unknown;
  /**
   * 指示当前类型是否是自定义组合类型，
   * 自定义组合类型会被保存至文件中，下次打开后可以加载
   */
  isCustomType?: boolean;
  /**
   * 当此类型是 enum 时，是否自动创建转换器 
   */
  autoCreateEnumConverter?: boolean;
  /**
   * 当此类型是 enum 时，给出用户可选的选项
   */
  options?: unknown[]; 
  /**
   * [Editor only] Type color
   */
  typeColor?: string;
  /**
   * [Editor only] Description of this type
   */
  typeDescription?: string;
  /**
   * [Editor only] Title of this type
   */
  typeTitle?: string;
  /**
   * 编辑器：是否在选择类型编辑器中隐藏
   */
  hiddenInChoosePanel?: boolean;
  /**
   * 用于编辑器获取泛型参数的开关控制
   * @param index 当前参数索引
   * @returns 
   */
  typeGenericPickerOption?: (index: number) => ({
    canBeAny: boolean,
    canBeExecute: boolean,
    canBeNoHash: boolean,
    canBeContainer: boolean,
  })|undefined;
  /**
   * 编辑器：自定义泛型名称拼接
   */
  typeGenericNameMerger?: (genericNames: string[], sourceName: string, inControl: boolean) => string;
  /**
   * 编辑器：自定义颜色色合并
   */
  typeColorMerger?: (type: NodeParamType) => string;
  /**
   * 编辑器：自定义类型创建，通常在用户在编辑器中选择类型时触发
   */
  typeCreate?: (type: NodeParamType) => NodeParamType;
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
    super('NodeParamType', undefined, {
      serializeSchemes: {
        default: {
          serializableProperties: [],
        }
      },
      loadOverride: (data) => {
        return NodeParamTypeRegistry.getInstance().getTypeByString(
          (data as unknown as IKeyValueObject).name as string
        ) || NodeParamType.Any;
      },
      saveOverride: () => {
        return {
          name: this.toString(),
        };
      },
    });
  }

  /**
   * 从名称获取类型实例
   * @param typeString 
   * @param autoCreateGeneric 
   */
  public static FromString(typeString: string, autoCreateGeneric = true) {
    if (!typeString)
      throw new Error('typeString is empty! ');
    const registry = NodeParamTypeRegistry.getInstance();
    let newType = registry.getTypeByString(typeString) as NodeParamType;
    if (!newType) {

      //尝试创建新的泛型类型
      if (autoCreateGeneric && typeString.includes('<')) {
        const baseType = registry.getTypeByString(typeString.split('<')[0]);
        if (!baseType)
          throw new Error('Try create a new generic type failed! Base type not found!');
        newType = registry.registerType(typeString, baseType.define!);
        return newType;
      }
      throw new Error(`Not found type ${typeString}!`);
    }
    return newType;
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
   * 内置类型 大数字
   */
  public static Bigint: NodeParamType;  
  /**
   * 内置类型 布尔值
   */
  public static Boolean: NodeParamType;
  /**
   * 内置类型 执行
   */
  public static Execute = new NodeParamType();
  /**
   * 内置类型 对象
   */
  public static Object: NodeParamType;
  /**
   * 内置类型 数组
   */
  public static Array: NodeParamType;
  /**
   * 内置类型 集
   */
  public static Set: NodeParamType;
  /**
   * 内置类型 映射
   */
  public static Dictionary: NodeParamType;

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
  /**
   * 是否在选择类型编辑器中隐藏
   */
  hiddenInChoosePanel = false;

  define : NodeParamTypeDefine|null = null;

  /**
   * 指示当前类型是否是自定义组合类型，
   * 自定义组合类型会被保存至文件中，下次打开后可以加载
   */
  isCustomType = false;
  /**
   * 获取当前类型是不是基础类型
   */
  get isBaseType() {
    return this.inheritType === null && (
      this.baseType === 'string' ||
      this.baseType === 'boolean' ||
      this.baseType === 'number' ||
      this.baseType === 'any' ||
      this.baseType === 'null'
    );
  }
  /**
   * 获取类型是不是数组
   */
  get isArray() {
    return this.name === 'array';
  }
  /**
   * 获取类型是不是集
   */
  get isSet() {
    return this.name === 'set';
  }
  /**
   * 获取类型是不是字典
   */
  get isDictionary() {
    return this.name === 'dictionary';
  }
  /**
   * 获取类型是不是枚举
   */
  get isEnum() {
    return this.baseType === 'enum';
  }
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
   * 获取当前类型对用户友好的说明文字
   * @returns 
   */
  toUserFriendlyName(inControl = false) {
    let string = `${this.define?.typeTitle || this.name} `;
    if (this.genericTypes.length > 0) {
      const genericNames = this.genericTypes.map(t => t.toUserFriendlyName());
      if (this.define?.typeGenericNameMerger)
        string = this.define.typeGenericNameMerger(genericNames, string, inControl);
      else
        string += '泛型参数' + this.genericTypes.map(t => t.toUserFriendlyName()).join(',');
    }
    return string;
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
    if (includeAny 
      && (this.baseType === 'any' || another.baseType === 'any')
      && (this.baseType !== 'execute' && another.baseType !== 'execute')
    )
      return true;
    //执行
    if (this.isExecute && another.isExecute)
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
    return this.toString() === another.toString();
  }
}
