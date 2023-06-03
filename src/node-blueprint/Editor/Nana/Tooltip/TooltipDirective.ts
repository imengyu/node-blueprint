import { render, h, type App, type  ObjectDirective } from "vue";
import { registerContextMenuMutex } from "./TooltipMutex";
import { getContainer } from "./TooltipUtils";
import TooltipContent from "./TooltipContent.vue";

const currentShowTooltips = new Map<number, () => void>();
let currentShowTooltipId = 0;

const tooltipDirective : ObjectDirective = {
  mounted(el, binding) {
    const event = registerContextMenuMutex(300, 200, hideTooltip, showTooltip);
    let isMouseDown = false;
    let isShow = false;
    const currentMousePos = { x: 0, y: 0 };

    function showTooltip() {
      if (isMouseDown)
        return;
      render(h(
        TooltipContent,
        { 
          x: currentMousePos.x + 20,
          y: currentMousePos.y + 10,
          content: ele.getAttribute('data-tooltip'),
          onMouseenter: () => {
            event.onTooltipMouseEnter();
          }, 
          onMouseleave: () => {
            event.onTooltipMouseLeave();
          },
        },
      ), getContainer());
      isShow = true;
    }
    function hideTooltip() {
      render(null, getContainer());
      isShow = false;
    }

    const ele = el as HTMLElement;
    ele.setAttribute('data-tooltip', binding.value);
    currentShowTooltipId++;

    currentShowTooltips.set(currentShowTooltipId, hideTooltip);

    ele.setAttribute('data-tooltip-id', currentShowTooltipId.toString());

    ele.addEventListener('mousemove', (e) => {
      currentMousePos.x = e.x;
      currentMousePos.y = e.y;
    });
    ele.addEventListener('mousedown', () => {
      isMouseDown = true;
      if (isShow)
        hideTooltip();
    });
    ele.addEventListener('mouseup', () => {
      isMouseDown = false;
    });
    ele.addEventListener('mouseenter', (e) => {
      currentMousePos.x = e.x;
      currentMousePos.y = e.y;
      event.onMouseEnter();
    });
    ele.addEventListener('mouseleave', event.onMouseLeave);
  },
  updated(el, binding) {
    const ele = el as HTMLElement;
    ele.setAttribute('data-tooltip', binding.value);
  },
  beforeUnmount(el) {
    const ele = el as HTMLElement;
    const id = parseInt(ele.getAttribute('data-tooltip-id') || '');
    const close = currentShowTooltips.get(id);
    if (close) close();
  },
};

/**
 * 注册指令
 */
export function installToolTipDirective(app: App) {
  app.directive('tooltip', tooltipDirective)
}

export default {
  install(app: App) {
    installToolTipDirective(app);
  }
}