import { printWarning } from "../Logger/DevLog";

/**
 * Singleton base class, which is used to provide single instance services.
 * 
 * ```ts
 * const TAG = 'NodeParamTypeRegistry';
 * export class NodeParamTypeRegistry extends Singleton {
  
  constructor() {
    super(TAG);
  }
  static getInstance() {
    return Singleton.getSingletonInstance(TAG) as NodeParamTypeRegistry;
  }
 * ```
 */
export class Singleton {
  private static singletonMap = new Map<string, unknown>;
  private singletonName = '';

  constructor(singletonName: string) {
    if (Singleton.getSingletonInstance(singletonName) !== null) {
      printWarning('Singleton', `An instance already exists for the current Singleton ${singletonName}.`);
      return;
    }

    this.singletonName = singletonName;
    Singleton.setSingletonInstance(singletonName, this);
  }
   
  protected static getSingletonInstance(singletonName: string) {
    return Singleton.singletonMap.get(singletonName) || null;
  }
  protected static setSingletonInstance(singletonName: string, instance: unknown) {
    return Singleton.singletonMap.set(singletonName, instance);
  }
}