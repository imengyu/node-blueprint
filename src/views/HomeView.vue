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
        <h1>Panel {{ panel.name }}</h1>
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
  secondarySideBarWidth: 20,
  bottomPanelHeight: 30,
  bottomAlignment: 'center',
  statusBarHeight: '20px',
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

    const group1 = codeLayout.value!.addGroup({
      title: 'Group1',
      tooltip: 'Group1',
      name: 'group1',
      iconLarge: () => h(IconFile),
    }, 'primarySideBar');
    codeLayout.value!.addGroup({
      title: 'Group2',
      tooltip: 'Group2',
      name: 'group2',
      iconLarge: () => h(IconSearch),
    }, 'primarySideBar');

    codeLayout.value!.addPanel({
      title: 'Panel1',
      tooltip: 'Panel1',
      name: 'group1.panel1',
      iconSmall: () => h(IconSearch),
    }, group1);
    codeLayout.value!.addPanel({
      title: 'Panel2',
      tooltip: 'Panel2',
      name: 'group1.panel2',
      iconSmall: () => h(IconSearch),
    }, group1);

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