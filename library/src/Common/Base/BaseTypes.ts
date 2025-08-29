/**
 * Serializeable types
 */
export type ISaveableTypes = IKeyValueObject<unknown>|Array<unknown>|Record<string, unknown>|number|string|boolean|null|undefined;

/**
 * Object
 */
export type IObject = Record<string, unknown>;

/**
 * KeyValue Object for any child
 */
export class IAnyObject<T> {
  [index: string]: T;
}

/**
 * KeyValue Object
 */
export type IKeyValueObject<T = ISaveableTypes> = Record<string, T>;