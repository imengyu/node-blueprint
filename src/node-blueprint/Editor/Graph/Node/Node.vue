<template>
  <div v-if="instance" 
    ref="nodeRef"
    :class="['flow-block',
      (instance.editorState.selected ? 'selected ' : ''),
      (instance.style.customClassNames),
      (twinkleActive ? 'actived' : ''),
    ]"
    :style="{
      left: `${instance.position.x}px`,
      top: `${instance.position.y}px`,
      width: (instance.style.userResize == 'width' || instance.style.userResize == 'all') ? (`${instance.customSize.x}px`) : 'auto',
      height: (instance.style.userResize == 'height' || instance.style.userResize == 'all') ? (`${instance.customSize.y}px`) : 'auto',
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
    @mousewheel="onMouseWhell($event)"
    @mouseup="onMouseUp($event)"
    @contextmenu="onContextmenu($event)">
    <!--注释区域-->
    <div
      class="flow-block-comment flow-block-no-move" 
      v-show="instance.markOpen && !instance.style.noComment"
      :style="{ top: commentTop }"
    >
      <span class="flow-block-comment-place-holder" ref="commentInputPlaceHolder" @click="onCommentInputPlaceHolderClick">点击添加注释</span>
      <div 
        ref="commentInput"
        class="flow-block-comment-text flow-block-no-move" 
        contenteditable="true"
        @input="onCommentInputInput"
        @blur="onCommentInputBlur">
      </div>
      <Tooltip content="隐藏注释气泡">
        <a
          class="flow-block-comment-open" 
          @click="closeComment"
        >
          <Icon icon="icon-close-" />
        </a>
      </Tooltip>
    </div>
    <Tooltip content="打开注释气泡">
      <a 
        v-show="!instance.markOpen && !instance.style.noComment"
        class="flow-block-comment-open" 
        @click="openComment"
      >
        <Icon icon="icon-qipao" />
      </a>
    </Tooltip>
    <!--标题和图标-->
    <Tooltip
      :enable="!instance.style.noTooltip"
      :content="`<h5>${instance.define.name}</h5>${instance.define.description}`"
    >
      <div 
        :class="'flow-header state-'+(instance.style.titleState)"
        :style="{
          color: instance.style.titleColor,
          backgroundColor: instance.style.titleBakgroundColor,
        }"
      >
        <div class='logo' v-show="!instance.style.noLogo" :style="{ backgroundImage: `url('${instance.style.logo || DefaultBlockLogo}')` }" />
        <div class='title'>{{ instance.define.name }}</div>

        <div class="logo-right" :style="{ display: 'inline-block', backgroundImage: `url('${instance.style.logoRight}')` }"></div>
        <div class="logo-bottom" :style="{ display: 'inline-block', backgroundImage: `url('${instance.style.logoBottom}')` }"></div>
      </div>
    </Tooltip>
    <div 
      v-show="instance.breakpoint!=='none'"
      :class="'breakpoint-status iconfont'+
        (instance.breakpoint==='enable'?' icon-breakpoint-active':'')+
        (instance.breakpoint==='disable'?' icon-breakpoint':'')"
    >
    </div>
    <div 
      v-show="instance.editorState.breakpointTriggered"
      class="breakpoint-arrow iconfont icon-arrow-down-"></div>
    <!--背景-->
    <div 
      class="background"
      :style="{
        background: (typeof instance.style.logoBackground==='string' && !instance.style.logoBackground.startsWith('title:')) ? `url(${instance.style.logoBackground})` : '',
      }">
      <span class="big-title" v-if="typeof instance.style.logoBackground==='string'&&instance.style.logoBackground.startsWith('title:')">
        {{ instance.style.logoBackground.substr(6) }}
      </span>
    </div>
    <!--TODO: 自定义编辑器区域-->
    <!--TODO: 主区域-->
  </div>
</template>

<script lang="ts" setup>
import { ref, toRefs, type PropType } from 'vue';
import Tooltip from '../../Base/Tooltip.vue';
import Icon from '../../Base/Icon.vue';
import StringUtils from '@/node-blueprint/Base/Utils/StringUtils';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import DefaultBlockLogo from '../../Images/BlockIcon/function.svg'
import type { Node } from '@/node-blueprint/Base/Flow/Node/Node';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import { SIZE_LEFT, SIZE_TOP, SIZE_BOTTOM, SIZE_RIGHT } from './NodeDefines';
import type { NodeGraphEditorViewport } from '../NodeGraphEditor';
import { createMouseDragHandler } from '../Editor/MouseHandler';

const props = defineProps({
  instance: {
    type: Object as PropType<Node>,
    required: true,
  },
  viewPort: {
    type: Object as PropType<NodeGraphEditorViewport>,
    default: null,
  },
});
const {
  instance,
  viewPort,
} = toRefs(props);

const cursor = ref('');
const nodeRef = ref<HTMLDivElement>();

//#region 

function getRealSize() {
  if(nodeRef.value)
    return new Vector2(nodeRef.value.offsetWidth, nodeRef.value.offsetHeight);
  return new Vector2();
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
      (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_TOP) == SIZE_TOP))
      || (((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT))
    )
      cursor.value = 'nwse-resize';
    else if(
      (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM))
      || (((currentSizeType & SIZE_TOP) == SIZE_TOP) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT))
    )
      cursor.value = 'nesw-resize';
    else if(((currentSizeType & SIZE_TOP) == SIZE_TOP) || ((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM))
      cursor.value = 'ns-resize';
    else if(((currentSizeType & SIZE_LEFT) == SIZE_LEFT) || ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT))
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
    const size = new Vector2(_instance.customSize.x, _instance.customSize.y);
    const mousePos = new Vector2();
    viewPort.value.screenPointToViewportPoint(new Vector2(e.x, e.y), mousePos);

    if (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_TOP) == SIZE_TOP)) {
      //左上
      size.x = (lastBlockPos.x + lastBlockSize.x - mousePos.x);
      size.y = (lastBlockPos.y + lastBlockSize.y - mousePos.y);
      _instance.position = mousePos;
    }
    else if(((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT)) {
      //右下
      size.x = (mousePos.x - lastBlockPos.x);
      size.y = (mousePos.y - lastBlockPos.y);
    }
    else if (((currentSizeType & SIZE_LEFT) == SIZE_LEFT) && ((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM)) {
      //左下
      size.x = (lastBlockSize.x + lastBlockSize.x - mousePos.x);
      size.y = (mousePos.y - lastBlockPos.y);
      _instance.position = new Vector2(mousePos.x, _instance.position.y);
    }
    else if (((currentSizeType & SIZE_TOP) == SIZE_TOP) && ((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT)) {
      //右上
      size.x = (mousePos.x - lastBlockPos.x);
      size.y = (lastBlockPos.y + lastBlockSize.y - mousePos.y);
      _instance.position = new Vector2(_instance.position.x, mousePos.y);
    }
    else if((currentSizeType & SIZE_TOP) == SIZE_TOP)  {
      //上
      size.y = (lastBlockPos.y + lastBlockSize.y - mousePos.y);
      _instance.position = new Vector2(_instance.position.x, mousePos.y);
    }
    else if((currentSizeType & SIZE_BOTTOM) == SIZE_BOTTOM) {
      //下
      size.y = (mousePos.y - lastBlockPos.y);
    }
    else if((currentSizeType & SIZE_LEFT) == SIZE_LEFT) {
      //左
      size.x = (lastBlockPos.x + lastBlockSize.x - mousePos.x);
      _instance.position = new Vector2(mousePos.x, _instance.position.y);
    }
    else if((currentSizeType & SIZE_RIGHT) == SIZE_RIGHT) {
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

//#endregion

//#region 鼠标事件

let mouseDown = false;
let lastMovedBlock = false;
const lastBlockPos = new Vector2();
const lastBlockSize = new Vector2();

const dragMouseHandler = createMouseDragHandler({
  onDown(e) {
    lastResized = false;
    mouseDown = false;
    if(instance.value.style.userResize) 
      return !testInResize(e);
    
    mouseDown = true;
    return true;
  },
  onMove(downPos, movedPos, e) {
    if(!mouseDown)
      return;
    
    if(e.buttons == 1){ 
      if(!onMouseResize(e) /*Handle mouse resize*/) { 
        let zoom = viewPort.value.scale;
        let pos = new Vector2(
          lastBlockPos.x + (movedPos.x * zoom),
          lastBlockPos.y + (movedPos.y * zoom)
        );
        if(pos.x != instance.value.position.x || pos.y != instance.value.position.y) {

          /*
          TODO: 如果当前块没有选中，在这里切换选中状态
          if(!_instance.selected) {
            let multiSelectBlocks = _editor.getSelectBlocks();
            if(multiSelectBlocks.length == 0 || !multiSelectBlocks.contains(_instance as BluePrintFlowBlock)) 
              _editor.selectBlock(_instance as BluePrintFlowBlock, false);
            else 
              _editor.selectBlock(_instance as BluePrintFlowBlock, true);
          }*/

          //移动
          lastMovedBlock = true;
          instance.value.position = pos;
        }
      }
      return;
    }
  },
  onUp() {
    mouseDown = false;
  },
})

function testIsDownInControl(e : MouseEvent) {
  return (HtmlUtils.isEventInControl(e));
}
function onMouseDown(e : MouseEvent) {
  lastMovedBlock = false;
  lastBlockPos.set(instance.value.position);
  lastBlockSize.set(getRealSize());

  if(testIsDownInControl(e)) 
    return;

  if (dragMouseHandler(e))
    return;

  updateCursor();
  e.stopPropagation();
}
function onMouseWhell(e : WheelEvent) {
  if(testIsDownInControl(e)) 
    e.stopPropagation();
}
function onMouseMove(e : MouseEvent) {
  if(!mouseDown) {
    if(instance.value.style.userResize) 
      testInResize(e);
    return;
  }
}
function onMouseEnter(e : MouseEvent) {
}
function onMouseLeave(e : MouseEvent) {
}
function onMouseUp(e : MouseEvent) {
  if(testIsDownInControl(e)) {
    //大小更改
    if(!getRealSize().equal(lastBlockSize)) {
      //_instance.updateRegion();
    }
  }
}

//#endregion

//#region 右键菜单

function onContextmenu(e : MouseEvent) {
  e.preventDefault();
  //TODO
  return false;
}

//#endregion

</script>