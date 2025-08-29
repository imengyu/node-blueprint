<script lang="ts">
import { defineComponent, h, render, renderSlot, toRefs, watch, type VNode, ref, onBeforeUnmount, onMounted } from 'vue';
import { registerTooltipDownChecker, registerTooltipMutex, unRegisterTooltipDownChecker } from './TooltipMutex';
import { getContainer } from './TooltipUtils';
import TooltipContent from './TooltipContent.vue';

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
    showDelay: {
      type: Number,
      default: 600,
    },
    hideDelay: {
      type: Number,
      default: 250,
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
    followMousePosition: {
      type: Boolean,
      default: false,
    },
  },
  emits: [
    'update:show',
    'showed',
    'hided',
  ],
  setup(props, ctx) {
    const {
      hideDelay,
      show,
      enable,
      offset,
      showDelay,
    } = toRefs(props);

    const event = registerTooltipMutex(showDelay.value, hideDelay.value, hideTooltip, showTooltip);
    const isDown = ref(false);
    const currentMousePos = ref({ x: 0, y: 0 });

    function showTooltip() {
      if (isDown.value)
        return;
      render(h(
        TooltipContent,
        { 
          x: currentMousePos.value.x + offset.value.x,
          y: currentMousePos.value.y + offset.value.y,
          followMousePosition: props.followMousePosition,
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

      if (show.value !== true) {
        ctx.emit('update:show', true);
        ctx.emit('showed');
      }
    }
    function hideTooltip() {
      render(null, getContainer());
      if (show.value !== false) {
        ctx.emit('update:show', false);
        ctx.emit('hided');
      }
    }

    watch(show, (v) => {
      if (!v)
        hideTooltip();
    });
    onMounted(() => {
      registerTooltipDownChecker();
    });
    onBeforeUnmount(() => {
      unRegisterTooltipDownChecker();
      hideTooltip();
    });

    return () => {
      if (ctx.slots.default) {
        let vnode = renderSlot(ctx.slots, 'default');
        if (vnode.type.toString().startsWith('Symbol'))
          vnode = (vnode.children as VNode[])[0];

        if (!vnode.props)
          vnode.props = {};
        const oldonMouseenter = vnode.props.onMouseenter;
        const oldonMouseleave = vnode.props.onMouseleave;
        const oldonMousedown = vnode.props.onMousedown;
        const oldonMouseup = vnode.props.onMouseup;
        const oldonMousemove = vnode.props.onMousemove;
        vnode.props.onMousemove = (e: MouseEvent) => {
          currentMousePos.value.x = e.x;
          currentMousePos.value.y = e.y;
          oldonMousemove?.(e);
        };
        vnode.props.onMouseup = (e: MouseEvent) => {
          isDown.value = false;
          oldonMouseup?.(e);
        };
        vnode.props.onMousedown = (e: MouseEvent) => {
          isDown.value = true;
          if (show.value)
            hideTooltip();
          oldonMousedown?.(e);
        };
        vnode.props.onMouseenter = (e: MouseEvent) => {
          currentMousePos.value.x = e.x;
          currentMousePos.value.y = e.y;
          if (enable.value)
            event.onMouseEnter();
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