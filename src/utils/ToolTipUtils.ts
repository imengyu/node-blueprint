import { Vector2 } from "../model/Vector2";
import CommonUtils from "./CommonUtils";
import HtmlUtils from "./HtmlUtils";
import StringUtils from "./StringUtils";

export class TooltipProvider {
  showTooltip: (text : string, pos ?: Vector2) => number;
  hideTooltip: (id : number) => void;
}

export default {
  registerElementTooltip,
  unregisterElementTooltip,
  updateElementTooltip,
  closeElementTooltip,
  setTooltipProvider(pv : TooltipProvider) { tooltipProvider = pv; }
}

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
  if(StringUtils.isNumber(id))
    tooltipProvider.hideTooltip(parseInt(el.getAttribute('data-tooltip-id')));

  el.setAttribute('data-tooltip-id', undefined);
}


function elementTooltipMouseEnter(e : MouseEvent) {
  if(e.buttons > 0)
    return;

  let el = (<HTMLElement>e.currentTarget);
  let title = el.getAttribute('title') || el.getAttribute('data-title');
  el.setAttribute('data-tooltip-enter', 'true');
  if(!CommonUtils.isNullOrEmpty(title)) {
    HtmlUtils.registerShowTooltipDelay(() => {
      if(el.getAttribute('data-tooltip-enter') == 'true'){
        el.setAttribute('data-tooltip-id', tooltipProvider.showTooltip(
          title, new Vector2(e.x, e.y)
        ).toString());
      }
    });
  }
}
function elementTooltipMouseLeave(e : MouseEvent) {
  let el = (<HTMLElement>e.currentTarget);
  el.setAttribute('data-tooltip-enter', 'false');
  closeElementTooltip(el);
}
function elementTooltipMouseDown(e : MouseEvent) {
  closeElementTooltip(<HTMLElement>e.currentTarget);
}