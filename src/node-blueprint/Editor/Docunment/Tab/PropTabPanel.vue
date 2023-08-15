<template>
  <div v-show="context?.activeTab.value === tabId" class="tab-panel">
    <slot />
  </div>
</template>

<script setup lang="ts">
import { inject, onMounted, onBeforeUnmount } from 'vue';
import type { PropTabContext } from './PropTab.vue';

const props = defineProps({
  title: {
    type: String,
    default: '',
  },
  icon: {
    type: String,
    default: '',
  },
});

const context = inject<PropTabContext>('PropTabContext');
const tabId = context?.nextTabId() || 0;

onMounted(() => {
  context?.registerTab({
    id: tabId,
    title: props.title,
    icon: props.icon,
  });
});
onBeforeUnmount(() => {
  context?.unRegisterTab(tabId);
});

</script>