<template>
  <div :class="[
    'nana-divider',
    vertical ? 'vertical' : 'horizontal'
  ]"
  />
</template>

<script setup lang="ts">
defineProps({
  /**
   * 是否是垂直模式
   */
  vertical: {
    type: Boolean,
    default: false,
  },
})
</script>

<style lang="scss">
.nana-divider {
  background-color: var(--nana-component-color-light-border);

  &.horizontal {
    height: 1px;
    margin: 10px 0;
  }
  &.vertical {
    width: 1px;
    margin: 0 10px;
  }
}
</style>