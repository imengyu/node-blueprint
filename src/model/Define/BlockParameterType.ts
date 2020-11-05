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
 */
export class BlockParameterType {

  public baseType : BlockParameterBaseType = 'any';
  public customType = '';

  public constructor(baseType : BlockParameterBaseType, customType = '') {
    this.set(baseType, customType);
  }

  public static createTypeFromString(name : string) : BlockParameterType {
    if(name == 'any')
      return BlockParameterType.Any();
    if(ParamTypeServiceInstance.isBaseType(name))
      return new BlockParameterType(<BlockParameterBaseType>name);
    return new BlockParameterType(ParamTypeServiceInstance.getBaseTypeForCustomType(name), name);
  }

  public static Any() { return new BlockParameterType('any') };

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
  public getType() { return this.isCustom() ? this.customType : this.baseType; }
  public isExecute() { return this.baseType == 'execute'; }
  public isAny() { return this.baseType == 'any'; }
  public isCustom() { return (this.baseType == 'custom' || this.baseType == 'enum'); }
  public equals(otherType : BlockParameterType|string) {
    if(otherType == null) return false;
    if(otherType == this) return true;
    if(typeof otherType == 'string') return otherType == this.getType();
    return this.baseType == otherType.baseType && this.customType == otherType.customType;
  }

  public toString() {
    return this.getType();
  }
}
