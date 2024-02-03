<template>
  <div 
    :class="[ 'code-layout-actions' ]"
  > 
    <button 
      v-for="action in actionsShow"
      :key="action.name"
      @click="action.onClick"
    >
      <CodeLayoutVNodeStringRender :content="action.icon" />
    </button>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { CodeLayoutActionButton } from './CodeLayout';
import CodeLayoutVNodeStringRender from './Components/CodeLayoutVNodeStringRender.vue';

defineEmits([ 'update:open' ])

const props = defineProps({
  actions: {
    type: Object as PropType<CodeLayoutActionButton[]>,
    default: () => ([] as any),
  },
  maxCount: {
    type: Number,
    default: 4,
  },
});

const actionsShow = computed(() => {
  if (!props.actions)
    return [];
  if (props.actions.length < props.maxCount)
    return props.actions;
  return props.actions.slice(0, props.maxCount);
});

</script>

<style lang="scss">
.code-layout-actions {
  display: flex;
  flex-direction: row;
  align-items: center;
  flex-shrink: 0;

  button {
    position: relative;
    padding: 2px 4px;
    color: var(--code-layout-color-text);
    border-radius: var(--code-layout-border-radius-small);
    background-color: transparent;
    appearance: none;
    border: none;
    outline: none;
    cursor: pointer;

    svg {
      fill: currentColor;
    }
    &:hover {
      background-color: var(--code-layout-color-background-hover);
    }
  }
}

</style>