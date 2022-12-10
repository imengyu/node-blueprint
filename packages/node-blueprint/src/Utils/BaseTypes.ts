export type ISaveableTypes = IKeyValueObject|Array<unknown>|Record<string, unknown>|number|string|boolean;

/**
 * KeyValue Object
 */
export type IObject = Record<string, unknown>;

/**
 * KeyValue Object
 */
export class IAnyObject<T> {
  [index: string]: T;
}

/**
 * KeyValue SaveableTypes Object
 */
export interface IKeyValueObject {
  [index: string]: IKeyValueObject|ISaveableTypes|null|undefined;
}
