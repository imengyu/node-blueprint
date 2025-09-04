function remove<T>(this: T[], item: T) {
  const index = this.indexOf(item);
  if (index >= 0) {
    this.splice(index, 1);
    return true;
  }
  return false;
}
function removeAt<T>(this: T[], index: number) {
  if (index >= 0) {
    this.splice(index, 1);
    return true;
  }
  return false;
}
function insert<T>(this: T[], i: number, item: T) {
  if (i > this.length) {
    this.push(item);
    return this;
  }
  return this;
}
function clear<T>(this: T[]) {
  this.splice(0, this.length);
  return this;
}
function addOnce<T>(this: T[], item: T) {
  if (this.indexOf(item) >= 0) return this.length;
  else return this.push(item);
}

/**
 * 交换数组两个元素
 * @param arr 数组
 * @param index1 索引1
 * @param index2 索引2
 * @returns 
 */
export function swapItems<T>(arr : Array<T>, index1 : number, index2: number) {
  arr[index1] = arr.splice(index2,1,arr[index1])[0]
  /*
  let x = arr[index1];
  arr[index1] = arr[index2];
  arr[index2] = x;
  */
  return arr
}
/**
 * 指定数组索引位置元素向上移
 * @param arr 数组
 * @param index 索引
 */
export function upData<T>(arr : Array<T>, index : number) {
  if (arr.length > 1 && index !== 0)
    return swapItems(arr, index, index - 1)
}
/**
 * 指定数组索引位置元素向下移
 * @param arr 数组
 * @param index 索引
 */
export function downData<T>(arr : Array<T>, index : number) {
  if (arr.length > 1 && index !== (arr.length - 1))
    return swapItems(arr, index, index + 1)
}
/**
 * 将数组中某个条目重新插入数组指定索引位置，此函数适用于拖拽的场景中，
 * 此函数会自动计算移除条目之后的索引，并将其插入到指定位置中。
 * @param array 数组
 * @param item 条目
 * @param index 新的索引
 */
export function reInsertToArray<T>(array: T[], item: T, index: number) {
  const oldIndex = array.indexOf(item);
  if (oldIndex < index) {
    array.removeAt(oldIndex);
    array.insert(index - 1, item);
  } else if (oldIndex > index) {
    array.removeAt(oldIndex);
    array.insert(index, item);
  }
}
/**
 * 从数组中移除符合条件的条目
 * @param array 数组
 * @param checkFunction 检查函数
 * @param onlyOne 是否只移除一个
 */
export function removeItemFromArrayBy<T>(array: T[], checkFunction: (item: T, index: number) => boolean, onlyOne = false) {
  for (let i = array.length - 1; i >= 0; i--) {
    if (checkFunction(array[i], i)) {
      array.splice(i, 1);
      if (onlyOne)
        break;
    }
  }
}

const anyArray = Array.prototype;

anyArray.remove = remove;
anyArray.removeAt = removeAt;  
anyArray.insert = insert;
anyArray.clear = clear;
anyArray.addOnce = addOnce;


export class ConcatableArray<T> {
  private array?: T[];

  concat(items: T[]): void {
    this.array = this.array ? this.array.concat(items) : items;
  }
  getArray() {
    return this.array;
  }
}