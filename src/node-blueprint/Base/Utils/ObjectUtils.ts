import type { IKeyValueObject, ISaveableTypes } from "./BaseTypes";

/**
 * Deep clone an object or array.
 * @param obj The object or array to clone.
 * @param deepArray Whether to deep clone each object in the array.
 * @returns The cloned object or array.
 */
function clone<T extends ISaveableTypes>(obj: T, deepArray = false): T {
  let temp: IKeyValueObject | Array<IKeyValueObject> | null = null;
  if (obj instanceof Array) {
    if (deepArray) {
      temp = (obj as IKeyValueObject[]).map<IKeyValueObject>((item) => clone(item, deepArray) as IKeyValueObject);
    } else {
      temp = obj.concat() as Array<IKeyValueObject>;
    }
  } else if (typeof obj === 'object') {
    temp = {} as IKeyValueObject;
    for (const item in obj) {
      const val = (obj as IKeyValueObject)[item];
      if (val === null) {
        temp[item] = null;
      } else if (val) {
        (temp as IKeyValueObject)[item] = clone(val, deepArray) as ISaveableTypes;
      }
    }
  } else {
    temp = obj as unknown as IKeyValueObject;
  }
  return temp as unknown as T;
}

/**
 * Merge map2 into map1, with map2 taking precedence. map2 will overwrite data in map1.
 * @param map1 The first map.
 * @param map2 The second map.
 * @returns The merged map.
 */
function mergeMap(map1: Map<unknown, unknown>, map2: Map<unknown, unknown>) {
  for (const [k, v] of map2) {
    map1.set(k, v);
  }
  return map1;
}

/**
 * Merge set2 into set1.
 * @param set1 The first set.
 * @param set2 The second set.
 * @returns The merged set.
 */
function mergeSet(set1: Set<unknown>, set2: Set<unknown>) {
  for (const iterator of set2) {
    set1.add(iterator);
  }
  return set1;
}

/**
 * Assign a value to a key in an object if the key is undefined.
 * @param obj The object.
 * @param key The key.
 * @param value The value to assign.
 */
function assignIfUndefined(obj: unknown, key: string, value: unknown) {
  if ((obj as IKeyValueObject)[key] === undefined) {
    (obj as IKeyValueObject)[key] = value as ISaveableTypes;
  }
}

export default {
  clone,
  mergeMap,
  mergeSet,
  assignIfUndefined,
};
