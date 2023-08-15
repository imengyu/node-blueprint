<template>
  <PropList 
    :items="graph.children"
    @add="onAddChildGraph"
  >
    <template #row="{ item: childGraph }">
      <div
        v-tooltip="'可直接拖拽此箭头以添加子程序调用至图表中'"
        class="prop-list-dragger" 
        :style="{ backgroundImage: `url(${DraggerBg})` }"
        draggable="true"
        @dragstart="onChildGraphDrag(childGraph as NodeGraph, $event)"
      >
        <Icon icon="icon-back1" />
      </div>
      <div v-tooltip="'删除子图表'" class="prop-delete" @click="onDeleteChildGraph(childGraph as NodeGraph)">
        <Icon icon="icon-close" />
      </div>
      <PropItem title="图表名称">
        <Input 
          :model-value="(childGraph as NodeGraph).name" 
          :update-at="'blur'"
          placeholder="请输入图表名称"
          @update:model-value="(v: string) => onChildGraphNameUpdate((childGraph as NodeGraph), v as string)"
        />
      </PropItem>
      <PropItem title="图表注释">
        <Input 
          v-model="(childGraph as NodeGraph).description" 
          placeholder="图表的解释注释或者说明"
        />
      </PropItem>
      <PropItem title="">
        <SmallButton text="编辑图表" @click="onEditChildGraph(childGraph as NodeGraph)" />
      </PropItem>
    </template> 
    <template #add>
      <Icon icon="icon-add-bold" />
      添加子图表
    </template>
  </PropList>
</template>

<script setup lang="ts">
import type { PropType } from 'vue';
import DraggerBg from '../../Images/dragger-bg.svg';
import PropItem from '../../Components/PropList/PropItem.vue';
import PropList from '../../Components/PropList/PropList.vue';
import ArrayUtils from '@/node-blueprint/Base/Utils/ArrayUtils';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import BaseNodes from '@/node-blueprint/Nodes/Lib/BaseNodes';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { injectNodeGraphEditorContextInEditorOrIDE } from '../NodeIde';
import { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import Icon from '../../Nana/Icon.vue';
import Input from '../../Nana/Input/Input.vue';
import SmallButton from '../../Components/SmallButton.vue';

defineProps({
  graph: {
    type: Object as PropType<NodeGraph>,
    required: true,
  },
});
</script>