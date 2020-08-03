import { BlockParameterTypeRegData } from "../model/BlockDef";

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
}

let ParamTypeServiceInstance = new ParamTypeService();

export default ParamTypeServiceInstance;