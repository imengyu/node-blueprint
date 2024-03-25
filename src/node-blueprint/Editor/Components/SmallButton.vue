<template>
  <div 
    :class="[
      'node-small-button',
      text ? 'text' : '',
      disabled ? 'disabled' : '',
    ]"
    :style="{
      color: color,
      cursor: disabled ? 'not-allowed' : 'pointer',
    }"
  >
    <Icon v-if="icon && iconPlace === 'before'" :icon="icon" :fill="color" />
    {{ text }}
    <slot />
    <Icon v-if="icon && iconPlace === 'after'" :icon="icon" :fill="color" />
  </div>
</template>

<script lang="ts" setup>
import Icon from '../../Editor/Nana/Icon.vue';

defineProps({
  icon: {
    type: String,
    default: ""
  },
  iconPlace: {
    type: String,
    default: "before"
  },
  text: {
    type: String,
    default: ""
  },
  color: {
    type: String,
    default: undefined
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})
</script>