<template>
  <Tooltip trigger="hover">
    <!--端口-->
    <div 
      v-if="instance" 
      :class="'flow-port '+instance.editorState.state"
      @contextmenu="onContextMenu($event)"
      @mouseenter="onPortMouseEnter"
      @mouseleave="onPortMouseLeave"
      @mousedown="onPortMouseDown($event)"
    >
      <div class="editor node-custom-editor" v-if="instance.direction === 'output' && instance.define.forceEditorControlOutput" >
        <!-- 编辑器 -->
        <NodePortParamEditor :port="instance" />
      </div>
      <div class="default-content">
        <!--删除端口按扭-->
        <Tooltip v-if="instance.dyamicAdd" content="删除参数">
          <Icon class="delete" icon="icon-close" @click="onDeleteParam" />
        </Tooltip>
        <!--标题-->
        <span 
          v-if="instance.direction === 'output'"
          :style="{ minWidth:instance.parent.style.outputPortMinWidth }"
        >
          {{ instance.define.name }}
        </span>
        <!--异步图标-->
        <Icon v-show="instance.define.isAsync" class="async" icon="icon-port-async" />
        <!--连接图标-->
        <Icon v-show="instance.editorState.state==='error'" class="dot" icon="icon-close" />
        <Icon v-show="instance.editorState.state==='success'" class="dot" icon="icon-select-bold" />
        <!--普通状态图标-->
        <template v-if="instance.editorState.state==='normal' || instance.editorState.state==='active'">
          <VNodeRenderer
            v-if="instance.paramType?.define?.customPortIconRender"
            :render="() => instance.paramType.define!.customPortIconRender!(instance, instance.paramType)"
          />
          <Icon v-else class="dot" :icon="portIcon" :fill="portColor"  />
        </template>
        <!--文字-->
        <span
          v-if="instance.direction === 'input'" 
          :style="{ minWidth: instance.parent.style.inputPortMinWidth }"
        >

          {{ instance.define.name }}
        </span>
      </div>
      <div class="editor node-custom-editor" v-if="instance.direction === 'input'" >
        <!-- 编辑器 -->
        <NodePortParamEditor :port="instance" />
      </div>
    </div>
    <!--工具提示-->
    <template #content>
      <h5>{{ (instance.define.name === '') ? (instance.define.direction == 'input' ? '入口' : '出口') : instance.define.name }}</h5>
      <span class="text-secondary">
        <small v-html="instance.define.description"></small>
      </span>
      <span>
        <br>类型：
        <span v-if="instance.define.paramType" v-html="instance.define.paramType.toString()"></span>
        <span v-else class="text-danger">未知</span>
      </span>
      <span v-if="instance.define.isAsync">
        <br>
        <Icon icon="icon-async" />
        该端口执行是异步调用的
      </span>
    </template>
  </Tooltip>
</template>

<script lang="ts" setup>
import { computed, toRefs, type PropType } from 'vue';
import Tooltip from '../../Base/Tooltip.vue';
import Icon from '../../Base/Icon.vue';
import type { NodePort } from '@/node-blueprint/Base/Flow/Node/NodePort';
import VNodeRenderer from '../../Base/VNodeRenderer.vue';
import NodePortParamEditor from './NodePortParamEditor.vue';

const props = defineProps({
  instance: {
    type: Object as PropType<NodePort>,
    required: true,
  },
});
const {
  instance,
} = toRefs(props);

//图标
const portIcon = computed(() => {
  const type = instance.value.define.paramType;
  if (!type)
    return 'icon-help-filling';
  const editorState = instance.value.editorState;
  if(type.isExecute) 
    return editorState.state === 'active' ? 'icon-port-exe-active' : 'icon-port-exe';
  else if(type.name === 'array') 
    return editorState.state === 'active' ? 'icon-port-array-full' : 'icon-port-array';
  return editorState.state === 'active' ? 'icon-port-active' : 'icon-port';
});
//图标颜色
const portColor = computed(() => {
  return instance.value.define.paramType?.define?.typeColor || 'rgb(250, 250, 250)';
});

function onDeleteParam() {

}

//#region 鼠标事件
function onPortMouseEnter() {
}
function onPortMouseLeave() {
}
function onPortMouseMove(e : MouseEvent) {
}
function onPortMouseDown(e : MouseEvent) {
}
function onPortMouseUp() {
}
function onContextMenu(e : MouseEvent) {
}
//#endregion

</script>