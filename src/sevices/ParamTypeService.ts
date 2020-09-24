import { BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockParameterBaseType, BlockParameterType } from "../model/Define/BlockParameterType";
import CommonUtils from "../utils/CommonUtils";
import { EventHandler, VoidDelegate } from "../utils/EventHandler";

export class ParamTypeService {
  private allCustomTypes : Map<string, BlockParameterTypeRegData> = new Map<string, BlockParameterTypeRegData>();

  public getAllCustomTypes() { return this.allCustomTypes; }
  public getAllBaseTypes() { return [ 'execute','boolean','bigint','number', 'string', 'function','object','any' ]; }
  public getBaseTypeForCustomType(name : string) : BlockParameterBaseType {
    if(this.isBaseType(name)) return <BlockParameterBaseType>name;
    else {
      let c = this.getCustomType(name);
      return <BlockParameterBaseType>(c ? c.prototypeName : 'any');
    }
  }
  public isBaseType(name : string) {
    return this.getAllBaseTypes().indexOf(name) >= 0;
  }

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
  public init() {
    
  }

  //类型注册
  //======================

  public registerCustomType(reg : BlockParameterTypeRegData) {
    let old = this.getCustomType(reg.name);
    if(old != null) {
      console.warn("[registerCustomType] Type " + reg.name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.set(reg.name, reg);
    this.onTypeChanged.invoke('add', reg.name, reg);
    return reg;
  }
  public getCustomType(name : string) {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name);
    return null;
  }
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

  public getCustomTypeEditor(name : string) {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name).editor;
    return null;
  }
  public getTypeColor(name : string, defaultColor ?: string) {
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
  public getTypeDefaultValue(type : BlockParameterType) {
    switch(type.baseType) {
      case 'execute': return undefined;
      case 'boolean': return false;
      case 'bigint': return 0;
      case 'number': return 0;
      case 'string': return '';
      default:
        return null;
    }
  }
  public getTypeNameForUserMapping(name : string) { 
    if(CommonUtils.isNullOrEmpty(name))
      return '未定义';
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