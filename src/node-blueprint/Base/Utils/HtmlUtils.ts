export default {
  /**
   * 检查事件是否处于控件内（input\select）
   * @param e 事件
   */
  isEventInControl(e: Event): boolean {
    const target = e.target as HTMLElement;
    return target.tagName === "INPUT" || target.tagName === "SELECT" || target.tagName === "TEXTAREA";
  },
  isEleEditable,
  getTop,
  getLeft,
  getElementIndex,
  getElementAbsolutePositionInParent,
};

/**
 * 判断点击区域可编辑
 * @param {*} e
 */
function isEleEditable(e: HTMLElement) : boolean {
  if (!e) return false;
  //为input标签或者contenteditable属性为true
  if (e.tagName === "INPUT" || e.contentEditable === "true") return true;
  //递归查询父节点
  else return isEleEditable(e.parentNode as HTMLElement);
}

/**
 * 获取元素的绝对纵坐标
 * @param e 元素
 * @param stopClass 递归向上查找，遇到指定类的父级时停止
 */
function getTop(e: HTMLElement, stopClassOrEle ? : string|HTMLElement) : number {
  let offset = e.offsetTop;
  if (
    e.offsetParent !== null && (
      !stopClassOrEle 
      || (typeof stopClassOrEle === 'string' ? 
        !(<HTMLElement>e.offsetParent).classList.contains(stopClassOrEle) :
        e.offsetParent !== stopClassOrEle
      )
    )
  ) 
    offset += getTop(<HTMLElement>e.offsetParent, stopClassOrEle);
  return offset;
}
/**
 * 获取元素的绝对横坐标
 * @param e 元素
 * @param stopClass 递归向上查找，遇到指定类的父级时停止
 */
function getLeft(e: HTMLElement, stopClassOrEle ? : string|HTMLElement) : number {
  let offset = e.offsetLeft;
  if (
    e.offsetParent !== null && (
      !stopClassOrEle 
      || (typeof stopClassOrEle === 'string' ? 
        !(<HTMLElement>e.offsetParent).classList.contains(stopClassOrEle) :
        e.offsetParent !== stopClassOrEle
      )
    )
  ) 
    offset += getLeft(<HTMLElement>e.offsetParent, stopClassOrEle);
    
  return offset;
}

/**
 * 获取元素在指定父级的绝对坐标
 * @param e 元素
 * @param parent 计算的父级，未指定则是body
 * @returns 
 */
function getElementAbsolutePositionInParent(e: HTMLElement, parent: HTMLElement|undefined) {
  return {
    x: getLeft(e, parent),
    y: getTop(e, parent),
  }
}

/**
 * 获取一个元素在它父元素的DOM树位置
 * @param element 元素
 * @returns 索引，如果没有，则返回-1
 */
function getElementIndex(element: HTMLElement) : number {
  for (let i = 0, c = (element.parentNode as HTMLElement).childNodes.length; i < c; i++)
    if ((element.parentNode as HTMLElement).childNodes.item(i) === element) return i;
  return -1;
}
