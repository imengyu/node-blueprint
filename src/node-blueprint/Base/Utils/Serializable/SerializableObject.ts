import type { IKeyValueObject, ISaveableTypes } from "../BaseTypes";
import { printWarning } from "../Logger/DevLog";

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

export interface SerializaeObjectSave<T> {
  className: string,
  obj: T,
}
export interface SerializableConfig<T> {
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
   * Properties that need force load whith class, key is the Propertiy name, value is class name.
   */
  forceSerializableClassProperties?: { [index: string]: string },
  /**
   * 自定义加载属性回调
   * @param key 键值
   * @param source 源值
   * @returns 
   */
  loadProp?: (key: string, source: unknown) => unknown|undefined,
  /**
   * 自定义保存属性回调
   * @param key 键值
   * @param source 源值
   * @returns 
   */
  saveProp?: (key: string, source: unknown) => unknown|undefined,
  /**
   * 加载之后回调
   */
  afterLoad?: () => void;
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

/**
 * Serializable Object. It can automatically recursively save class data or deserialize and load it.
 */
export class SerializableObject<T> {

  /**
   * Create SerializableObject
   * @param saveClassName Class name, same as object name when register in `addObjectFactory`.
   * @param define Inittal source data
   */
  constructor(className: string, define?: T, config?: SerializableConfig<T>, loadAtStart = true) {
    this.serializeClassName = className;
    if (config) {
      if (!config.serializableProperties) 
        config.serializableProperties = [];
      config.noSerializableProperties = config.noSerializableProperties?.concat(this.serializeConfig.noSerializableProperties!);
      this.serializeConfig = config;
    }
    if (define) {
      this.define = define;
      if (loadAtStart) {
        this.load(define);
      }
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
    noSerializableProperties: [ 'define' ],
  };
  /**
   * The source define data
   */
  define: T|null = null;
  
  protected saveProp(key: string, element: unknown) : unknown {
    if (typeof element === 'bigint' 
      || typeof element === 'number' 
      || typeof element === 'boolean' 
      || typeof element === 'string'
    ) {
      if (this.serializeConfig.saveProp)
        element = this.serializeConfig.saveProp(key, element);
      return element as ISaveableTypes;
    }
    else if(element && typeof element === 'object') {
      if (element instanceof Array) {
        //This is array
        return {
          className: 'Array',
          obj: element.map((src, index) => this.saveProp(`${key}[${index}]`, src)),
        } as SerializaeObjectSave<T>
      }
      else if (element instanceof Set) {
        //This is set
        const setArr = [];
        let index = 0;
        for (const src of element) {
          setArr.push(this.saveProp(`${key}[${index}]`, src));
          index++;
        }
        return {
          className: 'Set',
          obj: setArr,
        } as SerializaeObjectSave<T>
      }
      else if (element instanceof Map) {
        //This is Map
        const arr = [];
        for (const [ mapKey, src ] of element)
          arr.push({
            mapKey,
            value: this.saveProp(`${key}[${mapKey}]`, src)
          });
        return {
          className: 'Map',
          obj: arr,
        } as SerializaeObjectSave<T>
      }
      else if (element instanceof SerializableObject) {
        if (this.serializeConfig.saveProp) {
          const ret = this.serializeConfig.saveProp(key, element);
          if (ret !== undefined)
            return ret;
        }
        //This is a SerializableObject
        const serializableObject = element as unknown as SerializableObject<T>;
        if (
          typeof serializableObject.save === 'function'
          && typeof serializableObject.serializeClassName === 'string'
        ) 
          return {
            className: serializableObject.serializeClassName,
            obj: serializableObject.save()
          } as SerializaeObjectSave<T>
      }
      else {
        printWarning(this.TAG, `Faied to saveProp ${key}, Value: ${element}`);
      }
    }
    return undefined;
  }
  protected loadProp(key: string, element: IKeyValueObject) : unknown {
    if (typeof element === 'bigint'
      || typeof element === 'number'
      || typeof element === 'boolean'
      || typeof element === 'string'
      || typeof element === 'function'
    ) {
      if (this.serializeConfig.loadProp)
        element = this.serializeConfig.loadProp(key, element) as IKeyValueObject;
      return element;
    }
    else if(element && typeof element === 'object') {
      const { obj, className } = element as unknown as SerializaeObjectSave<unknown>;
      switch (className) {
        case 'Array':
          return (obj as Array<IKeyValueObject>).map((v, index) => this.loadProp(`${key}[${index}]`, v));
        case 'Set': {
          const set = new Set();
          (obj as IKeyValueObject[]).forEach((v, index) => {
            set.add(this.loadProp(`${key}[${index}]`, v));
          });
          return set;
        } 
        case 'Map': {
          const map = new Map();
          (obj as {
            key: string,
            value: IKeyValueObject,
          }[]).forEach((v, index) => {
            map.set(v.key, this.loadProp(`${key}[${index}]`, v.value));
          });
          return map;
        }
        default:
          if (this.serializeConfig.loadProp) {
            const ret = this.serializeConfig.loadProp(key, element);
            if (ret !== undefined)
              return ret;
          }
          if (this.serializeConfig.forceSerializableClassProperties?.[key]) 
            return CreateObjectFactory.createSerializableObject(this.serializeConfig.forceSerializableClassProperties[key], this, element as any);
          if (typeof className === 'string' && typeof obj === 'object') 
            return CreateObjectFactory.createSerializableObject(className, this, obj as any);//This is a SerializableObject
          break;
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

  /**
   * Save this object as a key value object.
   * @returns 
   */
  save() : IKeyValueObject {
    const saveOverride = this.serializeConfig.saveOverride;
    if (saveOverride) {
      this.serializeConfig.saveOverride = undefined;
      const ret = saveOverride();
      this.serializeConfig.saveOverride = saveOverride;
      return ret;
    }
    const isAll = this.serializeConfig.serializeAll === true;
    const o : IKeyValueObject = {}
    for (const key of this.getSortedKeys(this, false)) {
      if(this.serializeConfig.noSerializableProperties!.includes(key) || (!isAll && !this.serializeConfig.serializableProperties!.includes(key)))
        continue;
      o[key] = this.saveProp(key, (this as unknown as Record<string, IKeyValueObject>)[key]) as ISaveableTypes;
    }
    return o;
  }
  /**
   * Load this object from the key value object.
   * @param data 
   * @returns Return this 
   */
  load(data : T) : SerializableObject<T> {
    const loadOverride = this.serializeConfig.loadOverride;
    if (loadOverride) {
      this.serializeConfig.loadOverride = undefined;
      const ret = loadOverride(data);
      this.serializeConfig.loadOverride = loadOverride;
      return ret;
    }
    if(data) {
      this.define = data;
      const isAll = this.serializeConfig.serializeAll === true;
      const o : IKeyValueObject = this as unknown as IKeyValueObject;
      for (const key of this.getSortedKeys(data, true)) {
        if(this.serializeConfig.noSerializableProperties!.includes(key) || (!isAll && !this.serializeConfig.serializableProperties!.includes(key)))
          continue;
        const value = this.loadProp(key, (data as unknown as Record<string, IKeyValueObject>)[key]) as IKeyValueObject;
        o[key] = value !== undefined ? value : o[key];
      }
    }
    this.serializeConfig.afterLoad?.();
    return this;
  }
}

