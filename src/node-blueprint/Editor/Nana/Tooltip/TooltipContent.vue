<template>
  <div
    class="nana-tooltip"
    role="tooltip"
    :style="{
      left: `${x}px`,
      top: `${y}px`,
    }"
  >
    <slot name="content">
      <span v-html="content"></span>
    </slot>
  </div>
</template>

<script lang="ts" setup>
defineProps({
  x: {
    type: Number,
    default: 0
  },
  y: {
    type: Number,
    default: 0
  },
  content: {
    type: String,
    default: '',
  },
})
</script>

<style lang="scss">
.nana-tooltip {
  position: absolute;
  padding: 2px 5px;
  background-color: var(--nana-component-color-white);
  border: 1px solid var(--nana-component-color-light-border);
  border-radius: 0 3px 3px 3px;
  box-shadow: 0 0 20px var(--nana-component-color-light-shadow);
  z-index: 200;
  white-space: pre;
  font-size: 0.8rem;
  color: var(--nana-text-color-content);
  user-select: text;
  pointer-events: all;
}
</style>