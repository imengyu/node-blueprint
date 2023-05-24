interface TooltipMutexItem {
  uid: string;
  closeCallback: () => void;
  realShowCallback: () => void,
}

let lastShowTooltip : TooltipMutexItem|null = null
let lastShowDelay = 0;
let lastHideDelay = 0;
let uidTemp = 0;

/**
 * 鼠标进入，延时一会后显示Tooltip
 * 此时如果上次有显示Tooltip，如果是当前，则取消关闭，否则则关闭它
 * 鼠标移开，需要等待延时结束后才执行关闭
 */

export function registerContextMenuMutex(
  showDelayTime: number, 
  hideDelayTime: number, 
  closeCallback: () => void,
  realShowCallback: () => void,
) {
  const uid = (++uidTemp).toString();
  return {
    onMouseEnter() {
      if (lastShowDelay)
        clearTimeout(lastShowDelay);
      if (lastHideDelay) {
        clearTimeout(lastHideDelay);
        lastHideDelay = 0;
      }
      lastShowDelay = setTimeout(() => {
        lastShowDelay = 0;
        if (lastShowTooltip) {
          if (lastShowTooltip.uid !== uid)
            lastShowTooltip.closeCallback();
        } 
        lastShowTooltip = {
          uid,
          closeCallback,
          realShowCallback,
        };
    
        lastShowTooltip.realShowCallback();
      }, showDelayTime) as unknown as number;
    },
    onMouseLeave() {
      if (lastShowDelay) {
        clearTimeout(lastShowDelay);
        lastShowDelay = 0;
      }
      if (lastHideDelay)
        clearTimeout(lastHideDelay);
      lastHideDelay = setTimeout(() => {
        if (lastShowTooltip) {
          lastShowTooltip.closeCallback();
          lastShowTooltip = null;
        } 
      }, hideDelayTime) as unknown as number;
    },
    onTooltipMouseEnter() {
      setTimeout(() => {
        if (lastHideDelay) {
          clearTimeout(lastHideDelay);
          lastHideDelay = 0;
        }
      }, 10);
    },
    onTooltipMouseLeave() {
      this.onMouseLeave();
    }
  }
 
}