<template>
  <NodeFloatPanel 
    title="选择类型"
    :position="position"
    :size="size"
    :show="show"
    @update:show="(v) => $emit('update:show', v)"
    @click="onClick($event)"
  >    
    <Row align="center">
      <input v-model="searchValue" class="node-small-input fill" type="text" placeholder="搜索类型...">
      <SmallButton v-if="searchValue != ''" icon="icon-close-bold" text="清空筛选" @click="searchValue=''" />
    </Row>

    <div class="node-select-panel-list">
      <NodeParamTypeRender 
        v-for="(type, index) in types" 
        :key="index"
        :type="type"
        @click="$emit('selectType', type)"
      />
    </div>
    
    <div v-if="searchValue != '' && types.length===0" class="node-select-panel-empty">
      暂无筛选结果。请更改筛选条件后再试
    </div>
  </NodeFloatPanel>
</template>

<script setup lang="ts">
import { computed, ref, type PropType, watch } from 'vue';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import { NodeParamTypeRegistry } from '@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import Row from '../../../Nana/Layout/Row';
import SmallButton from '@/node-blueprint/Editor/Components//SmallButton.vue';
import NodeParamTypeRender from '../../../Components/Small/NodeParamTypeRender.vue';
import NodeFloatPanel from '../Components/NodeFloatPanel.vue';

const emit = defineEmits([ 
  'update:show',
  'selectType'
]);

const props = defineProps({
  /**
   * 是否显示
   */
  show: {
    type: Boolean,
    default: false
  },
  /**
   * 显示位置
   */
  position: {
    type: Object as PropType<Vector2>,
    default: () => new Vector2(),
  },
  canBeAny: {
    type: Boolean,
    default: false
  },
  canBeExecute: {
    type: Boolean,
    default: false
  },
});

const size = computed(() => {
  return new Vector2(
    300,
    window.innerHeight / 2
  );
})
const types = computed(() => {
  const list : NodeParamType[] = [];
  if (props.canBeAny)
    list.push(NodeParamType.Any);
  if (props.canBeExecute)
    list.push(NodeParamType.Execute);

  const map = NodeParamTypeRegistry.getInstance().getAllTypes();
  if (searchValue.value === '') {
    for (const [,type] of map)
      if (!type.isAny && !type.isExecute)
        list.push(type);
  } else
    for (const [,type] of map) {
      if (!type.isAny && !type.isExecute && type.toUserFriendlyName().includes(searchValue.value))
        list.push(type);
    }
  return list;
});
const searchValue = ref('');

//点击其他地方关闭此弹窗
function onDocClick() {
  emit('update:show', false);
}
function onClick(e : MouseEvent) {
  e.stopPropagation ? e.stopPropagation() : e.cancelBubble = true;
}

watch(() => props.show, (newV) => {
  if(newV) { 
    setTimeout(() => {
      document.addEventListener('click', onDocClick);
    }, 100); } 
  else 
    document.removeEventListener('click', onDocClick);
});
</script>

<style lang="scss">
.node-select-panel-list {
  display: block;
  margin-top: 10px;

  .node-param-type-display {
    cursor: pointer;
    padding: 3px 6px;
    border-radius: 4px;

    &:hover {
      background-color: rgba(#fff, 0.2);
    }
  }
}
.node-select-panel-empty {
  text-align: center;
  padding: 20px;
}
</style>