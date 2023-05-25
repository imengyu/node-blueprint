<template>
  <div class="tab-panel">
    <slot />
  </div>
</template>

<script setup lang="ts">
defineProps({
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
});
</script>