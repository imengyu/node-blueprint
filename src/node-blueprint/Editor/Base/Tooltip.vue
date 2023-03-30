<template>
  <div ref="triggerEle" class="node-tooltip-container">
    <slot>
    </slot>
    <div v-show="showInner" 
      :class="'node-tooltip '+placement "
      :style="{
        left: position.left + 'px',
        top: position.top + 'px',
      }"
      ref="popover"
      role="tooltip"
      @mouseenter="mouseControl.tooltipMouseEvent('mouseenter')"
      @mouseleave="mouseControl.tooltipMouseEvent('mouseleave')"
      @mousedown="onMouseDown">
      <slot name="content" >
        <span v-html="content"></span>
      </slot>
    </div>
  </div>
</template>

<script lang="ts">
import type { EventListenerEvent } from '@/node-blueprint/Base/Utils/Events/EventListener';
import EventListener from '@/node-blueprint/Base/Utils/Events/EventListener';
import StringUtils from '@/node-blueprint/Base/Utils/StringUtils';
import { defineComponent, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue'
import { ToolTipMouseControlUtils } from './TooltipUtils';

export default defineComponent({
  name: 'toolip',
  props: {
    trigger: {
      type: String,
      default: 'hover'
    },
    mutex: {
      type: String,
      default: ''
    },
    content: {
      type: String,
      default: '',
    },
    placement: {
      type: String,
      default: 'bottom'
    },
    hideDelay: {
      type: Number,
      default: 0,
    },
    show: {
      type: [Boolean,Object],
      default: null,
    },
    enable: {
      type: Boolean,
      default: true,
    },
  },
  emits: [ 'update:show' ],
  setup(props, context) {

    const {
      placement,
      trigger,
      hideDelay,
      show,
      enable,
      content,
    } = toRefs(props);

    const showInner = ref(typeof show.value === 'boolean' ? show.value : false);

    const popover = ref<HTMLElement>();
    const triggerEle = ref<HTMLElement>();

    const position = reactive({
      top: 0,
      left: 0
    });

    const mouseControl = new ToolTipMouseControlUtils(props.mutex);
    mouseControl.onShowTooltip = () => { 
      showTooltip();
      return true; 
    };
    mouseControl.onHideTooltip = hideTooltip;

    function hideTooltip() {
      if (typeof show.value === 'boolean')
        context.emit('update:show', false);
      else
        showInner.value = false;
    }
    function showTooltip() {
      if(enable.value && (context.slots.content || !StringUtils.isNullOrBlank(content.value))) 
        if (typeof show.value === 'boolean')
          context.emit('update:show', true);
        else
          showInner.value = true;
    }

    let _blurEvent : EventListenerEvent|null = null;
    let _focusEvent : EventListenerEvent|null = null;
    let _mouseenterEvent : EventListenerEvent|null = null;
    let _mouseleaveEvent : EventListenerEvent|null = null;
    let _clickEvent : EventListenerEvent|null = null;

    watch(show, (val) => {
      if (typeof val === 'boolean')
        showInner.value = val;
    });
    watch(showInner, (val : boolean) => {
      if (val && trigger.value && popover.value) {
        const _trigger = (triggerEle.value as HTMLElement).children[0] as HTMLElement;
        const _popover = popover.value;
        // 通过placement计算出位子
        switch (placement.value) {
          case 'top' :
            position.left = _trigger.offsetLeft - _popover.offsetWidth / 2 + _trigger.offsetWidth / 2;
            position.top = _trigger.offsetTop - _popover.offsetHeight;
            break;
          case 'left':
            position.left = _trigger.offsetLeft - _popover.offsetWidth;
            position.top = _trigger.offsetTop + _trigger.offsetHeight / 2 - _popover.offsetHeight / 2;
            break;
          case 'right':
            position.left = _trigger.offsetLeft + _trigger.offsetWidth;
            position.top = _trigger.offsetTop + _trigger.offsetHeight / 2 - _popover.offsetHeight / 2;
            break;
          case 'bottom':
            position.left = _trigger.offsetLeft - _popover.offsetWidth / 2 + _trigger.offsetWidth / 2;
            position.top = _trigger.offsetTop + _trigger.offsetHeight;
            break;
        }
        _popover.style.top = position.top + 'px';
        _popover.style.left = position.left + 'px';

        mouseControl.clearShowTooltipDelay();
        mouseControl.clearHideTooltipDelay();
        if(hideDelay.value > 0)
          mouseControl.registerHideTooltipDelay(hideTooltip, hideDelay.value);
      }
    });
    onMounted(() => {
      if (!popover.value && !triggerEle.value) 
        return console.error("Couldn't find popover ref in your component that uses popoverMixin.");
      // 获取监听对象
      const _triggerEle = (triggerEle.value as HTMLElement).children[0] as HTMLElement;
      // 根据trigger监听特定事件
      if (trigger.value === 'hover') {
        _mouseenterEvent = EventListener.listen(_triggerEle, 'mouseenter', e => mouseControl.elementTooltipMouseEnter(e as MouseEvent));
        _mouseleaveEvent = EventListener.listen(_triggerEle, 'mouseleave', () => mouseControl.elementTooltipMouseLeave());
        _mouseleaveEvent = EventListener.listen(_triggerEle, 'mousedown', () => mouseControl.elementTooltipMouseDown());
      } else if (trigger.value === 'focus') {
        _focusEvent = EventListener.listen(_triggerEle, 'focus', showTooltip);
        _blurEvent = EventListener.listen(_triggerEle, 'blur', hideTooltip);
      } else {
        _clickEvent = EventListener.listen(_triggerEle, 'click', toggle);
      }
    });
    onBeforeUnmount(() => {
      if (_blurEvent && _focusEvent) {
        _blurEvent.remove();
        _focusEvent.remove();
      }
      if (_mouseenterEvent && _mouseleaveEvent) {
        _mouseenterEvent.remove();
        _mouseleaveEvent.remove();
      }
      if (_clickEvent) 
        _clickEvent.remove();
      mouseControl.destroy();
    });

    function toggle() {
      if(showInner.value) hideTooltip();
      else showTooltip();
    }

    function onMouseDown(e: MouseEvent) {
      e.stopPropagation();
      mouseControl.tooltipMouseEvent('mousedown');
    }

    return {
      // 通过计算所得 气泡位置  
      position,
      popover,
      triggerEle,
      mouseControl,
      showInner,
      toggle,
      onMouseDown,
    };
  },
})

</script>

<style lang="scss">
.node-tooltip {
  position: absolute;
  padding: 2px 5px;
  background-color: #fff;
  border: 1px solid #bdbdbd;
  border-radius: 0 3px 3px 3px;
  box-shadow: 0 0 20px rgba(0,0,0,0.8);
  z-index: 200;
  white-space: pre;
  font-size: 0.8rem;
  color: #555;
  user-select: text;

  h6 {
    margin: 0 0 2px 0;
  }
  h5,
  h4 {
    margin: 0 0 3px 0;
  }
  h3,
  h2,
  h1 {
    margin: 0 0 5px 0;
  }

  p {
    font-size: 0.6rem;
    margin-bottom: 2px;
  }
}
.node-tooltip-container {
  position: relative;
  display: inherit;

  > .tigger {
    display: inherit;
  }
}
</style>