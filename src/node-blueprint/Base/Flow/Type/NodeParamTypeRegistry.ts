import { EventHandler } from "../../Utils/Events/EventHandler";
import { printWarning } from "../../Logger/DevLog";
import { Singleton } from "../../Singleton/Singleton";
import { createEnumInternalEditor, registerInternalTypes } from "./NodeParamInternalTypes";
import { NodeParamType, type NodeParamTypeDefine } from "./NodeParamType";
import type { IKeyAnyObject } from "@imengyu/vue-dock-layout/lib/DockUtils";

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
  private allConverter : Map<string, NodeTypeCoverter> = new Map<string, NodeTypeCoverter>();

  /**
   * 获取所有类型
   */
  public getAllTypes() {
    return this.allTypes;
  }
  /**
   * 从字符串获取类型实例
   * @param defString 定义字符串
   * @returns 类型实例
   */
  public getTypeByString(defString: string) {
    return this.allTypes.get(defString) || null;
  }
  /**
   * 获取类型是否注册
   * @param defString 定义字符串
   * @returns 是否注册
   */
  public isTypeRegistered(defString: string) {
    return this.allTypes.has(defString);
  }
  /**
   * 重新创建类型的泛型然后重新注册
   * @param oldType 基础类
   * @param geneicTypes 泛型类参数，如果为空，则返回类型为空的泛型类型
   */
  public reRegisterNewGenericType(oldType: NodeParamType, geneicTypes: NodeParamType[]|null) {
    if (!geneicTypes || geneicTypes.length === 0)
      return this.getTypeByString(oldType.name);

    let mergedName = `${oldType.name}<`;
    for (let i = 0; i < geneicTypes.length; i++) {
      if (i > 0)
        mergedName += ',';
      if (geneicTypes[i] === undefined)
        mergedName += oldType.genericTypes[i].toString();
      else 
        mergedName += geneicTypes[i].toString();
    }
    mergedName += '>';

    const registeredType = this.getTypeByString(mergedName);
    if (registeredType)
      return registeredType;

    const baseType = this.getTypeByString(oldType.name);
    return this.registerType(mergedName, {
      ...baseType?.define as NodeParamTypeDefine,
      hiddenInChoosePanel: true,
      isCustomType: true,
    });
  }
  /**
   * 注册自定义类型
   * @param defString 类型定义字符串
   * @param define 类型数据
   * @param autoMergeGeneric 是否自动合并泛型数据，而不是创建一个新的类型，默认：true
   * @returns 
   */
  public registerType(defString : string, define : NodeParamTypeDefine, autoMergeGeneric = true) : NodeParamType {
    const old = this.getTypeByString(defString);
    if(old !== null && !define.hiddenInChoosePanel) {
      printWarning(TAG, "Type " + defString + " alreday registered !");
      return old;
    }

    const newType = new NodeParamType();
    newType.baseType = define.baseType;
    newType.inheritType = define.inheritType || null;
    newType.isCustomType = define.isCustomType === true;
    newType.define = define;

    const cotLeft = defString.indexOf('<');
    newType.name = cotLeft > 0 ? defString.substring(0, cotLeft) : defString;

    //处理泛型定义
    if (cotLeft > 0) {
      let cotIndex = 1, lastCotIndex = cotLeft + 1;
      const types : string[] = [];
      for (let i = cotLeft + 1; i < defString.length; i++) {
        if (defString.charAt(i) === '<') {
          cotIndex++;
        } else if (defString.charAt(i) === '>') {
          cotIndex--;
          if (cotIndex === 0)
            types.push(defString.substring(lastCotIndex, i));
        } else if (defString.charAt(i) === ',' && cotIndex === 1) {
          types.push(defString.substring(lastCotIndex, i));
          lastCotIndex = i + 1;
        }
      }
      if (cotIndex !== 0)
        throw new Error(`Bad type ${defString}, generic definition bracket error`);

      types.forEach((typeStr, i) => {
        const type = this.getTypeByString(typeStr);
        if (!type) 
          throw new Error(`Error when create type ${defString}, not found generic type ${typeStr} (pos ${i}).`);
        newType.genericTypes.push(type);
      });
    }

    this.allTypes.set(defString, newType);

    //合并泛型数据
    if (newType.isGeneric && autoMergeGeneric) {
      const pureType = this.getTypeByString(newType.name);
      if (pureType) {
        const define2 = newType.define as unknown as IKeyAnyObject;
        for (const key in pureType.define) {
          if (typeof define2[key] === 'undefined')
            define2[key] = (pureType.define as unknown as IKeyAnyObject)[key];
        }
        newType.hiddenInChoosePanel = true;
      }
    }

    //创建枚举类型的转换器
    if(newType.baseType === 'enum' && define.autoCreateEnumConverter)
      this.createEnumDefaultConverter(newType);
    //创建枚举编辑器
    if(newType.baseType === 'enum' && !define.typeEditor && newType.define.options)
      define.typeEditor = createEnumInternalEditor(newType.define.options as string[]);

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
   * 创建枚举类型的转换器，
   * 默认支持 ：
   * * 字符串转换 string->enum /enum->string
   * * 索引转换 number->enum /enum->number
   */
  private createEnumDefaultConverter(newType: NodeParamType) {
    this.registerTypeCoverter({
      fromType: NodeParamType.String,
      toType: newType,
      converter(source) { return source; },
    });
    this.registerTypeCoverter({
      fromType: NodeParamType.Number,
      toType: newType,
      converter(source) {
        if (newType.define?.options)
          return newType.define.options[source]; 
        return null;
      },
    });
    this.registerTypeCoverter({
      fromType: newType,
      toType: NodeParamType.String,
      converter(source) { return source; },
    });
    this.registerTypeCoverter({
      fromType: newType,
      toType: NodeParamType.Number,
      converter(source) { 
        if (newType.define?.options)
          return newType.define.options.indexOf(source); 
        return 0;
      },
    });
  }

  /**
   * 获取类型转换器
   * @param fromType 源类型
   * @param toType 目标类型
   * @returns 
   */
  public getTypeCoverter(fromType: NodeParamType, toType: NodeParamType) : NodeTypeCoverter|null {
    if(fromType.isExecute || toType.isExecute) 
      return null;
    const from = fromType.toString();
    const to = toType.toString();
    return this.allConverter.get(from + '-' + to) || null;
  }
  /**
   * 注册类型转换器
   * @param options 
   */
  public registerTypeCoverter(converter: NodeTypeCoverter) {
    const key = converter.fromType.toString() + '-' + converter.toType.toString();
    this.allConverter.set(key, converter)
    return key;
  }
  /**
   * 注册类型转换器
   * @param key 注册时返回的键
   */
  public unRegisterTypeCoverter(key: string) {
    this.allConverter.delete(key);
  }

  /**
   * 当系统类型注册或者移除时触发次事件
   */
  public onTypeChanged = new EventHandler<(act : 'add'|'remove', typeName ?: string, reg ?: NodeParamTypeDefine) => void>();
}

export interface NodeTypeCoverter {
  /**
   * 源类型
   */
  fromType : NodeParamType,
  /**
   * 目标类型
   */
  toType : NodeParamType,
  /**
   * 
   * @param source 转换器函数
   * @returns 
   */
  converter : (source : any) => any;
}