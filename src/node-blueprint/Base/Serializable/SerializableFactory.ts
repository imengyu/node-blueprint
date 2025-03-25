import type { SerializableConfig, SerializableObject, SerializableSchemeConfig } from "./SerializableObject";

const createObjectFactorys = new Map<string, CreateObjectClassCallback<any, any, any>>();
const serializableObjectFactorys = new Map<string, SerializableObjectConfigRegistry>();

export type CreateObjectClassCallback<T, P, C> = (define: T, parent: P) => C;

interface SerializableObjectConfigRegistry {
  name: string;
  config: SerializableConfig<any>;
}

/**
 * SerializableObject Object Creation Factory
 */
export const CreateObjectFactory = {
  /**
   * Add to factory
   * @param name Object Name
   * @param createFn Create callback
   */
  addObjectFactory<T, P, C>(name : string, createFn : CreateObjectClassCallback<T, P, C>) : void {
    if (createObjectFactorys.has(name))
      throw new Error(`CreateObjectFactory ${name} already exists`);
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
    if(!objCreate) 
      throw new Error(`SerializableObject ${name} not found`);

    const obj = objCreate(k, parent) as SerializableObject<T, P>;
    if (typeof k !== 'undefined' && k !== null)
      return obj.load(k);
    return obj;
  },
}

export const SerializableFactory = {
  /**
   * Add SerializableObject config to factory
   * @param name Object Name
   * @param config SerializableObject config
   * @param mergeWithSuperConfig Merge with super config
   */
  addSerializableObjectConfig<C>(name: string, config: SerializableConfig<any, C>, mergeWithSuperConfig?: string) {
    if (mergeWithSuperConfig) {
      const superConfig = serializableObjectFactorys.get(mergeWithSuperConfig);
      if (!superConfig)
        throw new Error(`Super config ${mergeWithSuperConfig} not found`);
      const pname = `${name}@${mergeWithSuperConfig}`;
      if (serializableObjectFactorys.has(pname))
        throw new Error(`SerializableObject config ${pname} already exists`);
      serializableObjectFactorys.set(pname, {
        name: pname,
        config: mergeSerializableConfig(superConfig.config, config),
      });
    } else {
      if (serializableObjectFactorys.has(name))
        throw new Error(`SerializableObject config ${name} already exists`);
      serializableObjectFactorys.set(name, { name, config });
    }
    return config;
  },
  /**
   * Add SerializableObject config to factory with switch config
   * @param names Object Names
   * @param createConfig Create config callback
   * @param mergeWithSuperConfig Merge with super config
   */
  addSerializableObjectConfigsWithSwitch<C>(names: string[], createConfig: (name: string, index: number) => SerializableConfig<any, C>, mergeWithSuperConfig?: string) {
    names.forEach((name, index) => {
      this.addSerializableObjectConfig(name, createConfig(name, index), mergeWithSuperConfig);
    });
  },
  /**
   * Get SerializableObject config from factory
   * @param name Object Name
   * @returns SerializableObject config
   */
  getSerializableObjectConfig(name: string) {
    const config = serializableObjectFactorys.get(name);
    if (!config)
      throw new Error(`Config ${name} not found`);
    return config.config;
  },
}

export function mergeSerializableConfigName(thisName: string, childName?: string|undefined) {
  if (!childName)
    return thisName;
  return `${childName}@${thisName}`;
}
export function mergeSerializableSchemeConfig(superConfig: SerializableSchemeConfig<any>, childConfig: SerializableSchemeConfig<any>) : SerializableSchemeConfig<any> {
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
  const schemes : Record<string, SerializableSchemeConfig<any>> = superConfig.serializeSchemes || {};
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