<template>
  <div v-show="showDropLayout" class="dock-drop-layout">    
    <!--拖动高亮区域-->
    <div v-if="dropStyleRegion" class="drag-light-box" :style="{ 
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
import { Rect } from "@/model/Rect";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
@Component
export default class DockDropLayout extends Vue {
  @Prop({default:false}) showDropLayout : boolean;
  @Prop({default:false}) showDropTop : boolean;
  @Prop({default:false}) showDropBottom : boolean;
  @Prop({default:false}) showDropLeft : boolean;
  @Prop({default:false}) showDropRight : boolean;
  @Prop({default:false}) showDropMiddle : boolean;
  @Prop({default:false}) showDropLeftDep : boolean;
  @Prop({default:false}) showDropRightDep : boolean;
  @Prop({default:false}) showDropTopDep : boolean;
  @Prop({default:false}) showDropBottomDep : boolean;
  @Prop({default:false}) dropInRegion : Rect;
  @Prop({default:false}) dropStyleRegion : Rect;
}
</script>