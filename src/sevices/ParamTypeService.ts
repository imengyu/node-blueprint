import { BlockParameterTypeRegData } from "../model/Define/BlockDef";

export class ParamTypeService {
  public allCustomTypes : Array<BlockParameterTypeRegData> = [];

  public init() {
    
  }

  public registerCustomType(reg : BlockParameterTypeRegData) {
    let old = this.getCustomype(reg.name);
    if(old != null) {
      console.warn("[registerEnumType] Enum " + reg.name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.push(reg);
    return reg;
  }
  public getCustomype(name : string) {
    for(let i = 0, c = this.allCustomTypes.length; i < c; i++){
      if(this.allCustomTypes[i].name == name)
        return this.allCustomTypes[i];
    }
    return null;
  }
  public unregisterCustomType(name : string) {
    let old = this.getCustomype(name);
    if(old == null)
      console.warn("[unregisterCustomType] Enum " + name + " are not register !");

    this.allCustomTypes.remove(old);
  }

  public getTypeColor(name : string) {
    switch(name) {
      case 'boolean': return 'rgb(180,0,0)';
      case 'bigint': return 'rgb(0,168,243)';
      case 'number': return 'rgb(158,258,68)';
      case 'string': return 'rgb(255,20,147)';
      case 'function': return 'rgb(247,196,33)';
      case 'object': return 'rgb(0,160,232)';
      case 'any': return 'rgb(250,250,250)';
      default:
        return this.getCustomype(name).color;
    }
  }
}

let ParamTypeServiceInstance = new ParamTypeService();

export default ParamTypeServiceInstance;