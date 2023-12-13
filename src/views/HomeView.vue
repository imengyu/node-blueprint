<template>
  <div class="full-container">
    <!-- <NodeIde /> -->
    <CodeLayout ref="codeLayout" :layout-config="config">
      <template #panelRender="{ panel }">
        <h1>Panel {{ panel.name }}</h1>
      </template>
    </CodeLayout>
  </div>
</template>

<script setup lang="ts">
import NodeIde from '@/node-blueprint/Editor/Docunment/NodeIde.vue';
import IconFile from '@/node-blueprint/Editor/Docunment/Editor/Icons/IconFile.vue';
import IconSearch from '@/node-blueprint/Editor/Docunment/Editor/Icons/IconSearch.vue';
import type { CodeLayoutConfig, CodeLayoutInstance } from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout';
import CodeLayout from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout.vue';
import { ref, reactive, onMounted, nextTick, h } from 'vue';

const config = reactive<CodeLayoutConfig>({
  activityBar: true,
  primarySideBar: true,
  primarySideBarWidth: 20,
  secondarySideBar: true,
  secondarySideBarWidth: 20,
  bottomPanel: true,
  bottomPanelHeight: 30,
  bottomAlignment: 'center',
  statusBar: true,
  statusBarHeight: '20px',
});

const codeLayout = ref<CodeLayoutInstance>();

onMounted(() => {
  nextTick(() => {
    codeLayout.value!.addPanel({
      title: 'Panel1',
      name: 'panel1',
      iconLarge: () => h(IconFile),
    }, 'primarySideBar');
    codeLayout.value!.addPanel({
      title: 'Panel2',
      name: 'panel2',
      iconLarge: () => h(IconSearch),
    }, 'primarySideBar');
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