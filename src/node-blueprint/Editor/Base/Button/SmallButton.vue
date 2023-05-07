<template>
  <div class="node-small-button" @click="$emit('click')">
    <Icon v-if="icon && iconPlace === 'before'" class="mr-1" :icon="icon" />
    {{ text }}
    <slot />
    <Icon v-if="icon && iconPlace === 'after'" class="mr-1" :icon="icon" />
  </div>
</template>

<script lang="ts" setup>
import Icon from '../Icon.vue';

defineProps({
  icon: String,
  iconPlace: {
    type: String,
    default: "before"
  },
  text: String
})
</script>