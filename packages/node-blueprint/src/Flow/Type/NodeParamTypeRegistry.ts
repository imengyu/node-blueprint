import { EventHandler } from "@/Utils/Events/EventHandler";
import { printWarning } from "@/Utils/Logger/DevLog";
import { Singleton } from "@/Utils/Singleton/Singleton";
import { NodeParamTypeDefine } from "./NodeParamType";

const TAG = 'NodeParamTypeRegistry';

/**
 * Type registry, Registration for custom types
 */
export class NodeParamTypeRegistry extends Singleton {
  
  constructor() {
    super(TAG);
  }
  static getInstance() {
    return Singleton.getSingletonInstance(TAG) as NodeParamTypeRegistry;
  }

  private allCustomTypes : Map<string, NodeParamTypeDefine> = new Map<string, NodeParamTypeDefine>();

  /**
   * 注册自定义类型
   * @param reg 类型数据
   */
  public registerCustomType(name : string, reg : NodeParamTypeDefine) : NodeParamTypeDefine {
    const old = this.getCustomType(name);
    if(old != null) {
      printWarning("registerCustomType", "Type " + name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.set(name, reg);
    if(reg.prototypeName == 'enum' && reg.autoCreateEnumConverter) 
      this.registerTypeCoverter({
        fromType: new BluePrintParamType('string'),
        toType: new BluePrintParamType('enum', name),
        converter: {}
      });
    this.onTypeChanged.invoke('add', name, reg);
    return reg;
  }
  
  /**
   * 注册自定义类型
   * @param reg 类型数据
   */
  public registerCustomType(name : string, reg : NodeParamTypeDefine) : NodeParamTypeDefine {
    const old = this.getCustomType(name);
    if(old != null) {
      printWarning("registerCustomType", "Type " + name + " alreday registered !");
      return old;
    }
    this.allCustomTypes.set(name, reg);
    if(reg.prototypeName == 'enum' && reg.autoCreateEnumConverter) 
      this.registerTypeCoverter({
        fromType: new BluePrintParamType('string'),
        toType: new BluePrintParamType('enum', name),
        converter: {}
      });
    this.onTypeChanged.invoke('add', name, reg);
    return reg;
  }
  /**
   * 获取已经注册的自定义类型
   * @param name 类型名称
   */
  public getCustomType(name : string) : NodeParamTypeDefine|null {
    if(this.allCustomTypes.has(name))
      return this.allCustomTypes.get(name) || null;
    return null;
  }
  /**
   * 取消注册自定义类型
   * @param name 类型名称
   */
  public unregisterCustomType(name : string) : void {
    if(!this.allCustomTypes.has(name)) {
      printWarning("unregisterCustomType", "Type " + name + " are not register !");
      return;
    }
    this.allCustomTypes.delete(name);
    this.onTypeChanged.invoke('remove', name);
  }
  public onTypeChanged = new EventHandler<(act : 'add'|'remove', typeName ?: string, reg ?: NodeParamTypeDefine) => void>();


}