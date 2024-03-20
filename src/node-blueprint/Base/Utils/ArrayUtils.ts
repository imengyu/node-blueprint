function remove<T>(array: T[], item: T) {
  const index = array.indexOf(item);
  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }
  return false;
}
function removeBy<T>(array: T[], checkFunction: (item: T, index: number) => boolean, onlyOne = false) {
  for (let i = array.length - 1; i > 0; i--) {
    if (checkFunction(array[i], i)) {
      array.splice(i, 1);
      if (onlyOne)
        break;
    }
  }
}
function removeAt<T>(array: T[], index: number) {
  if (index >= 0) {
    array.splice(index, 1);
    return true;
  }
  return false;
}
function insert<T>(array: T[], i: number, item: T) {
  if (i > array.length) {
    array.push(item);
    return array;
  }
  return array.splice(i, 0, item);
}
function contains<T>(array: T[], item: T) {
  return array.indexOf(item) >= 0;
}
function clear<T>(array: T[]) {
  return array.splice(0, array.length);
}
function isEmpty(array: unknown[]) {
  return array.length === 0;
}
function addOnce<T>(array: T[], item: T) {
  if (array.indexOf(item) >= 0) return array.length;
  else return array.push(item);
}

/**
 * 交换数组两个元素
 * @param {Array} arr 数组
 * @param {Number} index1 索引1
 * @param {Number} index2 索引2
 */
function swapItems(arr : Array<any>, index1 : number, index2: number) {
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
 * @param {Array} arr 数组
 * @param {Number} index 索引
 */
function upData(arr : Array<any>, index : number) {
  if (arr.length > 1 && index !== 0)
    return swapItems(arr, index, index - 1)
}
/**
 * 指定数组索引位置元素向下移
 * @param {Array} arr 数组
 * @param {Number} index 索引
 */
function downData(arr : Array<any>, index : number) {
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
function reInsertToArray(array: any[], item: any, index: number) {
  const oldIndex = array.indexOf(item);
  if (oldIndex < index) {
    removeAt(array, oldIndex);
    insert(array, index - 1, item);
  } else if (oldIndex > index) {
    removeAt(array, oldIndex);
    insert(array, index, item);
  }
}

export default {
  addOnce,
  isEmpty,
  clear,
  contains,
  insert,
  removeAt,
  removeBy,
  remove,
  swapItems,
  upData,
  downData,
  reInsertToArray,
};
