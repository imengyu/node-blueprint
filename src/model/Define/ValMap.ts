import ParamTypeServiceInstance from "../../sevices/ParamTypeService";
import { BlockParameterType } from "./Port";

export class ValMap {

  public constructor(keyType : BlockParameterType, valType : BlockParameterType) {
    this.keyType = keyType;
    this.valType = valType;

    switch(keyType.baseType) {
      case 'number': this.map = new Map<number, any>(); break;
      case 'bigint': this.map = new Map<bigint, any>(); break;
      case 'enum':
      case 'string': this.map = new Map<string, any>(); break;
      case 'custom':
        let type = ParamTypeServiceInstance.getCustomType(keyType.customType);
        if(type && typeof type.getHashCode == 'function') {
          this.map = new Map<string, any>(); 
          this.isUseKeyRemap = true;
        }
        break;
    }

  }

  public created() {
    return this.map != null;
  }
  public clear() {
    this.map.clear();
  }
  public delete(key) : boolean {
    if(this.isUseKeyRemap) key = key.getHashCode(key);
    return this.map.delete(key);
  }
  public get(key) {
    if(this.isUseKeyRemap) key = key.getHashCode(key);
    return this.map.get(key);
  }
  public has(key): boolean {
    if(this.isUseKeyRemap) key = key.getHashCode(key);
    return this.map.has(key);
  }
  public set(key, value) {
    if(this.isUseKeyRemap) key = key.getHashCode(key);
    this.map.set(key, value);
    return this;
  }

  public useKeyHashCode() {
    return this.isUseKeyRemap;
  }

  private isUseKeyRemap = false;

  public map : Map<any, any> = null;
  public keyType : BlockParameterType = null;
  public valType : BlockParameterType = null;
}