import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import CommonUtils from "../../utils/CommonUtils";

/**
 * 端口参数基本类型
 * 
 * execute：执行
 * custom：自定义
 */
export type BlockParameterBaseType = 'execute'|'bigint'|'number'|'string'|'boolean'|'function'|'object'|'any'|'enum'|'custom';
/**
 * 端口参数的集合类型
 * 
 * variable：单个变量
 * array：数组
 * map：集合
 * dictionary：字典（映射）
 */
export type BlockParameterSetType = 'variable'|'array'|'set'|'dictionary';

/**
 * 端口参数类型
 * 注意，判断两个对象类型是否相等请使用equals函数
 */
export class BlockParameterType {

  public baseType : BlockParameterBaseType = 'any';
  public customType = '';

  public constructor(baseType : BlockParameterBaseType, customType = '') {
    this.set(baseType, customType);
  }

  /**
   * 从字符串表示方式创建类型对象
   * @param name 
   */
  public static createTypeFromString(name : string) : BlockParameterType {
    if(name == 'any')
      return BlockParameterType.Any();
    if(ParamTypeServiceInstance.isBaseType(name))
      return new BlockParameterType(<BlockParameterBaseType>name);
    return new BlockParameterType(ParamTypeServiceInstance.getBaseTypeForCustomType(name), name);
  }

  /**
   * 获取静态any类型
   */
  public static Any() { return new BlockParameterType('any') };

  /**
   * 设置当前类型对象的值
   * @param baseType 基础类型
   * @param customType 自定义类型
   */
  public set(baseType : string|BlockParameterType, customType = '') {
    if(typeof baseType == 'undefined') {
      this.baseType = 'any';
      this.customType = '';
      return;
    }
    if(typeof baseType == 'string') {
      if(CommonUtils.isNullOrEmpty(customType)) {
        this.baseType = ParamTypeServiceInstance.getBaseTypeForCustomType(baseType);
        this.customType = baseType;
      }else {
        this.baseType = <BlockParameterBaseType>baseType;
        this.customType = customType;
      }
    }else {
      this.baseType = baseType.baseType;
      this.customType = baseType.customType;
    }
  }

  /**
   * 获取当前类型的字符串表示方式
   */
  public getType() { return this.isCustom() ? this.customType : this.baseType; }

  /**
   * 获取当前类型是不是执行类型
   */
  public isExecute() { return this.baseType == 'execute'; }

  /**
   * 获取当前类型是不是any类型
   */
  public isAny() { return this.baseType == 'any'; }

  /**
   * 获取当前类型是不是自定义类型
   */
  public isCustom() { return (this.baseType == 'custom' || this.baseType == 'enum'); }

  /**
   * 与另外一个类型相比较，返回两个类型是否相同
   * @param otherType 另外一个类型对象
   */
  public equals(otherType : BlockParameterType|string) {
    if(otherType == null) return false;
    if(otherType == this) return true;
    if(typeof otherType == 'string') return otherType == this.getType();
    return this.baseType == otherType.baseType && this.customType == otherType.customType;
  }

  /**
   * 转为字符串，与 getType() 相同。
   */
  public toString() {
    return this.getType();
  }
}
