<template>
  <div class="full-container">
    <!-- <NodeIde /> -->
    <CodeLayout :config="config" />
  </div>
</template>

<script setup lang="ts">
import NodeIde from '@/node-blueprint/Editor/Docunment/NodeIde.vue';
import CodeLayout, { type CodeLayoutConfig } from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout.vue';
import { reactive } from 'vue';

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

</script>

<style>
.full-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>