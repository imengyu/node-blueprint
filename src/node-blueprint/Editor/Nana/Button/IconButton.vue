<template>
  <button
    :class="[
      'nana-icon-button',
      disabled ? 'disabled' : '',
      loading ? 'loading' : '',
      fillWidth ? 'fill-w' : '',
      fillHeight ? 'fill-h' : '',
    ]"
    @click="disabled ? {} : $emit('click')"
  >
    <Spin v-if="loading" />
    <slot />
  </button>
</template>

<script setup lang="ts">
import Spin from '../Common/Spin.vue';

defineEmits([ 'click' ]);

defineProps({
  disabled: {
    type: Boolean,
    default: false,
  },
  loading: {
    type: Boolean,
    default: false,
  },
  fillWidth: {
    type: Boolean,
    default: false,
  },
  fillHeight: {
    type: Boolean,
    default: false,
  },
});
</script>

<style lang="scss">
.nana-icon-button {
  background: transparent;
  appearance: none;
  outline: none;
  display: inline-flex;
  justify-content: center;
  align-items: center;
  text-align: center;
  position: relative;
  flex-shrink: 0;
  user-select: none;
  width: auto;
  white-space: nowrap;
  border: none;
  cursor: pointer;
  color: var(--nana-button-dark-text-color);
  box-sizing: border-box;
  overflow: hidden;
  
  --nana-simple-loading-color:  var(--nana-button-dark-text-color);

  &.disabled {
    opacity: 0.8;
    cursor: not-allowed;
  }
  &.loading {
    cursor: default;
  }
  &.fill-w {
    width: 100%;
  }
  &.fill-h {
    height: 100%;
  }

  .simple-loading {
    margin-right: 8px;
  }

  &:not(.disabled):not(.loading) {
    &:hover {
      background-color: var(--nana-icon-button-default-hover-color);
    }
    &:active {
      background-color: var(--nana-icon-button-default-active-color);
    }
  }
}
</style>