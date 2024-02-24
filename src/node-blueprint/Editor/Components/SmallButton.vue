<template>
  <div :class="'node-small-button'+(text?' text':'')">
    <Icon v-if="icon && iconPlace === 'before'" :icon="icon" />
    {{ text }}
    <slot />
    <Icon v-if="icon && iconPlace === 'after'" :icon="icon" />
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
})
</script>