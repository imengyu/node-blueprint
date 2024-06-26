<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader title="单元属性">
    <CollapsePropItem v-if="props.nodes.length > 0">
      已选 {{ nodes.length }} 个单元
    </CollapsePropItem>
    <PropControl 
      v-if="firstSelectNode && firstSelectNode.editorProp"
      :items="firstSelectNode.editorProp"
    />
    <PropControl 
      v-if="firstSelectNode"
      :items="nodeDefaultProps"
    />
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import { computed, type PropType } from 'vue';
import CollapsePropHeader from '../../Components/PropControl/Common/CollapsePropHeader.vue';
import CollapsePropItem from '../../Components/PropControl/Common/CollapsePropItem.vue';
import PropControl from '../../Components/PropControl/PropControl.vue';
import type { NodeEditor } from '../../Graph/Flow/NodeEditor';
import type { NodeBreakPoint } from '@/node-blueprint/Base/Flow/Node/Node';
import type { PropControlItem } from '@/node-blueprint/Base/Editor/PropDefine';
import type { BaseSelectProps } from '../../Components/PropControl/Components/BaseSelect';
import type { NodeGraphEditorContext } from '../../Graph/NodeGraphEditor';

const props = defineProps({
  nodes: {
    type: Object as PropType<NodeEditor[]>,
    required: true,
  },
  context: {
    type: Object as PropType<NodeGraphEditorContext>,
    default: null,
  },
});

const firstSelectNode = computed(() => {
  return props.nodes.length === 1 ? props.nodes[0] : null;
});

const nodeDefaultProps : PropControlItem[] = [
  {
    type: 'static',
    title: '名称',
    getValue: () => firstSelectNode.value?.name,
  },
  {
    type: 'select',
    title: '断点',
    additionalProps: {
      options: [
        { value: 'none', text: '无' },
        { value: 'disable', text: '禁用' },
        { value: 'enable', text: '启用' },
      ]
    } as BaseSelectProps,
    getValue: () => firstSelectNode.value!.breakpoint,
    onUpdateValue: (newValue) => props.context.setSelectedNodeBreakpointState(newValue as NodeBreakPoint),
  },
  {
    type: 'group',
    title: '注释',
    children: [
      {
        type: 'check',
        title: '显示',
        getValue: () => firstSelectNode.value!.markOpen,
        onUpdateValue: (newValue) => firstSelectNode.value!.markOpen = newValue as boolean,
      },
      {
        type: 'textarea',
        title: '默认',
        getValue: () => firstSelectNode.value!.markContent,
        onUpdateValue: (newValue) => firstSelectNode.value!.markContent = newValue as string,
      },
    ],
  },
  {
    type: 'group',
    title: '调试',
    children: [
      {
        type: 'static',
        title: 'GUID',
        getValue: () => firstSelectNode.value!.guid,
      },
      {
        type: 'static',
        title: 'UID',
        getValue: () => firstSelectNode.value!.uid,
      },
    ],
  },
];

</script>