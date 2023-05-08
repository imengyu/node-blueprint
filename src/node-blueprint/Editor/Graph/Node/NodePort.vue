<template>
  <Tooltip trigger="hover" mutex="NodeToolTip">
    <!--端口-->
    <div 
      v-if="instance" 
      :class="'flow-port '+instance.state"
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
        <Tooltip v-if="instance.dyamicAdd" content="删除参数" mutex="NodeToolTip">
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
        <div ref="portDot" class="connect-dot">
          <Icon v-show="instance.state==='error'" class="dot error" icon="icon-close" />
          <Icon v-show="instance.state==='success'" class="dot success" icon="icon-select-bold" />
          <!--普通状态图标-->
          <template v-if="instance.state==='normal' || instance.state==='active'">
            <VNodeRenderer
              v-if="instance.paramType?.define?.customPortIconRender"
              :render="() => instance.paramType.define!.customPortIconRender!(instance, instance.paramType)"
            />
            <Icon v-else class="dot" :icon="portIcon" :fill="portColor" />
          </template>
        </div>
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
        <span v-if="instance.define.paramType" v-html="
          instance.define.paramType.toUserFriendlyName() + '<br/>(' +
          instance.define.paramType.toString() + ')'
        "></span>
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
import { computed, toRefs, type PropType, inject, ref } from 'vue';
import Tooltip from '../../Base/Tooltip/Tooltip.vue';
import Icon from '../../Base/Icon.vue';
import VNodeRenderer from '../../Base/VNodeRenderer.vue';
import NodePortParamEditor from './NodePortParamEditor.vue';
import type { NodeGraphEditorInternalContext } from '../NodeGraphEditor';
import type { NodePortEditor } from '../Flow/NodePortEditor';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import type { NodeEditor } from '../Flow/NodeEditor';
import { createMouseDragHandler } from '../Editor/MouseHandler';
import { isMouseEventInNoDragControl } from '../Editor/EditorMouseHandler';

const props = defineProps({
  instance: {
    type: Object as PropType<NodePortEditor>,
    required: true,
  },
});
const {
  instance,
} = toRefs(props);

const context = inject<NodeGraphEditorInternalContext>('NodeGraphEditorContext');

//图标
const portIcon = computed(() => {
  const type = instance.value.define.paramType;
  if (!type)
    return 'icon-help-filling';
  const editorState = instance.value;
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

const portDot = ref<HTMLElement>();

//#region 位置钩子

const dotPos = new Vector2();

instance.value.getPortPositionRelative = function() {
  const dot = portDot.value;
  if (!dot)
    return dotPos;
  dotPos.set(
    HtmlUtils.getLeft(dot, 'node-block') + dot.offsetWidth / 2,  
    HtmlUtils.getTop(dot, 'node-block') + dot.offsetHeight / 2 + 4
  );
  return dotPos;
};

//#endregion

function onDeleteParam() {

}

//#region 鼠标事件

const connectDragHandler = createMouseDragHandler({
  onDown(e) {
    if (!isMouseEventInNoDragControl(e)) {
      const parent = instance.value.parent as NodeEditor;
      parent.mouseConnectingPort = true;

      if(e.button == 0) {
        context?.setCursor('crosshair')
        context?.startConnect(instance.value);
        context?.updateConnectEnd(new Vector2(e.x, e.y));
        return true;
      }
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if(e.button == 0) {
      const parent = instance.value.parent as NodeEditor;
      parent.mouseConnectingPort = true;
      context?.updateConnectEnd(new Vector2(e.x, e.y));
    }
  },
  onUp() {
    context?.resetCursor()
    context?.endConnect(instance.value);
  },
})

function onPortMouseEnter() {
  context?.updateCurrentHoverPort(instance.value, true);
}
function onPortMouseLeave() {
  context?.updateCurrentHoverPort(instance.value, false);
}
function onPortMouseDown(e : MouseEvent) {
  connectDragHandler(e);
}
function onContextMenu(e : MouseEvent) {

}

//#endregion

</script>