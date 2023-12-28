<template>
  <div class="full-container">
    <!-- <NodeIde /> -->
    <CodeLayout 
      ref="codeLayout" 
      v-model:primarySideBar="primarySideBar"
      v-model:secondarySideBar="secondarySideBar"
      v-model:bottomPanel="bottomPanel"
      :layout-config="config"
      :activityBar="activityBar"
      :statusBar="statusBar"
    >
      <template #panelRender="{ panel }">
        <span>{{ panel.size }} / {{ panel.name }}</span>
      </template>
    </CodeLayout>
  </div>
</template>

<script setup lang="ts">
import IconFile from '@/node-blueprint/Editor/Docunment/Editor/Icons/IconFile.vue';
import IconSearch from '@/node-blueprint/Editor/Docunment/Editor/Icons/IconSearch.vue';
import type { CodeLayoutConfig, CodeLayoutInstance } from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout';
import CodeLayout from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout.vue';
import { ref, reactive, onMounted, nextTick, h } from 'vue';

const config = reactive<CodeLayoutConfig>({
  primarySideBarSwitchWithActivityBar: true,
  primarySideBarWidth: 20,
  primarySideBarMinWidth: 170,
  secondarySideBarWidth: 20,
  secondarySideBarMinWidth: 170,
  bottomPanelHeight: 30,
  bottomPanelMinHeight: 40,
  bottomAlignment: 'center',
  statusBarHeight: '20px',
  panelHeaderHeight: 24,
  panelMinHeight: 150,
});

const activityBar = ref(true);
const primarySideBar = ref(true);
const secondarySideBar = ref(true);
const bottomPanel = ref(true);
const statusBar = ref(true);

const codeLayout = ref<CodeLayoutInstance>();

onMounted(() => {
  nextTick(() => {
    if (!codeLayout.value)
      return;

    const group1 = codeLayout.value.addGroup({
      title: 'Group1',
      tooltip: 'Group1',
      name: 'group1',
      iconLarge: () => h(IconFile),
    }, 'primarySideBar');
    codeLayout.value.addGroup({
      title: 'Group2',
      tooltip: 'Group2',
      name: 'group2',
      iconLarge: () => h(IconSearch),
    }, 'primarySideBar');
    const group3 = codeLayout.value.addGroup({
      title: 'Group3',
      tooltip: 'Group3',
      name: 'group3',
      startOpen: true,
      tabStyle: 'text',
      iconLarge: () => h(IconFile),
    }, 'bottomPanel');

    codeLayout.value.addPanel({
      title: 'Panel1',
      tooltip: 'Panel1',
      name: 'group1.panel1',
      startOpen: true,
      iconSmall: () => h(IconSearch),
    }, group1);
    codeLayout.value.addPanel({
      title: 'Panel2',
      tooltip: 'Panel2',
      name: 'group1.panel2',
      iconSmall: () => h(IconSearch),
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
        { 
          name: 'test2',
          icon: () => h(IconFile),
          onClick() {},
        },
      ]
    }, group1);
    codeLayout.value.addPanel({
      title: 'Panel3',
      tooltip: 'Panel3',
      name: 'group1.panel3',
      startOpen: true,
      iconSmall: () => h(IconSearch),
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
      ]
    }, group1);

    
    codeLayout.value.addPanel({
      title: 'Panel4',
      tooltip: 'Panel4',
      name: 'group3.panel4',
      startOpen: true,
      iconSmall: () => h(IconSearch),
      badge: '2',
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
      ]
    }, group3);
    const panel5 = codeLayout.value.addPanel({
      title: 'Panel5',
      tooltip: 'Panel5',
      name: 'group3.panel5',
      iconSmall: () => h(IconSearch),
    }, group3);

    codeLayout.value.addPanel({
      title: 'Panel51',
      tooltip: 'Panel51',
      name: 'group3.panel5.panel1',
      iconSmall: () => h(IconSearch),
      actions: [
        { 
          name: 'test',
          icon: () => h(IconSearch),
          onClick() {},
        },
      ]
    }, panel5);
    codeLayout.value.addPanel({
      title: 'Panel5.2',
      tooltip: 'Panel5.2',
      name: 'group3.panel5.panel2',
      iconSmall: () => h(IconFile),
    }, panel5);


    codeLayout.value.activeGroup(group1)
  });
});

</script>

<style>
.full-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>