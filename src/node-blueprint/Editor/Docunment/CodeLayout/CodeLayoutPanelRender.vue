<template>
  <div class="code-layout-panel"> 
    <div v-if="!alone" class="collapse">
      
    </div>
    <div class="content">
      <slot :panel="panel" :open="open" />
    </div>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { CodeLayoutPanelInternal } from './CodeLayout';
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';

defineEmits([ 'update:open' ])

defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    required: true,
  },
  /**
   * Only my self? Id true, do not show header
   */
  alone: {
    type: Boolean,
    default: false,
  },
  open: {
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