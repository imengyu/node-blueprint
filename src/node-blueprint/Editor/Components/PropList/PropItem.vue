<template>
  <div class="prop-item">
    <span>{{ title }}</span>
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
})
</script>