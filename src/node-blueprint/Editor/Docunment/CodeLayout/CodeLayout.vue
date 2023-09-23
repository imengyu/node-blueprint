<template>
  <CodeLayoutBase :config="layoutConfig">
    <template #activityBar>
      <div class="top">
        
      </div>
      <div class="bottom">
        <slot name="activityBarBottom" />
      </div>
    </template>
    <template #bottomPanel>

    </template>
    <template #centerArea>

    </template>
    <template #primarySideBar>

    </template>
    <template #secondarySideBar>

    </template>
    <template #statusBar>
      <slot name="statusBar" />
    </template>
  </CodeLayoutBase>
</template>

<script setup lang="ts">
import { ref , type PropType } from 'vue';
import type { CodeLayoutConfig } from './CodeLayout';
import CodeLayoutBase from './CodeLayoutBase.vue';

const panels = ref<CodeLayoutConfig[]>([]);

const props = defineProps({
  layoutConfig: {
    type: Object as PropType<CodeLayoutConfig>,
    required: true,
  },
});



</script>