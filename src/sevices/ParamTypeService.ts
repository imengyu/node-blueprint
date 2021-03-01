import { BlockParameterTypeConverterData, BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockParameterBaseType, BlockParameterType, createParameterTypeFromString } from "../model/Define/BlockParameterType";
import CommonUtils from "../utils/CommonUtils";
import { EventHandler } from "../utils/EventHandler";
import StringUtils from "../utils/StringUtils";

/**
 * 类型服务，用于管理系统中的数据类型
 */
export class ParamTypeService {
  private allCustomTypes : Map<string, BlockParameterTypeRegData> = new Map<string, BlockParameterTypeRegData>();
  private allTypeConverter = new Map<string, 
    Map<string, BlockParameterTypeConverterData>
  >();

  /**
   * 获取所有自定义类型
   */
  public getAllCustomTypes() { return this.allCustomTypes; }
  /**
   * 获取所有的基础类型
   */
  public getAllBaseTypes() { return [ 'execute','boolean','bigint','number', 'string', 'function','object','any' ]; }
  /**
   * 获取指定名称自定义类型的基础类型
   * @param name 自定义类型名称
   */
  public getBaseTypeForCustomType(name : string) : BlockParameterBaseType {
    if(this.isBaseType(name)) return <BlockParameterBaseType>name;
    else {
      let c = this.getCustomType(name);
      return <BlockParameterBaseType>(c ? c.prototypeName : 'any');
    }
  }
  /**
   * 获取类型是不是基础类型
   * @param name 类型名称
   */
  public isBaseType(name : string) {
    return this.getAllBaseTypes().indexOf(name) >= 0;
  }

  /**
   * 检查这个类型能不能用来作为集合的键
   * @param name 类型名称
   */
  public checkTypeCanBeDictionaryKey(name : string) {
    switch(name) {
      case 'any':
      case 'number':
      case 'bigint': 
      case 'enum':
      case 'string': return true;
      case 'custom':
      default:
        let type = ParamTypeServiceInstance.getCustomType(name);
        if(type && typeof type.getHashCode == 'function') 
          return true;
    }
    return false;
  }

  /**
   * 初始化
   */
  public init() {
    
  }

  //类型转换注册
  //======================

  /**
   * 注册类型转换器
   * @param reg 类型转换器
   */
  public registerTypeCoverter(reg : BlockParameterTypeConverterData) {

    let from = reg.fromType.toString();
    let to = reg.toType.toString();

    let typeChild = this.allTypeConverter.get(from);
    if(typeChild == null) {
      typeChild = new Map<string, BlockParameterTypeConverterData>();
      this.allTypeConverter.set(from, typeChild);
    }

    typeChild.set(to, reg);
  }
  /**
   * 取消注册类型转换器
   * @param reg 类型转换器
   */
  public unregisterTypeCoverter(reg : BlockParameterTypeConverterData) {

    let from = reg.fromType.toString();
    let to = reg.toType.toString();

    let typeChild = this.allTypeConverter.get(from);
    if(typeChild == null) 
      return;

    let target = typeChild.get(to);
    if(target != null) 
      typeChild.delete(to);
  }
  /**
   * 获取已经注册的类型转换器
   * @param fromType 源类型
   * @param toType 要转为的类型
   */
  public getTypeCoverter(fromType : BlockParameterType, toType : BlockParameterType) {
    let from = fromType.toString();
    let to = toType.toString();
    let typeChild = this.allTypeConverter.get(from);
    if(typeChild == null) 
      typeChild = this.allTypeConverter.get('any');
    if(typeChild)
      return typeChild.get(to);
    return null;
  }

  //类型注册
  //====================== 

  /**
   * 注册自定义类型
   * @param reg 类型数据
   */
  public registerCustomType(reg : BlockParameterTypeRegData) {
    let old = this.getCustomType(reg.name);
    if(old != null) {
      console.warn("[registerCustomType] Type " + reg.name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.set(reg.name, reg);
    if(reg.prototypeName == 'enum' && reg.autoCreateEnumConverter) 
      this.registerTypeCoverter({
        fromType: createParameterTypeFromString('string'),
        toType: createParameterTypeFromString(reg.name),
        converter: (v : any) => v,
        allowSetType: 'variable',
      });
    this.onTypeChanged.invoke('add', reg.name, reg);
    return reg;
  }
  /**
   * 获取已经注册的自定义类型
   * @param name 类型名称
   */
  public getCustomType(name : string) {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name);
    return null;
  }
  /**
   * 取消注册自定义类型
   * @param name 类型名称
   */
  public unregisterCustomType(name : string) {
    if(!this.allCustomTypes.has(name)) {
      console.warn("[unregisterCustomType] Type " + name + " are not register !");
      return;
    }
    this.allCustomTypes.delete(name);
    this.onTypeChanged.invoke('remove', name);
  }
  public onTypeChanged = new EventHandler<(act : 'add'|'remove', typeName ?: string, reg ?: BlockParameterTypeRegData) => void>();

  //类型信息
  //======================

  /**
   * 获取自定义类型的自定义编辑器
   * @param name 类型名称
   */
  public getCustomTypeEditor(name : string) {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name).editor;
    return null;
  }
  /**
   * 获取类型的颜色
   * @param name 类型名称或类型对象
   * @param defaultColor 
   */
  public getTypeColor(name : string | BlockParameterType, defaultColor ?: string) {
    if(StringUtils.isNullOrEmpty(name))
      return defaultColor;
    if(typeof name === 'object')
      name = name.toString();
    switch(name) {
      case 'execute': return 'rgb(246,246,246)';
      case 'boolean': return 'rgb(180,0,0)';
      case 'bigint': return 'rgb(0,168,243)';
      case 'number': return 'rgb(158,258,68)';
      case 'string': return 'rgb(255,20,147)';
      case 'function': return 'rgb(247,196,33)';
      case 'object': return 'rgb(0,160,232)';
      case 'any': return 'rgb(250,250,250)';
      default:
        let type = this.getCustomType(name);
        return type ? type.color : (defaultColor ? defaultColor : 'rgb(250,250,250)');
    }
  }
  /**
   * 获取类型的默认值
   * @param type 类型对象
   */
  public getTypeDefaultValue(type : BlockParameterType) {
    switch(type.baseType) {
      case 'execute': return undefined;
      case 'boolean': return false;
      case 'bigint': return 0;
      case 'number': return 0;
      case 'string': return '';
      case 'custom':
      default:
        let customType = ParamTypeServiceInstance.getCustomType(type.customType);
        if(customType && typeof customType.createDefaultValue == 'function') 
          return customType.createDefaultValue();
    }
    return undefined;
  }
  /**
   * 获取对用户友好的类型名称
   * @param name 类型名称或类型对象
   */
  public getTypeNameForUserMapping(name : string | BlockParameterType) { 
    if(CommonUtils.isNullOrEmpty(name))
      return '未定义';
    if(typeof name === 'object')
      name = name.toString();
    switch(name) {
      case 'execute': return '执行';
      case 'any': return '通配符';
      case 'boolean': return '布尔';
      case 'bigint': return '大整数';
      case 'number': return '数字';
      case 'string': return '字符串';
      case 'function': return '函数';
      case 'object': return '对象';
      case 'custom': 
      case 'enum': 
        if(this.allCustomTypes.has(name)){
          let n = this.allCustomTypes.get(name).nameForUser;
          if(!CommonUtils.isNullOrEmpty(n))
            return n;
        }
        return '执行';
    }
    return name;
  }
}

let ParamTypeServiceInstance = new ParamTypeService();

export default ParamTypeServiceInstance;