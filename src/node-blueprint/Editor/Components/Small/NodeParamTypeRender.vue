<template>
  <div class="node-param-type-display">
    <slot name="icon">
      <NodeParamIconRender v-if="showIcon" :type="type" @click="$emit('click', $event)" />
    </slot>
    <slot name="name">
      <span v-if="type" @click="$emit('click', $event)">{{ type.toUserFriendlyName(true) }}</span>
      <span v-else @click="$emit('click', $event)">请选择</span>
    </slot>
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

defineEmits([ 'click' ]);
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