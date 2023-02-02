import { EventHandler } from "../../Utils/Events/EventHandler";
import { printError, printWarning } from "../../Utils/Logger/DevLog";
import { Singleton } from "../../Utils/Singleton/Singleton";
import { registerInternalTypes } from "./NodeParamInternalTypes";
import { NodeParamType, type NodeParamTypeDefine } from "./NodeParamType";

const TAG = 'NodeParamTypeRegistry';

/**
 * 类型注册中心
 */
export class NodeParamTypeRegistry extends Singleton {
  
  constructor() {
    super(TAG);
    registerInternalTypes(this);
  }
  static getInstance() {
    return Singleton.getSingletonInstance(TAG) as NodeParamTypeRegistry;
  }

  private allTypes : Map<string, NodeParamType> = new Map<string, NodeParamType>();

  /**
   * 从字符串获取类型实例
   * @param defString 定义字符串
   * @returns 类型实例
   */
  public getTypeByString(defString: string) {
    return this.allTypes.get(defString) || null;
  }
  /**
   * 注册自定义类型
   * @param reg 类型数据
   */
  public registerType(defString : string, define : NodeParamTypeDefine) : NodeParamType {
    const old = this.getTypeByString(defString);
    if(old != null) {
      printWarning(TAG, "Type " + defString + " alreday registered !");
      return old;
    }

    const newType = new NodeParamType();
    newType.baseType = define.baseType;
    newType.inheritType = define.inheritType;
    newType.define = define;

    const cotLeft = defString.indexOf('<');
    const cotRight = defString.lastIndexOf('>');

    newType.name = cotLeft > 0 ? defString.substring(0, cotLeft) : defString;

    //处理泛型定义
    if (cotLeft > 0) {
      if (cotRight < cotLeft)
        throw new Error(`Bad type ${defString}, generic definition bracket error`);
      const genericTypesStr = defString.substring(cotLeft, cotRight);
      genericTypesStr.split(',').forEach((typeStr, i) => {
        const type = this.getTypeByString(typeStr);
        if (!type) 
          throw new Error(`Error when create type ${defString}, not found generic type ${typeStr} (pos ${i}).`);
        newType.genericTypes.push(type);
      });
    }

    this.allTypes.set(defString, newType);

    if(newType.baseType == 'enum' && define.autoCreateEnumConverter) {
      //TODO: CreateEnumConverter
    }

    this.onTypeChanged.invoke('add', defString, newType);
    return newType;
  }
  /**
   * 取消注册自定义类型
   * @param name 类型名称
   */
  public unregisterType(name : string) : void {
    if(!this.allTypes.has(name)) {
      printWarning(TAG, "Type " + name + " are not register !");
      return;
    }
    this.allTypes.delete(name);
    this.onTypeChanged.invoke('remove', name);
  }

  /**
   * 当系统类型注册或者移除时触发次事件
   */
  public onTypeChanged = new EventHandler<(act : 'add'|'remove', typeName ?: string, reg ?: NodeParamTypeDefine) => void>();
}