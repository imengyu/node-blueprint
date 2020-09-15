import { BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockParameterBaseType, BlockParameterType } from "../model/Define/Port";

export class ParamTypeService {
  private allCustomTypes : Map<string, BlockParameterTypeRegData> = new Map<string, BlockParameterTypeRegData>();

  public getAllCustomTypes() { return this.allCustomTypes; }
  public getAllBaseTypes() { return [ 'execute','boolean','bigint','number', 'string', 'function','object','any' ]; }
  public getTypeNameForUserMapping(name : string) { 
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
        if(this.allCustomTypes.has(name))
          return this.allCustomTypes.get(name).nameForUser;
        return '执行';
    }
    return name;
  }

  public isBaseType(name : string) {
    return this.getAllBaseTypes().indexOf(name) >= 0;
  }
  public getBaseTypeForCustomType(name : string) : BlockParameterBaseType {
    if(this.isBaseType(name)) return <BlockParameterBaseType>name;
    else {
      let c = this.getCustomType(name);
      return <BlockParameterBaseType>(c ? c.prototypeName : 'any');
    }
  }
  public createTypeFromString(name : string) : BlockParameterType {
    if(this.isBaseType(name))
      return new BlockParameterType(<BlockParameterBaseType>name);
    else 
      return new BlockParameterType(this.getBaseTypeForCustomType(name), name);
  }

  public init() {
    
  }

  public registerCustomType(reg : BlockParameterTypeRegData) {
    let old = this.getCustomType(reg.name);
    if(old != null) {
      console.warn("[registerCustomType] Type " + reg.name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.set(reg.name, reg);
    return reg;
  }
  public getCustomType(name : string) {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name);
    return null;
  }
  public unregisterCustomType(name : string) {
    if(!this.allCustomTypes.has(name))
      console.warn("[unregisterCustomType] Type " + name + " are not register !");
    this.allCustomTypes.delete(name);
  }

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
}

let ParamTypeServiceInstance = new ParamTypeService();

export default ParamTypeServiceInstance;