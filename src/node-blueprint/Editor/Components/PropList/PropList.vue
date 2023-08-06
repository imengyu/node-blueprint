<template>
  <div v-if="items" class="prop-list">
    <slot>
      <div v-for="(item,i) in items" :key="i" class="prop-list-item">
        <slot name="row" :item="item" />
      </div>
    </slot>
    <div class="prop-list-item add-button" @click="$emit('add')">
      <slot name="add" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';

defineEmits([ 'add' ])

defineProps({
  items: {
    type: Object as PropType<unknown[]>,
    default: null,
  },
})
</script>
