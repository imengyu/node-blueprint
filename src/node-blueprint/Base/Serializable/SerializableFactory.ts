import type { SerializableConfig, SerializableObject, SerializableSchemeConfig } from "./SerializableObject";

const createObjectFactorys = new Map<string, CreateObjectClassCallback<any, any>>();
const serializableObjectFactorys = new Map<string, SerializableObjectConfigRegistry>();

export type CreateObjectClassCallback<T, P> = (define: T, parent: P) => SerializableObject<T, P>;

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
  },
}

export const SerializableFactory = {
  /**
   * Add SerializableObject config to factory
   * @param name Object Name
   * @param config SerializableObject config
   * @param mergeWithSuperConfig Merge with super config
   */
  addSerializableObjectConfig(name: string, config: SerializableConfig<any>, mergeWithSuperConfig?: string) {
    if (mergeWithSuperConfig) {
      const superConfig = serializableObjectFactorys.get(mergeWithSuperConfig);
      if (!superConfig)
        throw new Error(`Super config ${mergeWithSuperConfig} not found`);
      const pname = `${name}@${mergeWithSuperConfig}`;
      serializableObjectFactorys.set(pname, {
        name: pname,
        config: mergeSerializableConfig(superConfig.config, config),
      });
    } else {
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
  addSerializableObjectConfigsWithSwitch(names: string[], createConfig: (name: string, index: number) => SerializableConfig<any>, mergeWithSuperConfig?: string) {
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
    return config;
  },
}

export function mergeSerializableConfigName(thisName: string, childName?: string|undefined) {
  if (!childName)
    return thisName;
  return `${thisName}@${childName}`;
}
export function mergeSerializableSchemeConfig(superConfig: SerializableSchemeConfig, childConfig: SerializableSchemeConfig) : SerializableSchemeConfig {
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