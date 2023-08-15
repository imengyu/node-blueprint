<!-- eslint-disable vue/no-mutating-props -->
<template>
  <CollapsePropHeader title="图表属性">
    <CollapsePropHeader title="基础">
      <CollapsePropItem title="图表标题">
        <Input v-model="graph.name" class="prop-item-editor" type="text" placeholder="图表的标题" />
      </CollapsePropItem>
      <CollapsePropItem title="图表注释">
        <textarea v-model="graph.description" class="prop-item-editor" placeholder="图表的解释注释或者说明..." style="resize:vertical;" />
      </CollapsePropItem>
    </CollapsePropHeader>
    <CollapsePropHeader v-if="graph.type !== 'main'" title="输入输出">
      
    </CollapsePropHeader>
    <CollapsePropHeader title="变量">
      <GraphVaraible :graph="graph" />
    </CollapsePropHeader>
    <CollapsePropHeader title="子图表">
      <GraphChildrenList :graph="graph" />
    </CollapsePropHeader>
  </CollapsePropHeader>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import Input from '../../Nana/Input/Input.vue';
import CollapsePropHeader from '../../Components/PropControl/Common/CollapsePropHeader.vue'
import CollapsePropItem from '../../Components/PropControl/Common/CollapsePropItem.vue';
import GraphVaraible from '../Graph/GraphVaraible.vue';
import GraphChildrenList from '../Graph/GraphChildrenList.vue';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';

defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});
</script>