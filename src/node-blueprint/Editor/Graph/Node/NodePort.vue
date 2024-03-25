<!-- eslint-disable vue/no-v-html -->
<template>
  <!--顶部占位-->
  <template v-if="instance?.style.topSpace">
    <NodePort v-for="k of instance.style.topSpace" :key="k" /> 
  </template>
  <Tooltip v-if="instance">
    <!--端口-->
    <div 
      :class="[
        'node-port',
        instance.state
      ]"
    >
      <div v-if="instance.direction === 'output' && instance.style.forceEditorControlOutput" class="editor node-custom-editor">
        <!-- 编辑器 -->
        <NodePortParamEditor :port="instance" />
      </div>
      <div 
        class="default-content"
        @contextmenu="onContextMenu($event)"
        @mouseenter="onPortMouseEnter"
        @mouseleave="onPortMouseLeave"
        @mousedown="onPortMouseDown($event)"
      >
        <!--删除端口按扭-->
        <Tooltip v-if="instance.dyamicAdd && !instance.style.forceNoDelete && instance.direction === 'output'" content="删除参数">
          <Icon class="delete node-editor-no-move" icon="icon-close" @click="onDeleteParam" />
        </Tooltip>
        <!--标题-->
        <span 
          v-if="instance.direction === 'output'"
          :style="{ minWidth: instance.parent.style.outputPortMinWidth }"
        >
          {{ instance.name }}
        </span>
        <!--异步图标-->
        <Icon v-show="instance.isAsync" class="async" icon="icon-port-async" />
        <!--连接图标-->
        <div ref="portDot" class="connect-dot">
          <Icon v-show="instance.state==='error'" class="dot error" icon="icon-close" />
          <Icon v-show="instance.state==='success'" class="dot success" icon="icon-select-bold" />
          <!--普通状态图标-->
          <NodeParamIconRender 
            v-if="instance.state==='normal' || instance.state==='active'"
            :port="instance"
            :type="instance.paramType"
          />
        </div>
        <!--文字-->
        <span
          v-if="instance.direction === 'input'" 
          :style="{ minWidth: instance.parent.style.inputPortMinWidth }"
        >
          {{ instance.name }}
        </span>
        <!--删除端口按扭-->
        <Tooltip v-if="instance.dyamicAdd && !instance.style.forceNoDelete && instance.direction === 'input'" content="删除参数">
          <Icon class="delete node-editor-no-move" icon="icon-close" @click="onDeleteParam" />
        </Tooltip>
      </div>
      <div 
        v-if="!instance.style.forceNoEditorControl && instance.direction === 'input' 
          && (!instance.isConnected || instance.style.forceEditorControlOutput)" 
        class="editor node-custom-editor"
      >
        <!-- 编辑器 -->
        <NodePortParamEditor :port="instance" />
      </div>
    </div>
    <!--工具提示-->
    <template #content>
      <h5>{{ !instance.name ? (instance.direction == 'input' ? '入口' : '出口') : instance.name }}</h5>
      <span class="text-secondary">
        <small v-html="instance.description" />
      </span>
      <span>
        <br>类型：
        <span
          v-if="instance.paramType" 
          v-html="instance.paramType.toUserFriendlyName() + '<br/>(' + instance.paramType.toString() + ')'"
        />
        <span v-else class="text-danger">未知</span>
      </span>
      <span v-if="instance.isAsync">
        <br>
        <Icon icon="icon-async" />
        该端口执行是异步调用的
      </span>
    </template>
  </Tooltip>
  <!--空白占位符-->
  <div 
    v-else 
    class="node-port space" 
  />
</template>

<script lang="ts" setup>
import { toRefs, type PropType, inject, ref } from 'vue';
import Tooltip from '../../Nana/Tooltip/Tooltip.vue';
import Icon from '../../Nana/Icon.vue';
import NodePortParamEditor from './NodePortParamEditor.vue';
import NodeParamIconRender from '../../Components/Small/NodeParamIconRender.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import type { NodeGraphEditorInternalContext } from '../NodeGraphEditor';
import type { NodePortEditor } from '../Flow/NodePortEditor';
import type { NodeEditor } from '../Flow/NodeEditor';
import { createMouseDragHandler } from '../Editor/MouseHandler';
import { isMouseEventInNoDragControl } from '../Editor/EditorMouseHandler';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';

const props = defineProps({
  instance: {
    type: Object as PropType<NodePortEditor>,
    default: null,
  },
});
const {
  instance,
} = toRefs(props);

const emit = defineEmits([ 'deletePort' ]);

const context = inject<NodeGraphEditorInternalContext>('NodeGraphEditorContext');
const portDot = ref<HTMLElement>();

//#region 位置钩子

const dotPos = new Vector2();

if (instance.value)
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
  emit('deletePort', instance.value);
}

//#region 鼠标事件

const connectDragHandler = createMouseDragHandler({
  onDown(e) {
    if (!isMouseEventInNoDragControl(e)) {
      const parent = instance.value.parent as NodeEditor;
      parent.mouseConnectingPort = true;

      if(e.button === 0) {
        context?.setCursor('crosshair')
        context?.startConnect(instance.value);
        context?.updateConnectEnd(new Vector2(e.x, e.y));
        return true;
      }
    }
    return false;
  },
  onMove(downPos, movedPos, e) {
    if(e.button === 0) {
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
  e.preventDefault();
  e.stopPropagation();
  context?.showPortRightMenu(instance.value, new Vector2(e.x, e.y));
}

//#endregion

</script>