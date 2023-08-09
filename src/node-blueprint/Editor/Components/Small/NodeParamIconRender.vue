<template>
  <Icon v-if="!type" :icon="icon" :fill="color" />
  <VNodeRenderer
    v-else-if="type.define?.customPortIconRender"
    :render="() => type.define!.customPortIconRender!(port, type)"
  />
  <Icon v-else-if="type.isArray" icon="icon-port-array" :fill="genericColor" />
  <Icon v-else-if="type.isSet" icon="icon-port-set" :fill="genericColor" />
  <NodeParamIconDictionaryRender 
    v-else-if="type.isDictionary"
    :type="type"
  />
  <Icon v-else :icon="icon" :fill="color" />
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import NodeParamIconDictionaryRender from './NodeParamIconDictionaryRender.vue';
import type { NodeParamType } from '../../../Base/Flow/Type/NodeParamType';
import VNodeRenderer from '../../Nana/VNodeRenderer.vue';
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { NodePortEditor } from '../../Graph/Flow/NodePortEditor';

const props = defineProps({
  type: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
  port: {
    type: Object as PropType<NodePort>,
    default: null,
  },
});

//图标颜色
const color = computed(() => {
  return props.type?.define?.typeColor || 'rgb(250, 250, 250)';
});
const genericColor = computed(() => {
  return props.type?.genericTypes[0]?.define?.typeColor || 'rgb(250, 250, 250)';
});

const icon = computed(() => {

  if (!props.type)
    return "icon-help-filling";

  //端口中渲染
  if (props.port) {
    const editorState = (props.port as NodePortEditor).state;
    if(props.type.isExecute) 
      return editorState === 'active' ? 'icon-port-exe-active' : 'icon-port-exe';
    else if(props.type.name === 'array') 
      return editorState === 'active' ? 'icon-port-array-full' : 'icon-port-array';
    return editorState === 'active' ? 'icon-port-active' : 'icon-port';
  }

  //选择器中渲染
  if (props.type.isBaseType)
    return "icon-sphere";
  if (props.type.isEnum)
    return "icon-diamond";
  return "icon-hexagon";
});
</script>