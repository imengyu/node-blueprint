export default {
  /**
   * 检查事件是否处于控件内（input\select）
   * @param e 事件
   */
  isEventInControl(e: Event): boolean {
    const target = e.target as HTMLElement;
    return target.tagName == "INPUT" || target.tagName == "SELECT";
  },
  isEleEditable,
  getTop,
  getLeft,
  getElementIndex,
};

/**
 * 判断点击区域可编辑
 * @param {*} e
 */
function isEleEditable(e: HTMLElement) : boolean {
  if (!e) return false;
  //为input标签或者contenteditable属性为true
  if (e.tagName == "INPUT" || e.contentEditable == "true") return true;
  //递归查询父节点
  else return isEleEditable(e.parentNode as HTMLElement);
}

/**
 * 获取元素的绝对纵坐标
 * @param e 元素
 * @param stopClass 递归向上查找，遇到指定类的父级时停止
 */
function getTop(e: HTMLElement, stopClass ? : string) : number {
  let offset = e.offsetTop;
  if (e.offsetParent != null && (!stopClass || !(<HTMLElement>e.offsetParent).classList.contains(stopClass)) )
    offset += getTop(<HTMLElement>e.offsetParent, stopClass);
  return offset;
}
/**
 * 获取元素的绝对横坐标
 * @param e 元素
 * @param stopClass 递归向上查找，遇到指定类的父级时停止
 */
function getLeft(e: HTMLElement, stopClass ? : string) : number {
  let offset = e.offsetLeft;
  if (e.offsetParent != null && (!stopClass || !(<HTMLElement>e.offsetParent).classList.contains(stopClass))) 
    offset += getLeft(<HTMLElement>e.offsetParent, stopClass);
    
  return offset;
}

/**
 * 获取一个元素在它父元素的位置
 * @param element 元素
 * @returns 索引，如果没有，则返回-1
 */
function getElementIndex(element: HTMLElement) : number {
  for (let i = 0, c = (element.parentNode as HTMLElement).childNodes.length; i < c; i++)
    if ((element.parentNode as HTMLElement).childNodes.item(i) == element) return i;
  return -1;
}
