import type { IKeyValueObject, ISaveableTypes } from "../Utils/BaseTypes";
import ObjectUtils from "../Utils/ObjectUtils";

const createObjectFactorys = new Map<string, CreateObjectClassCallback<any>>();

export type CreateObjectClassCallback<T> = (
  define: T,
  parent: SerializableObject<any>, 
) => SerializableObject<T>

/**
 * SerializableObject Object Creation Factory
 */
export const CreateObjectFactory = {
  /**
   * Add to factory
   * @param name Object Name
   * @param createFn Create callback
   */
  addObjectFactory<T>(name : string, createFn : CreateObjectClassCallback<T>) : void {
    createObjectFactorys.set(name, createFn);
  },
  /**
   * Create SerializableObject from data Object
   * @param name Object Name
   * @param k data Object
   * @returns 
   */
  createSerializableObject<T>(name : string, parent: SerializableObject<any>, k : T) : SerializableObject<T>|null {
    const objCreate = createObjectFactorys.get(name);
    if(objCreate) {
      const obj = objCreate(k, parent) as SerializableObject<T>;
      return obj.load(k);
    }
    return null;
  }
}

function mergeSerializableSchemeConfig(superConfig: SerializableSchemeConfig, childConfig: SerializableSchemeConfig) {
  return {
    ...superConfig,
    ...childConfig,
    serializableProperties: [
      ...(superConfig.serializableProperties || []),
      ...(childConfig.serializableProperties || []),
    ],
    noSerializableProperties: [
      ...(superConfig.noSerializableProperties || []),
      ...(childConfig.noSerializableProperties || []),
    ],
    serializePropertyOrder: {
      ...superConfig.serializePropertyOrder,
      ...childConfig.serializePropertyOrder,
    },
    forceSerializableClassProperties: {
      ...superConfig.forceSerializableClassProperties,
      ...childConfig.forceSerializableClassProperties,
    },
  }
}
export function mergeSerializableConfig<T = any>(superConfig: SerializableConfig<T>, childConfig: SerializableConfig<T>|undefined) : SerializableConfig<T>{
  if (!childConfig)
    return superConfig;
  const schemes : Record<string, SerializableSchemeConfig> = superConfig.serializeSchemes || {};
  if (childConfig.serializeSchemes)
    for (const key in childConfig.serializeSchemes) {
      const scheme = childConfig.serializeSchemes[key];
      if (schemes[key]) {
        schemes[key] = mergeSerializableSchemeConfig(schemes[key], scheme);
      } else {
        schemes[key] = scheme;
      }
    }
  return {
    ...superConfig,
    ...childConfig,
    ...mergeSerializableSchemeConfig(superConfig, childConfig),
    serializeSchemes: schemes,
  }
}

export interface SerializaeObjectSave<T> {
  [SerializableObjectSaveObjNameKey]: string,
  [SerializableObjectSaveObjObjKey]: T,
}
export interface SerializePropCustomRet {
  parsed: boolean,
  return?: unknown|undefined,
}
export interface SerializableSchemeConfig {
  /**
   * 是否是序列化所有属性
   */
  serializeAll?: boolean,
  /**
   * 属性的序列化顺序，默认顺序是0，小于0的属性会延后序列化，大于0的属性会优先序列化。
   * 此处规定的是保存时的顺序，加载时的顺序会自动反向。
   */
  serializePropertyOrder?: { [index: string]: number },
  /**
   * Properties that can be saved
   */
  serializableProperties?: string[],
  /**
   * Properties that can not be saved
   */
  noSerializableProperties?: string[],
  /**
   * Properties that need force load whith class, key is the Property name, value is class name.
   */
  forceSerializableClassProperties?: { [index: string]: string },
  /**
   * 自定义加载属性回调
   * @param key 键值
   * @param source 源值
   * @returns 
   */
  loadProp?: (key: string, parentKey: string, source: unknown) => SerializePropCustomRet|undefined,
  /**
   * 自定义保存属性回调
   * @param key 键值
   * @param source 源值
   * @returns 
   */
  saveProp?: (key: string, parentKey: string, source: unknown) => SerializePropCustomRet|undefined,
}
export interface SerializableConfig<T> extends SerializableSchemeConfig {
  /**
   * 序列化预设
   */
  serializeSchemes?: Record<string, SerializableSchemeConfig>,
  /**
   * 覆盖默认保存函数
   * @returns 
   */
  saveOverride?: () => IKeyValueObject;
  /**
   * 覆盖默认加载函数
   * @returns 
   */
  loadOverride?: (data : T) => SerializableObject<T>;
}

const SerializableObjectSaveObjNameKey = '@SNK';
const SerializableObjectSaveObjObjKey = '@SNO';
const SerializableObjectSaveMapKey = '@SNM';
const SerializableObjectSaveValueKey = '@SNV';
const SerializableObjectForceNoSerializeProps = [ 'define', 'serializeClassName', 'serializeConfig', 'TAG' ]

/**
 * Serializable Object. It can automatically recursively save class data or deserialize and load it.
 */
export class SerializableObject<T> {

  /**
   * Create SerializableObject
   * @param saveClassName Class name, same as object name when register in `addObjectFactory`.
   * @param define Inittal source data
   */
  constructor(className: string, define?: T, config?: SerializableConfig<T>) {
    this.serializeClassName = className;
    this.define = define || null;
    if (config) {
      if (!config.serializableProperties) 
        config.serializableProperties = [];
      config.noSerializableProperties = config.noSerializableProperties || [];
      this.serializeConfig = config;
    }
  }

  protected get TAG() {
    return 'SerializableObject:' + this.serializeClassName;
  }

  /**
   * Class name, same as object name when register in `addObjectFactory`.
   */
  serializeClassName = '';
  /**
   * Serialize config
   */
  serializeConfig : SerializableConfig<T> = {
    serializableProperties: [],
    noSerializableProperties: [],
  };
  /**
   * The source define data
   */
  define: T|null = null;
  
  protected saveProp(config: SerializableSchemeConfig, key: string, parentKey: string, element: unknown) : unknown {
    if (config.saveProp) {
      const ret = config.saveProp(key, parentKey, element);
      if (ret?.parsed)
        element = ret.return;
    }
    if (typeof element === 'bigint' 
      || typeof element === 'number' 
      || typeof element === 'boolean' 
      || typeof element === 'string'
    ) {
      return element as ISaveableTypes;
    }
    else if(element && typeof element === 'object') {
      if (element instanceof Array) {
        //This is array
        return {
          [SerializableObjectSaveObjNameKey]: 'Array',
          [SerializableObjectSaveObjObjKey]: element.map((src, index) => this.saveProp(config, `${key}[${index}]`, key, src)),
        } as SerializaeObjectSave<T>
      }
      else if (element instanceof Set) {
        //This is set
        const setArr = [];
        let index = 0;
        for (const src of element) {
          setArr.push(this.saveProp(config, `${key}[${index}]`, key, src));
          index++;
        }
        return {
          [SerializableObjectSaveObjNameKey]: 'Set',
          [SerializableObjectSaveObjObjKey]: setArr,
        } as SerializaeObjectSave<T>
      }
      else if (element instanceof Map) {
        //This is Map
        const arr = [];
        for (const [ mapKey, src ] of element)
          arr.push({
            [SerializableObjectSaveMapKey]: mapKey,
            [SerializableObjectSaveValueKey]: this.saveProp(config, `${key}[${mapKey}]`, key, src)
          });
        return {
          [SerializableObjectSaveObjNameKey]: 'Map',
          [SerializableObjectSaveObjObjKey]: arr,
        } as SerializaeObjectSave<T>
      }
      else if (element instanceof SerializableObject) {
        //This is a SerializableObject
        const serializableObject = element as unknown as SerializableObject<T>;
        if (
          typeof serializableObject.save === 'function'
          && typeof serializableObject.serializeClassName === 'string'
        ) 
          return {
            [SerializableObjectSaveObjNameKey]: serializableObject.serializeClassName,
            [SerializableObjectSaveObjObjKey]: serializableObject.save()
          } as SerializaeObjectSave<T>
      }
      else {
       return element;
      }
    }
    return undefined;
  }
  protected loadProp(config: SerializableSchemeConfig, key: string, parentKey: string, element: IKeyValueObject) : unknown {
    if (!key.startsWith('@') && config.loadProp) {
      const ret = config.loadProp(key, parentKey, element);
      if (ret?.parsed)
        return ret.return as IKeyValueObject;
    }
    if (typeof element === 'bigint'
      || typeof element === 'number'
      || typeof element === 'boolean'
      || typeof element === 'string'
      || typeof element === 'function'
    ) {
      return element;
    }
    else if (element && typeof element === 'object' && typeof element[SerializableObjectSaveObjNameKey] === 'string') {
      const { 
        [SerializableObjectSaveObjNameKey]: className,
        [SerializableObjectSaveObjObjKey]: obj, 
      } = element as unknown as SerializaeObjectSave<unknown>;
      switch (className) {
        case 'Array':
          return (obj as Array<IKeyValueObject>).map((v, index) => this.loadProp(config, `${key}[${index}]`, key, v));
        case 'Set': {
          const set = new Set();
          (obj as IKeyValueObject[]).forEach((v, index) => {
            set.add(this.loadProp(config, `${key}[${index}]`, key, v));
          });
          return set;
        } 
        case 'Map': {
          const map = new Map();
          (obj as {
            [SerializableObjectSaveMapKey]: string,
            [SerializableObjectSaveValueKey]: IKeyValueObject,
          }[]).forEach((v, index) => {
            map.set(v[SerializableObjectSaveMapKey], this.loadProp(config, `${key}[${index}]`, key, v[SerializableObjectSaveValueKey]));
          });
          return map;
        }
        default: {
          const forceSerializableClass = this.isForceSerializableClassProperty(key, parentKey);
          if (forceSerializableClass) 
            return CreateObjectFactory.createSerializableObject(forceSerializableClass, this, obj as any);
          if (typeof className === 'string' && typeof obj === 'object') 
            return CreateObjectFactory.createSerializableObject(className, this, obj as any);//This is a SerializableObject
          break;
        }
      }
    }
    else if (element && typeof element === 'object') {
      if (element instanceof Array) {
        return (element as Array<IKeyValueObject>).map((v, index) => this.loadProp(config, `${key}[${index}]`, key, v));
      } else {
        const forceSerializableClass = this.isForceSerializableClassProperty(key, parentKey);
        if (forceSerializableClass) 
          return CreateObjectFactory.createSerializableObject(forceSerializableClass, this, element as any);
        return element;
      }
    }

    return undefined;
  }

  private getSortedKeys(object: object, reverse = false) {
    let keys = Object.keys(object);
    if (this.serializeConfig.serializePropertyOrder) {
      const keyOrders = keys.map(key => {
        return {
          key,
          order: this.serializeConfig.serializePropertyOrder![key] * (reverse ? 1 : -1) || 0,
        }
      });
      keyOrders.sort((a, b) => a.order > b.order ? 1 : -1);
      keys = keyOrders.map(k => k.key);
    }
    return keys;
  }
  private isPropertySerializable(key: string, config: SerializableSchemeConfig) {
    if (SerializableObjectForceNoSerializeProps.includes(key))
      return false;
    return (
      (
        ((config.serializableProperties && config.serializableProperties.includes(key)) || config.serializeAll === true)
        && !(config.noSerializableProperties && config.noSerializableProperties.includes(key))
      )
    );
  }
  private isForceSerializableClassProperty(key: string, pkey: string) {
    return (
      this.serializeConfig.forceSerializableClassProperties?.[key] ||
      this.serializeConfig.forceSerializableClassProperties?.[pkey]
    );
  }

  /**
   * Save this object as a key value object.
   * @returns 
   */
  save<K = IKeyValueObject>(scheme?: string) : K {
    const saveOverride = this.serializeConfig.saveOverride;
    if (saveOverride) {
      this.serializeConfig.saveOverride = undefined;
      const ret = saveOverride();
      this.serializeConfig.saveOverride = saveOverride;
      return ret as unknown as K;
    }

    const config: SerializableSchemeConfig|undefined = scheme ? this.serializeConfig.serializeSchemes?.[scheme] : this.serializeConfig;
    if (!config)
      throw new Error("Not found scheme: " + scheme ? scheme : 'default');

    const o : IKeyValueObject = {}
    const keys = this.getSortedKeys(this, false);
    for (const key of keys) {
      if (!this.isPropertySerializable(key, config))
        continue;
      o[key] = this.saveProp(config, key, '', (this as unknown as Record<string, IKeyValueObject>)[key]) as ISaveableTypes;
    }
    return o as unknown as K;
  }
  /**
   * Load this object from the key value object.
   * @param data If empty, use define data provided in constructor
   * @returns Return this 
   */
  load(data ?: T, scheme?: string) : SerializableObject<T> {
    if (!data) 
      data = this.define as T;
    if (!data)
      throw new Error("Please provide data");

    const loadOverride = this.serializeConfig.loadOverride;
    if (loadOverride) {
      this.serializeConfig.loadOverride = undefined;
      const ret = loadOverride(data);
      this.serializeConfig.loadOverride = loadOverride;
      return ret;
    }
    const config: SerializableSchemeConfig|undefined = scheme ? this.serializeConfig.serializeSchemes?.[scheme] : this.serializeConfig;
    if (!config)
      throw new Error("Not found scheme: " + scheme ? scheme : 'default');

    this.define = data;
    const o : IKeyValueObject = this as unknown as IKeyValueObject;
    const keys = this.getSortedKeys(data as object, true);
    for (const key of keys) {
      if (!this.isPropertySerializable(key, config))
        continue;
      o[key] = this.loadProp(config, key, '', (data as unknown as Record<string, IKeyValueObject>)[key]) as IKeyValueObject;
    }
    return this;
  }
  /**
   * Load this object from the key value object but to a new object.
   * @param data If empty, use define data provided in constructor
   * @returns Return this 
   */
  loadShadow(data: T, scheme?: string) : IKeyValueObject {
    const config: SerializableSchemeConfig|undefined = scheme ? this.serializeConfig.serializeSchemes?.[scheme] : this.serializeConfig;
    if (!config)
      throw new Error("Not found scheme: " + scheme ? scheme : 'default');
    const o : IKeyValueObject = {} as unknown as IKeyValueObject;
    const keys = this.getSortedKeys(data as object, true);
    for (const key of keys) {
      if (!this.isPropertySerializable(key, config))
        continue;
      o[key] = this.loadProp(config, key, '', (data as unknown as Record<string, IKeyValueObject>)[key]) as IKeyValueObject;
    }
    return o;
  }
  /**
   * 将影子数据以追加方式合并至当前对象中
   * @param data 
   */
  mergeShadow(data: IKeyValueObject) {
    const o : IKeyValueObject = this as unknown as IKeyValueObject;
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const element = data[key];
        const thisEle = o[key];
        if (typeof element === 'object' && typeof thisEle === 'object') {
          if (element instanceof Map && thisEle instanceof Map) {
            o[key] = ObjectUtils.mergeMap(thisEle, element) as any;
          } else if (element instanceof Set && thisEle instanceof Set) {
            o[key] = ObjectUtils.mergeSet(thisEle, element) as any;
          } else if (element instanceof Array && thisEle instanceof Array) {
            o[key] = element.concat(thisEle);
          } else {
            o[key] = {
              ...(thisEle as IKeyValueObject),
              ...element
            };
          }
        } else {
          o[key] = element;
        }
      }
    }
  }

}

