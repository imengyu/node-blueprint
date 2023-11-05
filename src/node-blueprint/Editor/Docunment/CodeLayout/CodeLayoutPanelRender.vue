<template>
  <div class="code-layout-panel"> 
    <div v-if="!alone" class="collapse">
      
    </div>
    <div class="content">
      
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { CodeLayoutPanel } from './CodeLayout';
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';

defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanel>,
    required: true,
  },
  /**
   * Only my self? Id true, do not show header
   */
  alone: {
    type: Boolean,
    default: false,
  },
  collapsed: {
    type: Boolean,
    default: false,
  },
});

</script>

<style lang="scss">
@import "./Scss/Root.scss";

.code-layout-panel {

  > .collapse {

  }
  > .content {
    
  }
}

</style>