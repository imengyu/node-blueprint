<template>
  <CodeLayoutBase :config="layoutConfig">
    <template #activityBar>
      <div class="top">
        <CodeLayoutActionItem 
          v-for="(panelGroup, key) in panels.primary"
          :key="key"
          :item="panelGroup"
          :active="panelGroup.open"
        />
      </div>
      <div class="bottom">
        <slot name="activityBarBottom" />
      </div>
    </template>
    <template #primarySideBar>

    </template>
    <template #secondarySideBar>

    </template>
    <template #bottomPanel>

    </template>
    <template #centerArea>

    </template>
    <template #statusBar>
      <slot name="statusBar" />
    </template>
  </CodeLayoutBase>
</template>

<script setup lang="ts">
import { ref , type PropType, computed, onMounted } from 'vue';
import type { CodeLayoutConfig, CodeLayoutPanel } from './CodeLayout';
import CodeLayoutBase from './CodeLayoutBase.vue';
import CodeLayoutActionItem from './CodeLayoutActionItem.vue';

const panels = ref<{
  primary: CodeLayoutPanel[],
  secondary: CodeLayoutPanel[],
  bottom: CodeLayoutPanel[],
  center: CodeLayoutPanel[],
}>({
  primary: [],
  secondary: [],
  bottom: [],
  center: [],
});

const props = defineProps({
  layoutConfig: {
    type: Object as PropType<CodeLayoutConfig>,
    required: true,
  },
});

onMounted(() => {
  panels.value.primary.push({
    title: 'HHHHHH',
    iconLarge: 'HH',
    open: true,
    name: 'test',
  })
});

</script>