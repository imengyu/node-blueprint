<script lang="ts">
import { defineComponent, h, render, renderSlot, toRefs, watch, type VNode } from 'vue';
import { registerContextMenuMutex } from './TooltipMutex';
import TooltipContent from './TooltipContent.vue';
import { getContainer } from './TooltipUtils';

/**
 * 工具提示弹出组件
 */
export default defineComponent({
  name: 'Tooltip',
  components: {
    TooltipContent
  },
  props: {
    content: {
      type: String,
      default: '',
    },
    hideDelay: {
      type: Number,
      default: 500,
    },
    show: {
      type: Boolean,
      default: false,
    },
    enable: {
      type: Boolean,
      default: true,
    },
    offset: {
      type: Object,
      default: () => ({ x: 5, y: 10 }),
    },
  },
  emits: [
    'update:show'
  ],
  setup(props, ctx) {
    const {
      hideDelay,
      show,
      enable,
      offset,
    } = toRefs(props);

    const event = registerContextMenuMutex(300, hideDelay.value, hideTooltip, showTooltip);

    function showTooltip(e: MouseEvent) {
      render(h(
        TooltipContent,
        { 
          x: e.x + offset.value.x,
          y: e.y + offset.value.y,
          content: props.content,
          onMouseenter: () => {
            event.onTooltipMouseEnter();
          }, 
          onMouseleave: () => {
            event.onTooltipMouseLeave();
          },
        },
        ctx.slots,
      ), getContainer());

      if (show.value !== true)
        ctx.emit('update:show', true);
    }
    function hideTooltip() {
      render(null, getContainer());

      if (show.value !== false)
        ctx.emit('update:show', false);
    }

    watch(show, (v) => {
      if (!v)
        hideTooltip();
    });

    return () => {
      if (ctx.slots.default) {
        let vnode = renderSlot(ctx.slots, 'default');
        if (vnode.type.toString() === 'Symbol(Fragment)')
          vnode = (vnode.children as VNode[])[0];

        if (!vnode.props)
          vnode.props = {};
        const oldonMouseenter = vnode.props.onMouseenter;
        const oldonMouseleave = vnode.props.onMouseleave;
        vnode.props.onMouseenter = (e: MouseEvent) => {
          if (enable.value)
            event.onMouseEnter(e);
          oldonMouseenter?.(e);
        };
        vnode.props.onMouseleave = (e: MouseEvent) => {
          if (enable.value)
            event.onMouseLeave();
          oldonMouseleave?.(e);
        };
        return vnode;
      }
      return [];
    };
  },
});
</script>

<style lang="scss">
.nana-tooltip-container {
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  pointer-events: none;
  z-index: 100;
}
</style>