<template>
  <div class="dock-tab" :data-dock-name="dockData.name">
    <!--tab list-->
    <div 
      ref="tabScroll" 
      :class="'dock-tab-list'+(forbiddenChildePointerEvents?' forbidden-childe-pointer-events':'')" 
      :style="{
        marginTop: `${4}px`,
        height: `${dockHost.tabHeight - 4}px`,
      }"
      @wheel="onTabMouseWheel"
      @dragover.stop="onDragOver"
      @dragenter.stop="onDragEnter"
      @dragleave.stop="onDragLeave"
      @drop="onDrop"
    >
      <DynamicRender
        v-if="dockHost.hasSlot('renderTab')" :render="() => dockHost.renderSlot('renderTab', {
          dockData: dockData,
          panels: dockData.panels,
        })"
      />
      <DockPanelDefaultTab v-else :dockData="dockData" />
    </div>
    <!--tab ghost area for content -->
    <div class="dock-tab-content drag-target-host dock-ghost-area" />
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, onMounted, type PropType, ref, toRefs } from 'vue';
import type { DockHostData } from './DockHostData';
import type { DockData, DockPanel } from './DockLayoutData';
import DockUtils from './DockUtils';
import DockPanelDefaultTab from './DockPanelDefaultTab.vue';
import DynamicRender from './DynamicRender.vue';

/**
 * 面板容器组件
 */
export default defineComponent({
  name: 'DockLayout',
  components: {
    DockPanelDefaultTab,
    DynamicRender,
  },
  props: {
    /**
     * 停靠数据
     */
    dockData: {
      type: Object as PropType<DockData>,
      default: null
    },
  },
  setup(props) {

    const { dockData } = toRefs(props);
    const dockHost = inject('dockHost') as DockHostData;
    const tabScroll = ref<HTMLElement>();
    const forbiddenChildePointerEvents  = ref(false);

    function onTabScrollLeft(off ?: number) {
      if(tabScroll.value) {
        if(tabScroll.value.scrollLeft > 0) tabScroll.value.scrollLeft -= (typeof off === 'number' ? off : 30);
        else tabScroll.value.scrollLeft = 0;
      }
    }
    function onTabScrollRight(off ?: number) {
      if(tabScroll.value) {
        if(tabScroll.value.scrollLeft < tabScroll.value.scrollWidth) tabScroll.value.scrollLeft += (typeof off === 'number' ? off : 30);
        else tabScroll.value.scrollLeft = tabScroll.value.scrollWidth;
      }
    }
    function onTabMouseWheel(e : WheelEvent) {
      if(e.deltaY < 0) {
        onTabScrollLeft(25);
      } else if(e.deltaY > 0) {
        onTabScrollRight(25);
      }
    }

    let lastDrag : unknown = null;

    //拖放操作
    function onDrop(ev: DragEvent) {
      //console.log('onDrop', ev);

      ev.preventDefault();
      ev.stopPropagation();

      if(!ev.dataTransfer) {
        console.log('!dropCurrentRegion');
        return;
      }

      //通过拖动数据找到当前正在拖动的面板
      let currentPanelKey = ev.dataTransfer.getData('text/plain');
      if(DockUtils.isNullOrEmpty(currentPanelKey) || currentPanelKey.length < 16)
        return;
      currentPanelKey = currentPanelKey.substring(15);
      const currentPanel = dockHost.getDockPanel(currentPanelKey);
      if(!currentPanel || !currentPanel.parent) {
        console.log('!panel');
        return;
      }

      //通过target，计算要插入到哪个位置
      const target = lastDrag as HTMLElement;
      let dropTabMoveTargetIndex = 0;
      if (target === tabScroll.value) { //拖放到自身
        dropTabMoveTargetIndex = ev.offsetX >= target.offsetWidth / 3 ? //大于当前3分之一宽度
          dockData.value.panels.length - 1 : //放到末尾
          0; //放到开头
      } else { //拖放到子条目
        //通过子条目的数据，计算插入索引
        const s = target.getAttribute('data-item-index');
        const itemIndex = s ? parseInt(s) : 0;
        dropTabMoveTargetIndex = ev.offsetX >= target.offsetWidth / 3 ? //大于当前条目3分之一宽度
          itemIndex : Math.max(itemIndex - 1, 0);
      }
      
      target.classList.remove('drag-drop-active');//移除高亮

      //console.log('onDrop', dropTabMoveTargetIndex, ev.offsetX, target.offsetWidth);

      const oldParent = currentPanel.parent;
      const currentIndexInPanel = dockData.value.panels.indexOf(currentPanel);
      //如果拖动元素不在当前Tab中,或目标与当前索引不一致，重新插入
      if(currentIndexInPanel < 0 || currentIndexInPanel !== dropTabMoveTargetIndex) {
        
        //如果拖动元素在当前Tab中   
        if(currentIndexInPanel >= 0) {
          oldParent.panels.splice(currentIndexInPanel, 1);
          //当前拖动的元素移除掉之后，索引需要-1   
          //if(currentIndexInPanel < dropTabMoveTargetIndex) 
          //  dropTabMoveTargetIndex--; 
        } else {
          //如果不在当前元素中，需要先从之前的父级移除
          oldParent.removePanel(currentPanel);
          //通知容器进行相关处理
          dockHost.onActiveTabChange(oldParent, null, oldParent.activeTab as DockPanel);
          dockHost.checkAndRemoveEmptyGrid(oldParent);//移除后，检查整理相关网格
          dockHost.forceFlushAllPanelPos(oldParent);
        }
        
        //重新插入
        let lastActiveTab = dockData.value.activeTab as DockPanel|null;
        dockData.value.addPanel(currentPanel, dropTabMoveTargetIndex);
        dockData.value.activeTab = currentPanel;
        dockHost.onGridDropFinish(dockData.value as DockData);
        dockHost.onActiveTabChange(dockData.value as DockData, lastActiveTab, currentPanel);
      }
    
    }
    function onDragEnter(ev: DragEvent) {
      ev.stopPropagation();

      forbiddenChildePointerEvents.value = true;

      const target = ev.target as HTMLElement;
      if (lastDrag === null && target && 
        (target.classList.contains('drag-target-tab') || target === tabScroll.value)) //仅有子条目或者当前组件
      {

        ev.preventDefault();
        dockHost.clearAllFloatDragLightBox();//清除主容器的拖动高亮样式
        
        target.classList.add('drag-drop-active'); //添加拖动高亮样式
        lastDrag = target;
      }
    }
    function onDragLeave(ev: DragEvent) {
      ev.stopPropagation();

      const target = ev.target as HTMLElement;
      if (lastDrag === target && target) {

        ev.preventDefault();
        target.classList.remove('drag-drop-active');
        lastDrag = null;
        forbiddenChildePointerEvents.value = false;
      }
    }
    function onDragOver(ev: DragEvent) {
      ev.preventDefault();
      ev.stopPropagation();
    }

    onMounted(() => {
      setTimeout(() => {
        //选择一个默认的Tab页
        const dockDataValue = dockData.value;
        if(dockDataValue.activeTab === null && dockDataValue.panels.length > 0)
          dockDataValue.activeTab = dockDataValue.panels[0];   
      }, 100)
    });

    return {
      tabScroll,
      dockHost,
      forbiddenChildePointerEvents,
      onTabMouseWheel,
      onDrop,
      onDragEnter,
      onDragLeave,
      onDragOver,
    }
  },
});
</script>

<style lang="scss">
@import "./DockCommonStyles.scss";

//dock 所用的标签页
.dock-tab {
  position: relative;
  width: 100%;
  height: 100%;
}
.dock-tab-list {
  display: block;
  position: relative;
  overflow: hidden;
  padding: 0px 4px;
  overflow-x: scroll;

  &::before {
    display: block;
    position: absolute;
    content: '';
    left: 0;
    right: 0;
    bottom: 0;
    height: 1px;
    z-index: 0;
    background-color: $tab-border-color;
  }
  &::-webkit-scrollbar{
    display: none;
  }

  &.forbidden-childe-pointer-events .tabs .item * {
    pointer-events: none;
  }

  .tabs {
    display: inline-flex;
    align-items: center;
    flex-wrap: nowrap;
    position: relative;
    overflow: hidden;
    transition: all ease-in-out 0.25s;
    height: 100%;

    .item {
      flex: 1;
      position: relative;
      display: inline-flex;
      padding: 0px 10px;
      cursor: pointer;
      color: #fff;
      border: 1px solid transparent;
      border-bottom-color: $tab-border-color;
      justify-content: center;
      align-items: center;
      height: 100%;
      vertical-align: middle;

      &.drag-drop-active {
        background-color: rgba(#fff, 0.4);
      }

      .icon {
        display: inline-block;
      }
      .close {
        text-decoration: none;
        color: $tab-button-normal-color;
        user-select: none;
        display: inline-flex;
        justify-content: center;
        align-items: center;
        cursor: pointer;
        width: 18px;
        height: 18px;
        border-radius: 3px;

        &:hover {
          background-color: $tab-button-hover-color;
        }

        .unsave-dot {
          width: 10px;
          height: 10px;
          border-radius: 50%;
          background-color: #fff;
        }
        .close-icon {
          width: 14px;
          height: 14px;
        }
      }

      span {
        display: inline-block;
        padding: 0 6px;
        font-size: 12px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
        word-break: break-all;
      }
  
      &.active {
        background-color: $tab-active-color;
        border-bottom-color: $tab-active-color;
        border-right-color: $tab-border-color;
        border-left-color: $tab-border-color;
        border-top-color: $tab-border-color;

        &::before {
          position: absolute;
          display: inline-block;
          content: '';
          width: 100%;
          bottom: -1px;
          left: 0;
          background-color: $tab-border-color;
        }
      }    
    }
  }

}
.dock-tab-content {
  position: absolute;
  top: $tab-height;
  left: 0;
  right: 0;
  bottom: 0;
}

//light theme
.dock-host.light {
  .dock-tab-list {

    @include pc-fix-scrollbar();

    &::before {
      background-color: $light-theme-tab-border-color;
    }

    .tabs {
      .item {
        color: #000;
        border-bottom-color: $light-theme-tab-border-color;
        .close {
          color: $light-theme-tab-button-normal-color;
          &:hover {
            background-color: $light-theme-tab-button-hover-color;
          }
          .unsave-dot {
            background-color: #616161;
          }
        }
    
        &.active {
          background-color: $light-theme-tab-active-color;
          border-bottom-color: $light-theme-tab-active-color;
          border-right-color: $light-theme-tab-border-color;
          border-left-color: $light-theme-tab-border-color;
          border-top-color: $light-theme-tab-border-color;

          &::before {
            background-color: $light-theme-tab-border-color;
          }
        }    
      }
    }

  }
}

</style>