import Vue from "vue";
import { Vector2 } from "../model/Vector2";
import CommonUtils from "./CommonUtils";
import HtmlUtils from "./HtmlUtils";
import StringUtils from "./StringUtils";

export class TooltipProvider {
  showTooltip: (text : string, pos ?: Vector2) => number;
  hideTooltip: (id : number) => void;
  getEle: () => HTMLElement;
}

export default {
  registerElementTooltip,
  unregisterElementTooltip,
  updateElementTooltip,
  closeElementTooltip,
  setTooltipProvider(pv : TooltipProvider) { 
    tooltipProvider = pv; 
    setTimeout(() => {
      let ele = pv.getEle();
      ele.addEventListener('mouseenter', () => {
        clearHideTooltipDelay();
      })
      ele.addEventListener('mouseleave', () => {
        registerHideTooltipDelay(() => tooltipProvider.hideTooltip(lastHideTooltipId));
      })
    }, 500);
  },
  createVueDirective() {
    Vue.directive('tooltip', {
      inserted: (el, binding) => {
        registerElementTooltip(el);
      },
      bind: (el, binding, vnode) => {
        if(!CommonUtils.isNullOrEmpty(binding.value))
          el.setAttribute('data-title', binding.value);
      },
      unbind: (el, binding, vnode) => {
        unregisterElementTooltip(el);
      },
    });
  }
}

var lastHideTooltipId = 0;
var tooltipProvider : TooltipProvider = null;

function registerElementTooltip(el : HTMLElement) {
  el.addEventListener('mouseenter', elementTooltipMouseEnter);
  el.addEventListener('mouseleave', elementTooltipMouseLeave);
  el.addEventListener('mousedown', elementTooltipMouseDown);
}
function unregisterElementTooltip(el : HTMLElement) {
  el.removeEventListener('mouseenter', elementTooltipMouseEnter);
  el.removeEventListener('mouseleave', elementTooltipMouseLeave);
  el.removeEventListener('mousedown', elementTooltipMouseDown);
}

function updateElementTooltip(el : HTMLElement, text : string) {
  el.setAttribute('data-title', text);
  if(el.getAttribute('data-tooltip-enter') == 'true')
    tooltipProvider.showTooltip(el.getAttribute('title') || el.getAttribute('data-title'));
}
function closeElementTooltip(el : HTMLElement) {
  let id = el.getAttribute('data-tooltip-id');
  if(StringUtils.isNumber(id)) {
    lastHideTooltipId = parseInt(el.getAttribute('data-tooltip-id'));
    registerHideTooltipDelay(() => tooltipProvider.hideTooltip(lastHideTooltipId));
  }
  el.removeAttribute('data-tooltip-id');
}


function elementTooltipMouseEnter(e : MouseEvent) {
  if(e.buttons > 0)
    return;
  let el = (<HTMLElement>e.currentTarget);
  if(el.hasAttribute('data-no-tooltip'))
    return;
  let title = el.getAttribute('title') || el.getAttribute('data-title');
  el.setAttribute('data-tooltip-enter', 'true');
  if(!CommonUtils.isNullOrEmpty(title)) {
    
    registerShowTooltipDelay(() => {
      clearHideTooltipDelay();
      if(el.getAttribute('data-tooltip-enter') == 'true'){
        lastHideTooltipId = tooltipProvider.showTooltip(title, new Vector2(e.x, e.y))
        el.setAttribute('data-tooltip-id', lastHideTooltipId.toString());
      }
    });
  }
}
function elementTooltipMouseLeave(e : MouseEvent) {
  let el = (<HTMLElement>e.currentTarget);
  el.setAttribute('data-tooltip-enter', 'false');
  closeElementTooltip(el);
  clearShowTooltipDelay();
}
function elementTooltipMouseDown(e : MouseEvent) {
  closeElementTooltip(<HTMLElement>e.currentTarget);
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
function clearShowTooltipDelay() {
  if(timerShowTooltipDelay != null) {
    clearTimeout(timerShowTooltipDelay);
    timerShowTooltipDelay = null;
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
