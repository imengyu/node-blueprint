<template>
  <Icon icon="icon-port-dictionary-left" :fill="portColor1" :style="{ marginLeft: '-5px' }" @click="$emit('click')" />
  <Icon icon="icon-port-dictionary-right" :fill="portColor2" :style="{ marginLeft: '-9px' }" @click="$emit('click')" />
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import type { NodeParamType } from '../../../Base/Flow/Type/NodeParamType';
import Icon from '../../Nana/Icon.vue';

defineEmits([ 'click' ]);
const props = defineProps({
  type: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
});

//图标颜色
const portColor1 = computed(() => {
  return props.type?.genericTypes[0]?.define?.typeColor || 'rgb(250, 250, 250)';
});
const portColor2 = computed(() => {
  return props.type?.genericTypes[1]?.define?.typeColor || 'rgb(250, 250, 250)';
});
</script>

<style lang="scss">
</style>