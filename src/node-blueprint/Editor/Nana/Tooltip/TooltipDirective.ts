import { render, h, type App, type  ObjectDirective } from "vue";
import { registerContextMenuMutex } from "./TooltipMutex";
import { getContainer } from "./TooltipUtils";
import TooltipContent from "./TooltipContent.vue";

const tooltipDirective : ObjectDirective = {
  mounted(el, binding) {
    const event = registerContextMenuMutex(300, 200, hideTooltip, showTooltip);

    function showTooltip(e: MouseEvent) {
      render(h(
        TooltipContent,
        { 
          x: e.x + 20,
          y: e.y + 10,
          content: binding.value,
          onMouseenter: () => {
            event.onTooltipMouseEnter();
          }, 
          onMouseleave: () => {
            event.onTooltipMouseLeave();
          },
        },
      ), getContainer());
    }
    function hideTooltip() {
      render(null, getContainer());
    }

    const ele = el as HTMLElement;
    ele.addEventListener('mouseenter', event.onMouseEnter);
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