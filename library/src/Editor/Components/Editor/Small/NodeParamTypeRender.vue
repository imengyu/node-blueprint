<template>
  <div class="node-param-type-display">
    <NodeParamIconRender v-if="showIcon" :type="type" />
    <span v-if="type">{{ type.toUserFriendlyName(true) }}</span>
    <span v-else>请选择</span>
  </div>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import type { NodeParamType } from '../../../Base/Flow/Type/NodeParamType';
import NodeParamIconRender from './NodeParamIconRender.vue';

defineProps({
  type: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
  showIcon: {
    type: Boolean,
    default: true
  }
});
</script>

<style lang="scss">
.node-param-type-display {
  display: flex;
  flex-direction: row;
  align-items: center;

  > span {
    margin-left: 5px;
    flex: 1;
  }
}
</style>