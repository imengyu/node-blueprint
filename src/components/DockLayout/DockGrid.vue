<template>
  <div v-if="dockData" class="dock-grid">
    <DockSplit v-if="dockData.grids && dockData.grids.length > 0" :direction="dockData.currentDirection" :dockHost="dockHost">
      <DockGrid v-for="grid in dockData.grids" :key="grid.uid" :dockData="grid" :dockHost="dockHost" />
    </DockSplit>
    <div v-else-if="dockData.panels && dockData.panels.length > 0" class="dock-tab">
      <div class="dock-tab-list"
        @mouseenter="onTabMouseEnter($event)"
        @mouseleave="onTabMouseLeave($event)"
        @wheel="onTabMouseWhell($event)">
        <div v-show="showTableLrButton" class="left" draggable="false" @click="onTabScrollLeft">
          <i class="iconfont icon-arrow-left-2"></i>
        </div>
        <div v-show="showTableLrButton" class="right" draggable="false" @click="onTabScrollRight">
          <i class="iconfont icon-arrow-right-"></i>
        </div>
        <div class="tabs" :id="'dock-tab-contol-uid-'+dockData.uid" :style="{
          left: dockData.activeTab ? (dockData.activeTab.tabLeftOffset + 'px') : undefined,
          height: dockHost ? dockHost.tabHeight + 'px' : undefined
        }">
          <div
            v-for="panel in dockData.panels" 
            :class="'item drag-target-tab '+(dockData.activeTab===panel?'active':'')" 
            :key="panel.uid" 
            draggable="true" 
            @mousedown="onTabItemMouseDown($event,panel)"
            @dragstart="onTabItemDragStart($event, panel)"
            @dragend="onTabItemDragEnd($event, panel)"
            >
            <i :class="'icon '+panel.iconClass"></i>
            <span>{{ panel.title }}</span>
            <a v-if="panel.closeable" class="close" :draggable="false" href="javascript:;" @click="onTabItemClose(panel)">
              <i :class="'iconfont '+(panel.closeUnSave?'icon-file-':'icon-close-')"></i>
            </a>
          </div>
        </div>
      </div>
      <div class="dock-tab-content drag-target-host">
        <!--
          这里不再使用了
        <VNodeRenderer v-for="panel in dockData.panels" v-show="dockData.activeTab==panel" :key="panel.key+'_Host'" :vnode="panel.vnode" />
        -->
      </div>
    </div>
    <div v-else-if="dockHost && dockData.noPanelViewSlotName && dockData.noPanelViewSlotName!=''" class="dock-empty">
      <VNodeRenderer :vnode="dockHost.getOneSlot(dockData.noPanelViewSlotName)" />
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { DockData, DockHostData, DockPanelData } from './DockData'
import VNodeRenderer from '../VNodeRenderer.vue'
import DockSplit from './DockSplit.vue'

@Component({
  components: {
    VNodeRenderer,
    'DockSplit': DockSplit,
  }
})
export default class DockGrid extends Vue  {

  /**
   * 停靠数据
   */
  @Prop({default: null }) dockData : DockData;
  @Prop({default: null }) dockHost : DockHostData;

  dragActive = false;
  showTableLrButton = false;

  onTabItemMouseDown(e : MouseEvent, item : DockPanelData) {
    if(e.button == 0) {
      let last = this.dockData.activeTab;
      this.dockData.activeTab = item;
      this.dockHost.onActiveTabChange(this.dockData, last, item);
    } else if(e.button == 2) {
      item.onTabRightClick();
    }
  }
  onTabItemClose(panel : DockPanelData) {
    typeof panel.onClose === 'function' ? panel.onClose() : panel.visible = false;
  }
  onTabScrollLeft(off ?: number) {
    let el = document.getElementById('dock-tab-contol-uid-'+this.dockData.uid);
    if(el) {
      if(el.scrollLeft > 0) el.scrollLeft -= (typeof off === 'number' ? off : 30);
      else el.scrollLeft = 0;
    }
  }
  onTabScrollRight(off ?: number) {
    let el = document.getElementById('dock-tab-contol-uid-'+this.dockData.uid);
    if(el) {
      if(el.scrollLeft < el.scrollWidth) el.scrollLeft += (typeof off === 'number' ? off : 30);
      else el.scrollLeft = el.scrollWidth;
    }
  }

  onTabMouseWhell(e : WheelEvent) {
    if(e.deltaY < 0) {
      this.onTabScrollLeft(10);
    } else if(e.deltaY > 0) {
      this.onTabScrollRight(10);
    }
  }
  onTabMouseEnter(e : MouseEvent) {
    let el = e.target as HTMLElement;
    if(el)
      this.showTableLrButton = el.scrollWidth >= el.clientWidth;
  }
  onTabMouseLeave(e : MouseEvent) {
    let el = e.target as HTMLElement;
    if(el)
      this.showTableLrButton = false;
  }

  //Tab拖动事件

  onTabItemDragStart(ev : DragEvent, item : DockPanelData) {
    
    (<HTMLElement>ev.target).style.opacity = '.2';
    
    setTimeout(() => {
      this.dockHost.isDragging = true;
      this.dockHost.onStartDrag();
      this.dockHost.showDropLayout = true;
      this.dockHost.dropCurrentPanel = item;
    },100);

    ev.dataTransfer.setData("text/plain", 'dock-panel-key-' + item.key);
    ev.dataTransfer.dropEffect = 'none';
    ev.dataTransfer.setDragImage((<HTMLElement>ev.target), 20, 20);
  }
  onTabItemDragEnd(ev : DragEvent, item : DockPanelData) {
    (<HTMLElement>ev.target).style.opacity = '';
    setTimeout(() => {
      this.dockHost.isDragging = false;
      this.dockHost.onEndDrag();
      this.dockHost.showDropLayout = false;
      this.dockHost.dropCurrentPanel = null;
    },20);
  }

  mounted() {
    setTimeout(() => {
      if(this.dockData.activeTab == null && this.dockData.panels.length > 0)
        this.dockData.activeTab = this.dockData.panels[0];   
    }, 100)
  }
}
</script>