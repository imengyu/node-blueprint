<template>
  <div class="node-param-type-display" @click="$emit('click')">
    <Icon :icon="icon" :fill="type?.define?.typeColor" />
    <span v-if="type">{{ type.toUserFriendlyName() }}</span>
    <span v-else>请选择</span>
  </div>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import type { NodeParamType } from '../../../Base/Flow/Type/NodeParamType';

const props = defineProps({
  type: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
});

defineEmits([ 'click' ]);

const icon = computed(() => {
  if (!props.type)
    return "icon-help-filling";
  if (props.type.isBaseType)
    return "icon-sphere";
  if (props.type.isEnum)
    return "icon-diamond";
  return "icon-hexagon";
});
</script>

<style lang="scss">
.node-param-type-display {
  display: flex;
  flex-direction: row;
  align-items: center;

  span {
    margin-left: 10px;
  }
}
</style>