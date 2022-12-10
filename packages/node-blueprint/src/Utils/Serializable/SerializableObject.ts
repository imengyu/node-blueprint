import { IKeyValueObject, ISaveableTypes } from "../BaseTypes";

const createObjectFactorys = new Map<string, () => SerializableObject>();

/**
 * SerializableObject Object Creation Factory
 */
export const CreateObjectFactory = {
  /**
   * Add to factory
   * @param name Object Name
   * @param createFn Create callback
   */
  addObjectFactory(name : string, createFn : () => SerializableObject) : void {
    createObjectFactorys.set(name, createFn);
  },
  /**
   * Create SerializableObject from data Object
   * @param name Object Name
   * @param k data Object
   * @returns 
   */
  createSerializableObject(name : string, k : IKeyValueObject) : SerializableObject|null {
    const objCreate = createObjectFactorys.get(name);
    if(objCreate) {
      const obj = objCreate();
      obj.load(k);
      return obj;
    }
    return null;
  }
}

/**
 * Serializable Object. It can automatically recursively save class data or deserialize and load it.
 */
export class SerializableObject {

  /**
   * Class name, same as object name when register in `addObjectFactory`.
   */
  saveClassName = '';
  /**
   * Properties that can be saved
   */
  serializableProperties : string[] = [];
  
  /**
   * Save this object as a key value object.
   * @returns 
   */
  save() : IKeyValueObject {
    const o : IKeyValueObject = {}
    for (const key in this) {
      const element = this[key];
      if(this.serializableProperties.indexOf(key) === -1)
        continue;
      if(typeof element === 'bigint' || typeof element === 'number' || typeof element === 'boolean' || typeof element === 'string')
        o[key] = element as ISaveableTypes;
      else if(element && typeof element === 'object' && (element as unknown) instanceof SerializableObject) {
        const serializableObject = element as unknown as SerializableObject;
        //This is a SerializableObject
        if(typeof serializableObject.save === 'function' && typeof serializableObject.load === 'function' && typeof serializableObject.saveClassName === 'string') 
          o[key] = {
            class: serializableObject.saveClassName,
            obj: serializableObject.save()
          }
      }
    }
    return o;
  }
  /**
   * Load this object from the key value object.
   * @param data 
   */
  load(data : IKeyValueObject) : void {
    if(data) {
      for (const key in data) {
        if(this.serializableProperties.indexOf(key) === -1)
          continue;
        const o : IKeyValueObject = this as unknown as IKeyValueObject;
        const element = data[key] as IKeyValueObject;
        if(typeof element === 'bigint' || typeof element === 'number' || typeof element === 'boolean' || typeof element === 'string')
          o[key] = element;
        else if(typeof element === 'object') {
          if(typeof element.class === 'string' && typeof element.obj === 'object') {
            const newObj = CreateObjectFactory.createSerializableObject(element.class, element.obj as IKeyValueObject);
            if(newObj)
              o[key] = newObj as unknown as ISaveableTypes;
          }
        }
      }
    }
  }
}

