<template>
  <div :class="[
    'collapse-item',
    open ? 'open' : '',
  ]">
    <span class="collapse-title" @click="$emit('update:open', !open)">
      <Icon class="collapse-arrow" icon="icon-arrow-right-bold" />
      {{ title }}
    </span>
    <slot v-if="open" />
  </div>
</template>

<script setup lang="ts">
import Icon from '../Icon.vue';

defineEmits([ 'update:open' ])
defineProps({
  title: {
    type: String,
    default: ''
  },
  open: {
    type: Boolean,
    default: false
  },
})
</script>

<style lang="scss">
.collapse-item {
  display: block;
  padding: 1px 1px 1px 7px;

  &.open {
    .collapse-arrow {
      transform: rotate(90deg);
    }
  }

  .collapse-title {
    display: block;
    user-select: none;
    cursor: pointer;

    i {
      transition: transform ease-in-out 0.2s;
    }

    &:hover {
      color: rgb(69,180,245);

      i {
        color: rgb(69,180,245);
      }
    }
  }
  .collapse-arrow {
    color: #000;
    margin-right: 3px;
    transition: transform ease-in-out 0.3s;
  }
}
</style>

