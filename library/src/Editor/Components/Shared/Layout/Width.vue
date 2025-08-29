<template>
  <div :style="{ width: typeof width === 'string' ? width : `${width}px` }" />
</template>

<script setup lang="ts">
defineProps({
  width: {
    type: [ Number, String ],
    default: '',
  }
})
</script>