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
      <CodeLayoutGroupRender
        v-for="(panelGroup, key) in panels.primary"
        :key="key"
        :group="panelGroup"
        :horizontal="false"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupRender>
    </template>
    <template #secondarySideBar>
      <CodeLayoutGroupRender
        v-for="(panelGroup, key) in panels.secondary"
        :key="key"
        :group="panelGroup"
        :horizontal="false"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupRender>
    </template>
    <template #bottomPanel>
      <CodeLayoutGroupRender
        v-for="(panelGroup, key) in panels.bottom"
        :key="key"
        :group="panelGroup"
        :horizontal="true"
      >
        <template #panelRender="data">
          <slot name="panelRender" v-bind="data" />
        </template>
      </CodeLayoutGroupRender>
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
import type { CodeLayoutConfig, CodeLayoutGrid, CodeLayoutPanel, CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutBase from './CodeLayoutBase.vue';
import CodeLayoutActionItem from './CodeLayoutActionItem.vue';
import CodeLayoutGroupRender from './CodeLayoutGroupRender.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';

const panels = ref<{
  primary: CodeLayoutPanelInternal[],
  secondary: CodeLayoutPanelInternal[],
  bottom: CodeLayoutPanelInternal[],
  center: CodeLayoutPanelInternal[],
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

function getPanelArray(target: CodeLayoutGrid) {
  switch (target) {
    case 'primarySideBar': return panels.value.primary;
    case 'secondarySideBar': return panels.value.secondary;
    case 'bottomPanel': return panels.value.bottom;
    case 'centerArea': return panels.value.center;
  }
  throw new Error(`Grid can not insert panel`);
}

function addPanel(panel: CodeLayoutPanel, target: CodeLayoutGrid) {
  getPanelArray(target).push({ 
    ...panel,
    open: false,
    children: [],
  });
  return panel;
}
function removePanel(panel: CodeLayoutPanel, target: CodeLayoutGrid) {
  ArrayUtils.remove(getPanelArray(target), panel);
  return panel;
}

defineExpose({
  addPanel,
  removePanel,
});

onMounted(() => {
});

</script>