export type CKeyValueTypeAll = Record<string, never>|unknown|undefined|string|bigint|number|boolean;

export interface CKeyValue {
  [index: string]: CKeyValueTypeAll;
}

/**
 * 深克隆对象，数组
 * @param obj 要克隆的对象
 * @param deepArray 是否要深度克隆数组里的每个对象
 */
function clone(obj: CKeyValueTypeAll, deepArray = false): CKeyValue|Array<CKeyValue>|null {
  let temp: CKeyValue|Array<CKeyValue>|null = null;
  if (obj instanceof Array) {
    if (deepArray) {
      temp = (obj as CKeyValue[]).map<CKeyValue>((item) => clone(item, deepArray) as CKeyValue);
    }
    else {
      temp = obj.concat();
    }
  }
  else if (typeof obj === 'object') {
    temp = {} as CKeyValue;
    for (const item in obj) {
      const val = (obj as CKeyValue)[item];
      if (val === null) { temp[item] = null; }
      else { (temp as CKeyValue)[item] = clone(val, deepArray) as CKeyValueTypeAll; }
    }
  } else {
    temp = obj as CKeyValue;
  }
  return temp;
}

export default {
  clone,
};
