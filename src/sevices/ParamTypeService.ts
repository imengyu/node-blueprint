import { BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockParameterType } from "../model/Define/Port";

export class ParamTypeService {
  private allCustomTypes : Array<BlockParameterTypeRegData> = [];

  public getAllCustomTypes() { return this.allCustomTypes; }
  public getAllBaseTypes() { return [ 'execute','boolean','bigint','number', 'string', 'function','object','any' ]; }

  public isBaseType(name : string) {
    return this.getAllBaseTypes().indexOf(name) >= 0;
  }
  public getBaseTypeForCustomType(name : string) : BlockParameterType {
    if(this.isBaseType(name)) return <BlockParameterType>name;
    else {
      let c = this.getCustomType(name);
      return <BlockParameterType>(c ? c.prototypeName : 'any');
    }
  }

  public init() {
    
  }

  public registerCustomType(reg : BlockParameterTypeRegData) {
    let old = this.getCustomType(reg.name);
    if(old != null) {
      console.warn("[registerCustomType] Type " + reg.name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.push(reg);
    return reg;
  }
  public getCustomType(name : string) {
    for(let i = 0, c = this.allCustomTypes.length; i < c; i++){
      if(this.allCustomTypes[i].name == name)
        return this.allCustomTypes[i];
    }
    return null;
  }
  public unregisterCustomType(name : string) {
    let old = this.getCustomType(name);
    if(old == null)
      console.warn("[unregisterCustomType] Type " + name + " are not register !");

    this.allCustomTypes.remove(old);
  }

  public getCustomTypeEditor(name : string) {
    for(let i = 0, c = this.allCustomTypes.length; i < c; i++){
      if(this.allCustomTypes[i].name == name)
        return this.allCustomTypes[i].editor;
    }
    return null;
  }
  public getTypeColor(name : string) {
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
        return type ? type.color : 'rgb(250,250,250)';
    }
  }
}

let ParamTypeServiceInstance = new ParamTypeService();

export default ParamTypeServiceInstance;