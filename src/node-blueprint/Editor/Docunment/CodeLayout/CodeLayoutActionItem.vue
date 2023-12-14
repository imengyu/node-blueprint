<template>
  <div 
    :class="[
      'item',
      active ? 'active' : '',
    ]"
    @click="$emit('activeItem', item)"
  >
    <div class="icon">
      <CodeLayoutVNodeStringRender :content="item.iconLarge" />
    </div>
    <span v-if="item.badge">
      <CodeLayoutVNodeStringRender :content="item.badge" />
    </span>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { CodeLayoutPanel } from './CodeLayout';
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';

defineEmits(['activeItem'])

defineProps({
  item: {
    type: Object as PropType<CodeLayoutPanel>,
    required: true,
  },
  active: {
    type: Boolean,
    default: false,
  },
});

</script>