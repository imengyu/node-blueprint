<template>
  <div class="full-container">
    <!-- <NodeIde /> -->
    <SplitBase v-model:size="size" />
  </div>
</template>

<script setup lang="ts">
import NodeIde from '@/node-blueprint/Editor/Docunment/NodeIde.vue';
import SplitBase from '@/node-blueprint/Editor/Docunment/CodeLayout/SplitLayout/SplitBase.vue';
import { ref } from 'vue';

const size = ref(50);

</script>

<style>
.full-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>