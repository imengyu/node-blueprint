import { render, h, type App, type  ObjectDirective } from "vue";
import { registerContextMenuMutex } from "./TooltipMutex";
import { getContainer } from "./TooltipUtils";
import TooltipContent from "./TooltipContent.vue";

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
          content: binding.value,
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