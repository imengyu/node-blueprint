<template>
  <div v-show="showDropLayout" class="dock-drop-layout">    
    <!--拖动高亮区域-->
    <div v-if="dropStyleRegion" :class="'drag-light-box'+(isFloat?'':' anim')" :style="{ 
      left: dropStyleRegion.x + 'px', 
      top: dropStyleRegion.y + 'px', 
      width: dropStyleRegion.w + 'px', 
      height: dropStyleRegion.h + 'px'
    }"></div>
    <!--拖动箭头区域-->
    <div v-if="dropInRegion" :style="{
      position: 'absolute',
      left: dropInRegion.x + 'px', 
      top: dropInRegion.y + 'px', 
      width: dropInRegion.w + 'px', 
      height: dropInRegion.h + 'px'
    }">
      <div class="drag-arrow-box">
        <div class="dock-drop-square dock-drop-float" data-drag-drop="true" data-direction='float'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropTop" class="dock-drop-square dock-drop-top" data-drag-drop="true" data-direction='top'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropBottom" class="dock-drop-square dock-drop-bottom" data-drag-drop="true" data-direction='bottom'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropLeft" class="dock-drop-square dock-drop-left" data-drag-drop="true" data-direction='left'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropRight" class="dock-drop-square dock-drop-right" data-drag-drop="true" data-direction='right'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropMiddle" class="dock-drop-square dock-drop-middle" data-drag-drop="true" data-direction='middle'>
          <div class="dock-drop-square-box"></div>
          </div>
        <div v-show="showDropLeftDep" class="dock-drop-square dock-drop-left dock-drop-deep" data-drag-drop="true" data-direction='left-dep'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropRightDep" class="dock-drop-square dock-drop-right dock-drop-deep" data-drag-drop="true" data-direction='right-dep'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropTopDep" class="dock-drop-square dock-drop-top dock-drop-deep" data-drag-drop="true" data-direction='top-dep'>
          <div class="dock-drop-square-box"></div>
        </div>
        <div v-show="showDropBottomDep" class="dock-drop-square dock-drop-bottom dock-drop-deep" data-drag-drop="true" data-direction='bottom-dep'>
          <div class="dock-drop-square-box"></div>
        </div>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType } from 'vue'
import { Rect } from '../Common/Rect';

/**
 * 拖动高亮选择框组件
 */
export default defineComponent({
  name: 'DockDropLayout',
  props: {
    isFloat: {
      type: Boolean,
      default: false
    },
    showDropLayout: {
      type: Boolean,
      default: false
    },
    showDropTop: {
      type: Boolean,
      default: false
    },
    showDropBottom: {
      type: Boolean,
      default: false
    },
    showDropLeft: {
      type: Boolean,
      default: false
    },
    showDropRight: {
      type: Boolean,
      default: false
    },
    showDropMiddle: {
      type: Boolean,
      default: false
    },
    showDropLeftDep: {
      type: Boolean,
      default: false
    },
    showDropRightDep: {
      type: Boolean,
      default: false
    },
    showDropTopDep: {
      type: Boolean,
      default: false
    },
    showDropBottomDep: {
      type: Boolean,
      default: false
    },
    dropInRegion: {
      type: Object as PropType<Rect>,
      default: null
    }, 
    dropStyleRegion: {
      type: Object as PropType<Rect>,
      default: null
    }, 
  }
})
</script>

<style lang="scss">
@import "./DockCommonStyles.scss";


//dock 拖拽放置布局
.dock-drop-layout {
  position: absolute;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: 71;
  pointer-events: none;

  .dock-drop-square {
    position: absolute;
    box-sizing: border-box;
    pointer-events: visible;
    z-index: 100;
    width: 32px;
    height: 32px;
    font-family: 'Fredoka One', sans-serif;
    color: #ccc;
    background: rgba(255, 255, 255, 0.2);
    border: 1px solid transparent;
    left: calc(50% - 16px);
    top: calc(50% - 16px);

    &.active {
      border: 1px solid #9812d6;
      background: rgba(177, 39, 241, 0.637);
    }
  
    .dock-drop-square-box {
      box-sizing: border-box;
      border: 1px solid #9e9e9e;
      width: 100%;
      height: 100%;
      pointer-events: none;
    }
    &::before {
      position: absolute;
      width: 100%;
      height: 100%;
      display: block;
      line-height: 30px;
      text-align: center;
    }
  }
  .dock-drop-float {
    z-index: 80;
    left: 0;
    top: 0;
    width: 100%;
    height: 100%;
    border: none;
    opacity: 0.01;
    pointer-events: none;
  }
  .dock-drop-left {
    left: calc(50% - 48px);

    &.dock-drop-deep {
      left: calc(50% - 64px);
      width: 16px;
    }
    &::before {
      content: '>';
      transform: rotate(180deg);
    }
  }
  .dock-drop-right {
    left: calc(50% + 16px);

    &.dock-drop-deep {
      left: calc(50% + 48px);
      width: 16px;
    }

    &::before {
      content: '>';
    }
  }
  .dock-drop-top {
    top: calc(50% - 48px);

    &.dock-drop-deep {
      top: calc(50% - 64px);
      height: 16px;

      &::before {
        line-height: 14px;
      }
    }

    &::before {
      content: '>';
      transform: rotate(270deg);
    }
  }
  .dock-drop-bottom {
    top: calc(50% + 16px);

    &.dock-drop-deep {
      top: calc(50% + 48px);
      height: 16px;

      &::before {
        line-height: 14px;
      }
    }

    &::before {
      content: '>';
      transform: rotate(90deg);
    }
  }
}
//dock 拖拽高亮
.drag-light-box {
  position: absolute;
  background-color: rgba($primary-color-dark, 0.4);
  border: 1.5px solid rgba($primary-color, 0.6);
  pointer-events: none;
  z-index: 0;

  &.anim {
    transition: all ease-in-out 0.2s;
  }
}
</style>
