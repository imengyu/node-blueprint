import type { IKeyValueObject, ISaveableTypes } from "../Utils/BaseTypes";
import ObjectUtils from "../Utils/ObjectUtils";
import type { IChildObject } from "./IChildObject";
import type { ICloneable } from "./ICloneable";

const createObjectFactorys = new Map<string, CreateObjectClassCallback<any, any>>();

export type CreateObjectClassCallback<T, P> = (
  define: T,
  parent: P, 
) => SerializableObject<T, P>

/**
 * SerializableObject Object Creation Factory
 */
export const CreateObjectFactory = {
  /**
   * Add to factory
   * @param name Object Name
   * @param createFn Create callback
   */
  addObjectFactory<T, P>(name : string, createFn : CreateObjectClassCallback<T, P>) : void {
    createObjectFactorys.set(name, createFn);
  },
  /**
   * Create SerializableObject from data Object
   * @param name Object Name
   * @param k data Object
   * @returns 
   */
  createSerializableObject<T, P>(name : string, parent: P|null, k ?: T|null) : SerializableObject<T, P>|null {
    const objCreate = createObjectFactorys.get(name);
    if(objCreate) {
      const obj = objCreate(k, parent) as SerializableObject<T, P>;
      if (typeof k !== 'undefined' && k !== null)
        return obj.load(k);
      return obj;
    }
    return null;
  }
}

function mergeSerializableSchemeConfig(superConfig: SerializableSchemeConfig, childConfig: SerializableSchemeConfig) : SerializableSchemeConfig {
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
export function mergeSerializableConfig<T = any, P = any>(superConfig: SerializableConfig<T, P>, childConfig: SerializableConfig<T, P>|undefined) : SerializableConfig<T, P>{
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
    serializeSchemes: schemes,
  }
}

export interface SerializaeObjectSave<T> {
  [SerializableObjectSaveObjNameKey]: string,
  [SerializableObjectSaveObjObjKey]: T,
}
export interface SerializePropCustomRet {
  /**
   * 指定当前回调是否已处理数据，设置为 true，则不进行默认序列化。
   */
  parsed: boolean,
  /**
   * 在加载序列化数组、集合时，是否忽略此返回值，如果是，则不加入当前条目至数组、集合。默认：false
   */
  ignore?: boolean,
  /**
   * 设置当前回调已处理数据。
   */
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
   * 表示当前序列化配置继承指定名称的配置。注意，不能循环引用。
   */
  inhertForm?: string;
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
  
  /**
   * 单个属性加载之后回调
   * @returns 
   */
  afterPropertyLoad?: (key: string) => void,
  /**
   * 整个对象加载之前回调
   * @returns 
   */
  beforeLoad?: (data: unknown) => void,
  /**
   * 加载之后回调
   * @returns 
   */
  afterLoad?: () => void,
  /**
   * 加载之前回调
   * @returns 
   */
  beforeSave?: () => void,
  /**
   * 加载之后回调
   * @returns 
   */
  afterSave?: (data: unknown) => void,
}
export interface SerializableConfig<T, P = unknown> {
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
  loadOverride?: (data : T) => SerializableObject<T, P>;
  /**
   * 覆盖默认混合函数
   * @returns 
   */
  mergeOverride?: (keyName: string, thisData : unknown, fromData : unknown) =>  SerializePropCustomRet|undefined,
  /**
   * load\merge 之后回调
   * @returns 
   */
  afterLoadOrMerge?: () => void,
}
export const SerializableObjectLoadIgnore = Symbol('LoadIgnore');
export const SerializableObjectPureObjName = 'PureObject';
const SerializableObjectSaveObjNameKey = '@SNK';
const SerializableObjectSaveObjObjKey = '@SNO';
const SerializableObjectSaveMapKey = '@SNM';
const SerializableObjectSaveValueKey = '@SNV';
const SerializableObjectForceNoSerializeProps = [ 'define', 'serializeClassName', 'serializeConfig', 'TAG' ]

/**
 * Serializable Object. It can automatically recursively save class data or deserialize and load it.
 */
export class SerializableObject<T, P = unknown> implements IChildObject<P>, ICloneable {

  /**
   * Create SerializableObject
   * @param saveClassName Class name, same as object name when register in `addObjectFactory`.
   * @param define Inittal source data
   */
  constructor(className: string, define?: T, config?: SerializableConfig<T, P>) {
    this.serializeClassName = className;
    this.define = define || null;
    if (config)
      this.serializeConfig = config;
  }

  /**
   * Parent object
   */
  parent: P|null = null;

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
  serializeConfig : SerializableConfig<T, P> = {};
  /**
   * The source define data
   */
  define: T|null = null;
  
  protected saveProp(config: SerializableSchemeConfig, key: string, parentKey: string, element: unknown) : unknown {
    
    if (key === 'customSize')
    console.log('!');
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
        const serializableObject = element as unknown as SerializableObject<T, P>;
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
        const forceSerializableClass = this.isForceSerializableClassProperty(config, key, parentKey);
        if (forceSerializableClass === SerializableObjectPureObjName) {
          //Serializable object keys
          const saveObject : IKeyValueObject = {};
          for (const skey in element) {
            if (Object.prototype.hasOwnProperty.call(element, skey)) {
              const selement = (element as IKeyValueObject)[skey];
              saveObject[skey] = this.saveProp(config, `${key}.${skey}`, key, selement) as ISaveableTypes;
            }
          }
          return saveObject;
        }
        return element;
      }
    }
    return undefined;
  }
  protected loadProp(config: SerializableSchemeConfig, key: string, parentKey: string, element: IKeyValueObject) : unknown {
   
    if (!key.startsWith('@') && config.loadProp) {
      const ret = config.loadProp(key, parentKey, element);
      if (ret?.ignore)
        return SerializableObjectLoadIgnore;
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
        case 'Array': {
          const arr = new Array();
          (obj as IKeyValueObject[]).forEach((v, index) => {
            const data = this.loadProp(config, `${key}[${index}]`, key, v);
            if (data !== SerializableObjectLoadIgnore)
              arr.push(data);
          });
          return arr;
        }
        case 'Set': {
          const set = new Set();
          (obj as IKeyValueObject[]).forEach((v, index) => {
            const data = this.loadProp(config, `${key}[${index}]`, key, v);
            if (data !== SerializableObjectLoadIgnore)
              set.add(data);
          });
          return set;
        } 
        case 'Map': {
          const map = new Map();
          (obj as {
            [SerializableObjectSaveMapKey]: string,
            [SerializableObjectSaveValueKey]: IKeyValueObject,
          }[]).forEach((v, index) => {
            const data = this.loadProp(config, `${key}[${index}]`, key, v[SerializableObjectSaveValueKey]);
            if (data !== SerializableObjectLoadIgnore)
              map.set(v[SerializableObjectSaveMapKey], data);
          });
          return map;
        }
        default: {
          const forceSerializableClass = this.isForceSerializableClassProperty(config, key, parentKey);
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
        const forceSerializableClass = this.isForceSerializableClassProperty(config, key, parentKey);
       
        if (forceSerializableClass === SerializableObjectPureObjName) {
          //Load object every Keys
          const saveObject : IKeyValueObject = {};
          for (const skey in element) {
            if (Object.prototype.hasOwnProperty.call(element, skey)) {
              const selement = element[skey];
              saveObject[skey] = this.loadProp(config, `${key}.${skey}`, key, selement as IKeyValueObject) as ISaveableTypes;
            }
          }
          return saveObject;
        }
        if (forceSerializableClass) 
          return CreateObjectFactory.createSerializableObject(forceSerializableClass, this, element as any);
        
        return element;
      }
    }

    return undefined;
  }

  private getSerializeScheme(scheme: string, inhertCheck?: string[]) : SerializableSchemeConfig {
    let config: SerializableSchemeConfig|undefined =  this.serializeConfig.serializeSchemes?.[scheme];
    if (!config && scheme === 'default')
      config = {
        serializableProperties: [],
        noSerializableProperties: [],
      };
    if (!config)
      throw new Error("Not found scheme: " + scheme);
    if (config.inhertForm) {
      if (!inhertCheck)
        inhertCheck = [ scheme ];
      else {
        if (inhertCheck.includes(config.inhertForm))
          throw new Error("SerializableSchemeConfig inhertForm circular reference: " + inhertCheck.join('->'));
        inhertCheck.push(scheme);
      }
      return mergeSerializableSchemeConfig(
        this.getSerializeScheme(config.inhertForm, inhertCheck) as SerializableSchemeConfig, 
        config
      ) as SerializableSchemeConfig;
    }
    
    return config; 
  }
  private getSortedKeys(config: SerializableSchemeConfig, object: object, reverse = false) {
    let keys = Object.keys(object);
    if (config.serializePropertyOrder) {
      const keyOrders = keys.map(key => {
        return {
          key,
          order: config.serializePropertyOrder![key] * (reverse ? 1 : -1) || 0,
        }
      });
      keyOrders.sort((a, b) => a.order > b.order ? 1 : -1);
      keys = keyOrders.map(k => k.key);
    }
    return keys;
  }
  private isPropertySerializable(config: SerializableSchemeConfig, key: string) {
    if (SerializableObjectForceNoSerializeProps.includes(key))
      return false;
    return (
      (
        ((config.serializableProperties && config.serializableProperties.includes(key)) || config.serializeAll === true)
        && !(config.noSerializableProperties && config.noSerializableProperties.includes(key))
      )
    );
  }
  private isForceSerializableClassProperty(config: SerializableSchemeConfig, key: string, pkey: string) {
    return (
      config.forceSerializableClassProperties?.[key] ||
      config.forceSerializableClassProperties?.[pkey]
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

    const config = this.getSerializeScheme(scheme || 'default');
    config.beforeSave?.();

    const o : IKeyValueObject = {}
    const keys = this.getSortedKeys(config, this, false);
    for (const key of keys) {
      if (!this.isPropertySerializable(config, key))
        continue;
      o[key] = this.saveProp(config, key, '', (this as unknown as Record<string, IKeyValueObject>)[key]) as ISaveableTypes;
    }

    config.afterSave?.(o);

    return o as unknown as K;
  }
  /**
   * Load this object from the key value object.
   * @param data If empty, use define data provided in constructor
   * @returns Return this 
   */
  load(data ?: T, scheme?: string) : this {
    if (!data) 
      data = this.define as T;
    if (!data)
      throw new Error("Please provide data");

    const loadOverride = this.serializeConfig.loadOverride;
    if (loadOverride) {
      this.serializeConfig.loadOverride = undefined;
      const ret = loadOverride(data);
      this.serializeConfig.loadOverride = loadOverride;
      this.serializeConfig.afterLoadOrMerge?.();
      return ret as typeof this;
    }

    const config = this.getSerializeScheme(scheme || 'default');
    config.beforeLoad?.(data);

    this.define = data;
    const o : IKeyValueObject = this as unknown as IKeyValueObject;
    const keys = this.getSortedKeys(config, data as object, true);
    for (const key of keys) {
      if (!this.isPropertySerializable(config, key))
        continue;
      o[key] = this.loadProp(config, key, '', (data as unknown as Record<string, IKeyValueObject>)[key]) as IKeyValueObject;
      config.afterPropertyLoad?.(key);
    }

    this.serializeConfig.afterLoadOrMerge?.();
    config.afterLoad?.();

    return this;
  }
  /**
   * Load this object from the key value object but to a new object.
   * @param data If empty, use define data provided in constructor
   * @returns Return this 
   */
  loadShadow(data: T, scheme?: string) : IKeyValueObject {
    const config = this.getSerializeScheme(scheme || 'default');
    const o : IKeyValueObject = {} as unknown as IKeyValueObject;
    const keys = this.getSortedKeys(config, data as object, true);
    for (const key of keys) {
      if (!this.isPropertySerializable(config, key))
        continue;
      o[key] = this.loadProp(config, key, '', (data as unknown as Record<string, IKeyValueObject>)[key]) as IKeyValueObject;
    }
    return o;
  }
  /**
   * 将影子数据以追加方式合并至当前对象中
   * @param data 
   */
  mergeShadow(data: IKeyValueObject, mergeList = false) {
    const o : IKeyValueObject = this as unknown as IKeyValueObject;
    for (const key in data) {
      if (Object.prototype.hasOwnProperty.call(data, key)) {
        const element = data[key];
        const thisEle = o[key];

        if (this.serializeConfig.mergeOverride) {
          const ret = this.serializeConfig.mergeOverride(key, thisEle, element);
          if (ret?.return)
            o[key] = ret.return as any;
          if (ret?.parsed)
            continue;
        }

        if (mergeList && typeof element === 'object' && typeof thisEle === 'object') {
          if (element instanceof Map && thisEle instanceof Map) {
            o[key] = ObjectUtils.mergeMap(thisEle, element) as any;
          } else if (element instanceof Set && thisEle instanceof Set) {
            o[key] = ObjectUtils.mergeSet(thisEle, element) as any;
          } else if (element instanceof Array && thisEle instanceof Array) {
            o[key] = element.concat(thisEle);
          } else if (thisEle instanceof SerializableObject) {
            thisEle.mergeShadow(element as any);
            o[key] = thisEle;
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
    this.serializeConfig.afterLoadOrMerge?.();
  }
  /**
   * 按当前对象的序列化配置直接创建单个序列化子对象
   * @param define 传入定义
   * @param key 参照的属性值
   * @param scheme 预设名称。默认是：default
   * @returns 
   */
  createSerializeObjectByScheme<K>(define: K, key: string, scheme?: string) {
    const config = this.getSerializeScheme(scheme || 'default');
    const forceSerializableClass = this.isForceSerializableClassProperty(config, key, '');
    if (forceSerializableClass) 
      return CreateObjectFactory.createSerializableObject(forceSerializableClass, this, define);
    return null;
  }

  /**
    * Cast self to other type
    * @returns The casted object
    */
  castTo<U extends SerializableObject<any>>(): U {
    return this as unknown as U;
  }
  /**
   * 获取当前对象指定名称的属性值
   * @param key 名称
   * @returns 
   */
  getProperty<K>(key: string) {
    return (this as unknown as IKeyValueObject)[key] as K;
  }
  /**
   * 设置当前对象指定名称的属性值
   * @param key 名称
   * @param value 值
   * @returns 
   */
  setProperty<K>(key: string, value: K) {
    return ((this as unknown as IKeyValueObject)[key] as K) = value;
  }

  /**
   * 克隆当前对象
   * @param scheme 预设名称。默认是：default 
   */
  clone(scheme?: string) : typeof this {
    const clonedObject = CreateObjectFactory.createSerializableObject<T, P>(
      this.serializeClassName, 
      this.parent,
    ) as SerializableObject<T, P>;
    clonedObject.load(this.save(), scheme);
    return clonedObject as typeof this;
  }
}

