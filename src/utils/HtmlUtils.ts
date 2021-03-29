export default {
  getTop,
  getLeft,
  getElementIndex,
  /**
   * 检查事件是否处于控件内（input\select）
   * @param e 事件
   */
  isEventInControl(e : Event) {
    let target = (<HTMLElement>e.target);
    return (target.tagName == 'INPUT' 
      || target.tagName == 'SELECT');
  },
  showElement(el : HTMLElement) {
    el.style.display = '';
  },
  hideElement(el : HTMLElement) {
    el.style.display = 'none';
  },
  isEleEditable,
  createOptionElement,
  registerShowTooltipDelay,
  registerHideTooltipDelay,
  clearHideTooltipDelay,
}

function createOptionElement(value : string, text : string) {
  let e = document.createElement('option');
  e.value = value;
  e.text = text;
  return e;
} 

/**
 * 判断点击区域可编辑
 * @param {*} e 
 */
function isEleEditable(e : HTMLElement) : boolean {
  if(!e)
    return false;
  //为input标签或者contenteditable属性为true
  if(e.tagName == 'INPUT' || e.contentEditable == 'true')
    return true;
  else
    //递归查询父节点
    return isEleEditable(e.parentNode as HTMLElement);
}

/**
 * 获取元素的绝对纵坐标
 * @param e 
 */
function getTop(e : HTMLElement) {
  var offset = e.offsetTop;
  if (e.offsetParent != null) offset += getTop(<HTMLElement>e.offsetParent);
  return offset;
}
/**
 * 获取元素的绝对横坐标
 * @param e 元素
 */
function getLeft(e : HTMLElement) {
  var offset = e.offsetLeft;
  if (e.offsetParent != null) offset += getLeft(<HTMLElement>e.offsetParent);
  return offset;
} 

function getElementIndex(element : HTMLElement) {
  for(let i = 0, c = element.parentNode.childNodes.length; i < c; i++)
    if(element.parentNode.childNodes.item(i) == element)
      return i;
  return -1;
}


let timerShowTooltipDelay : any = null;
let timerHidetooltipDelay : any = null;

function registerHideTooltipDelay(callback: () => void) {
  if(timerHidetooltipDelay != null)
    clearTimeout(timerHidetooltipDelay);
  timerHidetooltipDelay = setTimeout(() => {
    timerHidetooltipDelay = null;
    callback();
  }, 200);
}
function clearHideTooltipDelay() {
  if(timerHidetooltipDelay != null) {
    clearTimeout(timerHidetooltipDelay);
    timerHidetooltipDelay = null;
  }
}
function registerShowTooltipDelay(callback: () => void) {
  if(timerShowTooltipDelay != null)
    clearTimeout(timerShowTooltipDelay);
  timerShowTooltipDelay = setTimeout(() => {
    timerShowTooltipDelay = null;
    callback()
  }, 400);
}

