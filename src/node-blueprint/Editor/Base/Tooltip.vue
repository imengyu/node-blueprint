<template>
  <div class="tooltip-container">
    <div ref="triggerEle" class="tigger">
      <slot>
      </slot>
    </div>
    <div v-show="show" 
      :class="'tooltip '+placement "
      :style="{
        left: position.left + 'px',
        top: position.top + 'px',
      }"
      ref="popover"
      role="tooltip"
      @mouseenter="mouseControl.tooltipMouseEvent('mouseenter')"
      @mouseleave="mouseControl.tooltipMouseEvent('mouseleave')"
      @mousedown="onMouseDown">
      <slot name="content" v-html="content"></slot>
    </div>
  </div>
</template>

<script lang="ts">
import type { EventListenerEvent } from '@/node-blueprint/Base/Utils/Events/EventListener';
import EventListener from '@/node-blueprint/Base/Utils/Events/EventListener';
import { defineComponent, onBeforeUnmount, onMounted, reactive, ref, toRefs, watch } from 'vue'

export default defineComponent({
  name: 'toolip',
  props: {
    trigger: {
      type: String,
      default: 'click'
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
      type: Boolean,
      default: false,
    },
    enable: {
      type: Boolean,
      default: true,
    },
  },
  emits: [ 'update:show' ],
  setup(props, context) {

    const { placement, trigger, hideDelay, show, enable } = toRefs(props);

    const popover = ref<HTMLElement>();
    const triggerEle = ref<HTMLElement>();

    const position = reactive({
      top: 0,
      left: 0
    });

    const mouseControl = new ToolTipMouseControlUtils();
    mouseControl.onShowTooltip = () => { 
      showTooltip();
      return true; 
    };
    mouseControl.onHideTooltip = hideTooltip;

    function hideTooltip() { context.emit('update:show', false); }
    function showTooltip() { if(enable.value) context.emit('update:show', true); }

    let _blurEvent : EventListenerEvent|null = null;
    let _focusEvent : EventListenerEvent|null = null;
    let _mouseenterEvent : EventListenerEvent|null = null;
    let _mouseleaveEvent : EventListenerEvent|null = null;
    let _clickEvent : EventListenerEvent|null = null;

    watch(show, (val : boolean) => {
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
    });

    function toggle() {
      if(show.value) hideTooltip();
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
      toggle,
      onMouseDown,
    };
  },
})

class ToolTipMouseControlUtils {

  onShowTooltip: ((e : MouseEvent) => boolean)|null = null;
  onHideTooltip: (() => void)|null = null;

  private hideTooltip() : void { 
    if(typeof this.onHideTooltip === 'function') 
      return this.onHideTooltip(); 
  }
  private showTooltip(e : MouseEvent) : boolean { 
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
    if (e.buttons > 0) return;
    
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
</script>