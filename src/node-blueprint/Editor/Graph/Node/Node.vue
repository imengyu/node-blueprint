<template>
  <Tooltip 
    v-if="instance" 
    :enable="!instance.style.noTooltip && instance.style.titleState === 'hide'"
  >
    <template #content>
      <h4>{{ instance.define.name }}</h4>
      <p>{{ instance.define.description }}</p>
    </template>
    <div 
      ref="nodeRef"
      :class="['node-block',
               (instance.selected ? 'selected ' : ''),
               (instance.style.customClassNames),
               (twinkleActive ? 'actived' : ''),
               ...appendClass
      ]"
      :style="{
        left: `${instance.position.x}px`,
        top: `${instance.position.y}px`,
        width: (instance.style.userResize === 'width' || instance.style.userResize === 'all') ? (`${instance.customSize.x}px`) : 'auto',
        height: (instance.style.userResize === 'height' || instance.style.userResize === 'all') ? (`${instance.customSize.y}px`) : 'auto',
        minWidth: instance.style.minWidth > 0 ? `${instance.style.minWidth}px` : '',
        minHeight: instance.style.minHeight > 0 ? `${instance.style.minHeight}px` : '',
        maxWidth: instance.style.maxWidth > 0 ? `${instance.style.maxWidth}px` : '',
        maxHeight: instance.style.maxHeight > 0 ? `${instance.style.maxHeight}px` : '',
        cursor: cursor,
      }"
      @mousedown="onMouseDown($event)"
      @mouseenter="onMouseEnter($event)"
      @mouseleave="onMouseLeave($event)"
      @mousemove="onMouseMove($event)"
      @mouseup="onMouseUp($event)"
      @mousewheel="onMouseWhell($event)"
      @contextmenu="onContextmenu($event)"
    >
      <!--注释区域-->
      <div
        v-show="instance.markOpen && !instance.style.noComment" 
        class="node-block-comment node-editor-no-move"
        :style="{ top: commentTop }"
      >
        <span ref="commentInputPlaceHolder" class="node-block-comment-place-holder" @click="onCommentInputPlaceHolderClick">点击添加注释</span>
        <div 
          ref="commentInput"
          class="node-block-comment-text node-editor-no-move" 
          contenteditable="true"
          @input="onCommentInputInput"
          @blur="onCommentInputBlur"
          @wheel="onCommentWhell"
        />
        <Tooltip content="隐藏注释气泡">
          <a class="close" @click="closeComment">
            <Icon icon="icon-close-bold" />
          </a>
        </Tooltip>
      </div>
      <Tooltip content="打开注释气泡">
        <a 
          v-show="!instance.markOpen && !instance.style.noComment"
          class="node-block-comment-open" 
          @click="openComment"
        >
          <Icon icon="icon-qipao" />
        </a>
      </Tooltip>
      <!--标题和图标-->
      <Tooltip 
        v-if="instance" 
        :enable="!instance.style.noTooltip"
      >
        <template #content>
          <h4>{{ instance.define.name }}</h4>
          <p>{{ instance.define.description }}</p>
        </template>
        <div 
          :class="'node-block-header state-'+(instance.style.titleState)"
          :style="{
            color: instance.style.titleColor,
            backgroundColor: instance.style.titleBakgroundColor,
          }"
        >
          <NodeIconImageRender 
            v-show="!instance.style.noLogo"
            class="logo" 
            :imageUrlOrIcon="instance.style.logo || DefaultBlockLogo"
            :size="20"
          />
          <div class="title">{{ instance.define.name }}</div>
          
          <NodeIconImageRender
            class="logo-right"
            :imageUrlOrIcon="instance.style.logoRight"
            :size="32"
          />
          <NodeIconImageRender
            class="logo-bottom"
            :imageUrlOrIcon="instance.style.logoBottom"
            :size="16"
          />
        </div>
      </Tooltip>
      <!--断点指示-->
      <div 
        v-show="instance.breakpoint!=='none'"
        :class="'breakpoint-status'"
      >
        <Icon 
          :icon="(instance.breakpoint==='enable'?'icon-breakpoint-active':
            (instance.breakpoint==='disable'?'icon-breakpoint':''))"
        />
      </div>
      <div 
        v-show="instance.breakpointTriggered"
        class="breakpoint-arrow"
      >
        <Icon icon="icon-arrow-down-filling" />
      </div>
      <!--背景-->
      <NodeIconImageRender 
        class="background"
        :imageUrlOrIcon="instance.style.logoBackground"
        :size="55"
        :noContainerSize="true"
      >
        <span 
          v-if="typeof instance.style.logoBackground === 'string' 
            && instance.style.logoBackground.startsWith('title:')"
          class="big-title" 
        >
          {{ instance.style.logoBackground.substring(6) }}
        </span>
      </NodeIconImageRender>
      <!--自定义编辑器区域-->
      <NodeCustomEditorWrapper
        :node="instance"
        :create-editor-function="instance.events.onCreateCustomEditor"
      />
      <!--主端口区域-->
      <div v-if="instance.inputPortCount > 0 || instance.outputPortCount > 0" class="node-block-base">
        <div class="node-block-ports">
          <div class="left">
            <NodePort v-for="[guid,port] in instance.inputPorts" :key="guid" :instance="(port as NodePortEditor)" @deletePort="(p) => $emit('deletePort', p)" />
            <SmallButton v-if="instance.define.userCanAddInputExecute" icon="icon-add-behavor-port" @click="onUserAddPort('input', 'execute')">添加引脚</SmallButton>
            <SmallButton v-if="instance.define.userCanAddInputParam" icon="icon-add-bold" @click="onUserAddPort('input', 'param')">添加参数</SmallButton>
          </div>
          <div class="right">
            <NodePort v-for="[guid,port] in instance.outputPorts" :key="guid" :instance="(port as NodePortEditor)" @deletePort="(p) => $emit('deletePort', p)" />
            <SmallButton v-if="instance.define.userCanAddOutputExecute" icon="icon-add-behavor-port" iconPlace="after" @click="onUserAddPort('output', 'execute')">添加引脚</SmallButton>
            <SmallButton v-if="instance.define.userCanAddOutputParam" icon="icon-add-bold" iconPlace="after" @click="onUserAddPort('output', 'param')">添加参数</SmallButton>
          </div>
        </div>
      </div>
      <!--右下角拖拽-->
      <div v-if="instance.style.userResize" class="node-size-dragger" />
    </div>
  </Tooltip>
</template>

<script lang="ts" setup>
import { onMounted, ref, toRefs, type PropType, inject, nextTick } from 'vue';
import Tooltip from '../../Nana/Tooltip/Tooltip.vue';
import Icon from '../../Nana/Icon.vue';
import NodePort from './NodePort.vue';
import SmallButton from '../../Components/SmallButton.vue';
import NodeIconImageRender from './NodeIconImageRender.vue';
import StringUtils from '@/node-blueprint/Base/Utils/StringUtils';
import DefaultBlockLogo from '../../Images/BlockIcon/function.svg'
import NodeCustomEditorWrapper from './NodeCustomEditorWrapper.vue';
import type { ChunkedPanel } from '../Cast/ChunkedPanel';
import type { NodeGraphEditorInternalContext, NodeGraphEditorViewport } from '../NodeGraphEditor';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { NodePortEditor } from '../Flow/NodePortEditor';
import type { NodeEditor } from '../Flow/NodeEditor';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import { SIZE_LEFT, SIZE_TOP, SIZE_BOTTOM, SIZE_RIGHT } from './NodeDefines';
import { createMouseDragHandler } from '../Editor/MouseHandler';
import { isMouseEventInNoDragControl } from '../Editor/EditorMouseHandler';
import { printWarning } from '@/node-blueprint/Base/Logger/DevLog';

const props = defineProps({
  instance: {
    type: Object as PropType<NodeEditor>,
    required: true,
  },
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
  chunkedPanel: {
    type: Object as PropType<ChunkedPanel>,
    default: null,
  },
});
const {
  instance,
  viewPort,
  chunkedPanel,
} = toRefs(props);

defineEmits([ 'deletePort' ]);

const context = inject('NodeGraphEditorContext') as NodeGraphEditorInternalContext;

const TAG = 'Node';
const cursor = ref('');
const appendClass = ref<string[]>([]);
const nodeRef = ref<HTMLDivElement>();

//初始化

onMounted(() => {
  instance.value.editorHooks.callbackGetRealSize = getRealSize;
  instance.value.editorHooks.callbackTwinkle = twinkle;
  instance.value.editorHooks.callbackGetCurrentSizeType = getCurrentSizeType;
  instance.value.editorHooks.callbackUpdateNodeForMoveEnd = updateNodeForMoveEnd;
  instance.value.editorHooks.callbackGetLastMovedBlock = () => lastMovedBlock;
  instance.value.editorHooks.callbackOnAddToEditor = () => {
    instance.value.chunkInfo.data = instance.value.uid;
    chunkedPanel.value.addInstance(instance.value.chunkInfo);
    updateRegion();
  };
  instance.value.editorHooks.callbackUpdateRegion = updateRegion;
  instance.value.editorHooks.callbackOnRemoveFromEditor = () => {
    chunkedPanel.value.removeInstance(instance.value.chunkInfo);
  };
  instance.value.editorHooks.callbackAddClass = (cls) => {
    appendClass.value.push(cls);
  };
  nextTick(() => {
    instance.value.events.onEditorCreate?.(instance.value, nodeRef.value);
    updateComment();
  })
});

//#region 区块大小与区块功能

/**
 * 获取真实节点大小
 */
function getRealSize() {
  if(nodeRef.value)
    return new Vector2(nodeRef.value.offsetWidth, nodeRef.value.offsetHeight);
  return new Vector2();
}
/**
 * 更新单元编辑器区块信息。在更改位置、大小之后必须调用才能让区块检测器正常检测。
 */
function updateRegion() {
  const realSize = getRealSize();
  const chunkInfo = instance.value.chunkInfo;

  chunkInfo.rect.set( 
    instance.value.position.x,
    instance.value.position.y,
    realSize.x,
    realSize.y,
  );
  chunkedPanel.value.updateInstance(chunkInfo);

  //同时更新连接到节点的连接线位置
  instance.value.connectors.forEach((c) => {
    if (c.chunkInfo) {
      c.chunkInfo.rect.set(c.updateRegion());
      chunkedPanel.value.updateInstance(c.chunkInfo);
    }
  });
}
/**
 * 单元位置或大小更改，刷新单元
 */
function updateNodeForMoveEnd() {
  //移动后更新区块
  updateRegion();
  //如果有选择其他块，则同时更新区块
  const selectedNodes = context.getSelectNodes();
  for (const n of selectedNodes) {
    const node = n as NodeEditor;
    if (node !== instance.value) {
      node.saveLastNodePos();
      node.editorHooks.callbackUpdateRegion?.();
    }
  }
}

//#endregion

//#region 闪烁

let timerTwinkle = 0;
const twinkleActive = ref(false);

function twinkle(time: number) {
  //闪烁
  if(timerTwinkle > 0) clearInterval(timerTwinkle);
  timerTwinkle = setInterval(() => twinkleActive.value = !twinkleActive.value, 300) as unknown as number;
  setTimeout(() => {
    twinkleActive.value = false;
    clearInterval(timerTwinkle);
    timerTwinkle = 0;
  }, time);
}

//#endregion

//#region 注释操作

const commentTop = ref('');
const commentInput = ref<HTMLDivElement>();
const commentInputPlaceHolder = ref<HTMLDivElement>();

function updateComment() {
  if(instance.value.style.noComment) 
    return;
  if(commentInput.value && commentInputPlaceHolder.value) {
    commentInput.value.innerText = instance.value.markContent;
    commentInputPlaceHolder.value.style.display = StringUtils.isNullOrBlank(instance.value.markContent) ? '' : 'none';
  }
  setTimeout(() => onCommentInputInput(), 200);
}
function onCommentInputPlaceHolderClick() {
  if(commentInputPlaceHolder.value) commentInputPlaceHolder.value.style.display = 'none';
  if(commentInput.value) commentInput.value.focus();
}
function onCommentInputInput() {
  if(commentInput.value) 
    commentTop.value = -(commentInput.value.offsetHeight - 23 + 40) + 'px';
}
function onCommentInputBlur() {
  if(commentInput.value && instance.value) {
    instance.value.markContent = commentInput.value.innerText;
    updateComment();
  }
}
function onCommentWhell(e: WheelEvent) {
  e.preventDefault();
}
function closeComment() {
  instance.value.markOpen = false;
  updateComment();
}
function openComment() {
  instance.value.markOpen = true;
  updateComment();
}

//#endregion

//#region 调整大小
  
let lastResized = false;
let currentSizeType = 0;

function updateCursor() {
  if(currentSizeType > 0) {
    if(
      (((currentSizeType & SIZE_LEFT) === SIZE_LEFT) && ((currentSizeType & SIZE_TOP) === SIZE_TOP))
      || (((currentSizeType & SIZE_BOTTOM) === SIZE_BOTTOM) && ((currentSizeType & SIZE_RIGHT) === SIZE_RIGHT))
    )
      cursor.value = 'nwse-resize';
    else if(
      (((currentSizeType & SIZE_LEFT) === SIZE_LEFT) && ((currentSizeType & SIZE_BOTTOM) === SIZE_BOTTOM))
      || (((currentSizeType & SIZE_TOP) === SIZE_TOP) && ((currentSizeType & SIZE_RIGHT) === SIZE_RIGHT))
    )
      cursor.value = 'nesw-resize';
    else if(((currentSizeType & SIZE_TOP) === SIZE_TOP) || ((currentSizeType & SIZE_BOTTOM) === SIZE_BOTTOM))
      cursor.value = 'ns-resize';
    else if(((currentSizeType & SIZE_LEFT) === SIZE_LEFT) || ((currentSizeType & SIZE_RIGHT) === SIZE_RIGHT))
      cursor.value = 'ew-resize';
    else 
      cursor.value = 'default';
  } else if(mouseDown) {
    cursor.value = 'move';
  } else {
    cursor.value = 'default';
  }
}
function testInResize(e : MouseEvent) {

  const _instance = instance.value;
  const pos = new Vector2();
  const size = getRealSize();

  viewPort.value.screenPointToViewportPoint(new Vector2(e.x, e.y), pos);
  pos.substract(_instance.position);

  currentSizeType = 0;
  if(pos.x >= 0 && pos.y >= 0 && pos.x <= size.x + 3 && pos.y <= size.y + 3) {
    if(pos.x <= 6) currentSizeType |= SIZE_LEFT;
    else if(pos.x > size.x - 6) currentSizeType |= SIZE_RIGHT;
    if(pos.y <= 6) currentSizeType |= SIZE_TOP;
    else if(pos.y > size.y - 6) currentSizeType |= SIZE_BOTTOM;

    if(pos.x >= size.x - 20 && pos.y >= size.y - 20)
      currentSizeType |= (SIZE_BOTTOM | SIZE_RIGHT);
  }

  updateCursor();

  return currentSizeType > 0;
}
function getCurrentSizeType() { return currentSizeType; }

function onMouseResize(e : MouseEvent) {
  if(currentSizeType) { 
    const _instance = instance.value; 
    const lastBlockPos = _instance.lastBlockPos;
    const lastBlockSize = _instance.lastBlockSize;
    const size = new Vector2(_instance.customSize.x, _instance.customSize.y);
    const mousePos = new Vector2();
    viewPort.value.screenPointToViewportPoint(new Vector2(e.x, e.y), mousePos);

    if (((currentSizeType & SIZE_LEFT) === SIZE_LEFT) && ((currentSizeType & SIZE_TOP) === SIZE_TOP)) {
      //左上
      size.x = (lastBlockPos.x + lastBlockSize.x - mousePos.x);
      size.y = (lastBlockPos.y + lastBlockSize.y - mousePos.y);
      _instance.position = mousePos;
    }
    else if(((currentSizeType & SIZE_BOTTOM) === SIZE_BOTTOM) && ((currentSizeType & SIZE_RIGHT) === SIZE_RIGHT)) {
      //右下
      size.x = (mousePos.x - lastBlockPos.x);
      size.y = (mousePos.y - lastBlockPos.y);
    }
    else if (((currentSizeType & SIZE_LEFT) === SIZE_LEFT) && ((currentSizeType & SIZE_BOTTOM) === SIZE_BOTTOM)) {
      //左下
      size.x = (lastBlockSize.x + lastBlockSize.x - mousePos.x);
      size.y = (mousePos.y - lastBlockPos.y);
      _instance.position = new Vector2(mousePos.x, _instance.position.y);
    }
    else if (((currentSizeType & SIZE_TOP) === SIZE_TOP) && ((currentSizeType & SIZE_RIGHT) === SIZE_RIGHT)) {
      //右上
      size.x = (mousePos.x - lastBlockPos.x);
      size.y = (lastBlockPos.y + lastBlockSize.y - mousePos.y);
      _instance.position = new Vector2(_instance.position.x, mousePos.y);
    }
    else if((currentSizeType & SIZE_TOP) === SIZE_TOP)  {
      //上
      size.y = (lastBlockPos.y + lastBlockSize.y - mousePos.y);
      _instance.position = new Vector2(_instance.position.x, mousePos.y);
    }
    else if((currentSizeType & SIZE_BOTTOM) === SIZE_BOTTOM) {
      //下
      size.y = (mousePos.y - lastBlockPos.y);
    }
    else if((currentSizeType & SIZE_LEFT) === SIZE_LEFT) {
      //左
      size.x = (lastBlockPos.x + lastBlockSize.x - mousePos.x);
      _instance.position = new Vector2(mousePos.x, _instance.position.y);
    }
    else if((currentSizeType & SIZE_RIGHT) === SIZE_RIGHT) {
      //右
      size.x = (mousePos.x - lastBlockPos.x);
    }            
    
    if(size.x < _instance.style.minWidth) size.x = _instance.style.minWidth;
    if(size.y < _instance.style.minHeight) size.y = _instance.style.minHeight;

    _instance.customSize = size;
    lastResized = true;

    return true;
  }
  return false;
}
const resizeMouseHandler = createMouseDragHandler({
  onDown(e) {
    lastResized = false;
    mouseDown = true;
    if(e.buttons === 1)
      return testInResize(e);
    return false;
  },
  onMove(downPos, movedPos, e) {
    lastResized = true;
    onMouseResize(e);
  },
  onUp() {
    mouseDown = false;
    //大小更改后更新区块
    if(lastResized || !getRealSize().equal(instance.value.lastBlockSize)) {
      updateRegion();
    }
  }
});

//#endregion

//#region 鼠标事件

let mouseDown = false;
let lastMovedBlock = false;

const dragMouseHandler = createMouseDragHandler({
  onDown() {
    lastResized = false;
    mouseDown = true;
    return true;
  },
  onMove(downPos, movedPos, e) {
    if(!mouseDown)
      return;
    
    if(e.buttons === 1) {
      const movedScaledDistance = new Vector2(
        (viewPort.value.scaleScreenSizeToViewportSize(movedPos.x)),
        (viewPort.value.scaleScreenSizeToViewportSize(movedPos.y))
      );
      const pos = new Vector2(instance.value.lastBlockPos);
      pos.add(movedScaledDistance);

      if(pos.x !== instance.value.position.x || pos.y !== instance.value.position.y) {

        if(!instance.value.selected) {
          //如果当前块没有选中，在这里切换选中状态
          context.selectNode(instance.value, context.isKeyControlDown() ? true : false);
        }
        else {
          //选中后，如果有选择其他块，则同时移动其他块
          const selectedNodes = context.getSelectNodes();
          for (const node of selectedNodes) {
            if (node !== instance.value) {
              const posOfThisBlock = new Vector2((node as NodeEditor).lastBlockPos);
              posOfThisBlock.add(movedScaledDistance);
              node.position.set(posOfThisBlock)
            }
          }
        }

        //移动
        lastMovedBlock = true;
        instance.value.position = pos;

        //同时更新连接到节点的连接线位置
        instance.value.connectors.forEach((c) => {
          if (c.chunkInfo) {
            c.chunkInfo.rect.set(c.updateRegion());
            chunkedPanel.value.updateInstance(c.chunkInfo);
          }
        });
      }
    }
  },
  onUp() {
    mouseDown = false;

    if (lastMovedBlock) {
      updateNodeForMoveEnd();
    } else {
      //未移动则检查/如果当前块没有选中，在这里切换选中状态
      context.selectNode(instance.value, context.isKeyControlDown() ? true : false);
    }
  },
})

function onMouseDown(e : MouseEvent) {
  lastMovedBlock = false;
  instance.value.saveLastNodePos();
  instance.value.lastBlockSize.set(getRealSize());

  if (isMouseEventInNoDragControl(e))
    return;
  if (instance.value.style.userResize && resizeMouseHandler(e))
    return;
  if (instance.value.events.onEditorMoseEvent?.(instance.value, context, 'down', e))
    return;
  if (dragMouseHandler(e))
    return;

  updateCursor();
  e.stopPropagation();
}
function onMouseWhell(e : WheelEvent) {
  if(isMouseEventInNoDragControl(e)) 
    e.stopPropagation();
}
function onMouseMove(e : MouseEvent) { 
  if (instance.value.events.onEditorMoseEvent?.(instance.value, context, 'move', e))
    return;
  if (!mouseDown) {
    if(instance.value.style.userResize) 
      testInResize(e);
    return;
  }
}
function onMouseUp(e : MouseEvent) { 
  instance.value.events.onEditorMoseEvent?.(instance.value, context, 'up', e);
}
function onMouseEnter(e : MouseEvent) {
  instance.value.events.onEditorMoseEvent?.(instance.value, context, 'enter', e);
}
function onMouseLeave(e : MouseEvent) {
  instance.value.events.onEditorMoseEvent?.(instance.value, context, 'leave', e);
}

//#endregion

//#region 右键菜单

function onContextmenu(e : MouseEvent) {
  e.preventDefault();
  e.stopPropagation();
  context.showNodeRightMenu(instance.value, new Vector2(e.x, e.y));
  return false;
}

//#endregion

//#region 添加端口

async function onUserAddPort(direction : NodePortDirection, type : 'execute'|'param') {
  //添加端口
  const ret = props.instance.events.onUserAddPort?.(props.instance, { direction, type });
  if (!ret) {
    printWarning(TAG, `Faild to execute onUserAddPort, events.onUserAddPort configue not right.`);
    return;
  }
  const port = await ret;
  if (port)
    props.instance.addPort(port, true);
}
//#endregion 

</script>