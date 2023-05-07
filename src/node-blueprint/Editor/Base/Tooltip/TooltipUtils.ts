import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";

const tooltipMouseControlMutex = new Map<string, ToolTipMouseControlUtils[]>();

/**
 * 工具提示鼠标事件控制器
 */
export class ToolTipMouseControlUtils {

  private readonly mutexName: string|undefined;

  /**
   * 构建工具提示鼠标事件控制器
   * @param mutexName 互斥名称。相同互斥名称的工具提示只会最多显示一个。如果为空，则不限制打开。
   */
  public constructor(mutexName?: string) {
    this.mutexName = mutexName;
    if (mutexName) {
      let array = tooltipMouseControlMutex.get(mutexName);
      if (!array) {
        array = [];
        tooltipMouseControlMutex.set(mutexName, array);
      }
      array.push(this);
    }
  }

  /**
   * 销毁
   */
  destroy() {
    if (this.mutexName) {
      const array = tooltipMouseControlMutex.get(this.mutexName);
      if (array) {
        ArrayUtils.remove(array, this);
      }
    }
  }

  onShowTooltip: ((e : MouseEvent) => boolean)|null = null;
  onHideTooltip: (() => void)|null = null;

  private hideTooltip() : void { 
    if(typeof this.onHideTooltip === 'function') 
      return this.onHideTooltip(); 
  }
  private showTooltip(e : MouseEvent) : boolean { 
    //隐藏互斥的其他提示
    if (this.mutexName) {
      const array = tooltipMouseControlMutex.get(this.mutexName);
      if (array) {
        for (const control of array) {
          if (control !== this) 
          control.hideTooltip();
        }
      }
    }
    if(typeof this.onShowTooltip === 'function') 
      return this.onShowTooltip(e); 
    return false;
  }

  tooltipMouseEvent(evt: "mouseenter" | "mouseleave" | "mousedown") : void {
    switch (evt) {
      case "mouseenter":
        this.clearHideTooltipDelay();
        break;
      case "mousedown":
        break;
      case "mouseleave":
        this.registerHideTooltipDelay(() => this.hideTooltip());
        break;
    }
  }
  elementTooltipMouseEnter(e: MouseEvent) : void {
    this.clearHideTooltipDelay();
    this.registerShowTooltipDelay(() => this.showTooltip(e));
  }
  elementTooltipMouseLeave() : void {
    this.clearShowTooltipDelay();
    this.registerHideTooltipDelay(() => this.hideTooltip());
  }
  elementTooltipMouseDown() : void {
    this.clearShowTooltipDelay();
    this.clearHideTooltipDelay();
    this.hideTooltip()
  }

  timerShowTooltipDelay = 0;
  timerHidetooltipDelay = 0;

  registerHideTooltipDelay(callback: () => void, delay = 200) : void {
    if (this.timerHidetooltipDelay != 0) clearTimeout(this.timerHidetooltipDelay);
    this.timerHidetooltipDelay = setTimeout(() => {
      this.timerHidetooltipDelay = 0;
      callback();
    }, delay) as unknown as number;
  }
  clearHideTooltipDelay() : void {
    if (this.timerHidetooltipDelay != 0) {
      clearTimeout(this.timerHidetooltipDelay);
      this.timerHidetooltipDelay = 0;
    }
  }
  clearShowTooltipDelay() : void {
    if (this.timerShowTooltipDelay != 0) {
      clearTimeout(this.timerShowTooltipDelay);
      this.timerShowTooltipDelay = 0;
    }
  }
  registerShowTooltipDelay(callback: () => void) : void {
    if (this.timerShowTooltipDelay != 0) clearTimeout(this.timerShowTooltipDelay);
    this.timerShowTooltipDelay = setTimeout(() => {
      this.timerShowTooltipDelay = 0;
      callback();
    }, 700) as unknown as number;
  }
}