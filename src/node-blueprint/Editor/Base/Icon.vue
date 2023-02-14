<template>
  <svg
    :class="['node-icon', spin ? 'spin' : '' ]"
    :style="{
      transform: rotate !== 0 ? `rotate(${rotate}deg)` : '',
      fill: fill ? fill : undefined,
      width: size,
      height: size,
    }"
  >
    <use :xlink:href="`#${icon}`"></use>
  </svg>
</template>

<script lang="ts" setup>
defineProps({
  icon: {
    type: String,
    default: '',
  },
  fill: {
    type: String,
    default: '',
  },
  spin: {
    type: Boolean,
    default: false,
  },
  size: {
    type: [Number,String],
    default: 16,
  },
  rotate: {
    type: Number,
    default: 0,
  },
});
</script>

<style lang="scss">
.node-icon {
  &.spin {
    animation: node-loading-circle 1s infinite cubic-bezier(0,0,1,1);
  }
}

@keyframes node-loading-circle {
  0% {
    transform: rotate(0)
  }
  to {
    transform: rotate(360deg)
  }
}
</style>