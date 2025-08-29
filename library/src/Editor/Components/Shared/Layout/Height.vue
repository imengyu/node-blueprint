<template>
  <div :style="{ height: typeof height === 'string' ? height : `${height}px` }" />
</template>

<script setup lang="ts">
defineProps({
  height: {
    type: [ Number, String ],
    default: '',
  }
})
</script>