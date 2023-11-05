<template>
  <div 
    :class="[
      'item',
      active ? 'active' : '',
    ]"
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