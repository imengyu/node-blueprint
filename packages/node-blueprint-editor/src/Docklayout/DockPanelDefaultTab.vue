<template>
  <div class="tabs" :id="'dock-tab-contol-uid-' + dockData.uid" :style="{
    height: dockHost ? dockHost.tabHeight + 'px' : undefined,
    ...dockData.tabStyle,
  }">
    <template v-for="(panel, index) in dockData.panels" :key="panel.uid" >
      <DynamicRender 
        v-if="panel.customTab && dockHost?.hasSlot('tabItemRender')" 
        :render="() => dockHost?.renderSlot('tabItemRender', { dockData, panel, index, onTabItemMouseDown, onTabItemDragStart, onTabItemDragEnd, onTabItemClose })"
      />
      <div 
        v-else
        :class="'item drag-target-tab ' + (dockData.activeTab === panel ? 'active' : '')"
        :data-item-index="index"
        :style="{
          ...dockData.tabItemStyle,
        }"
        draggable="true" 
        @mousedown="onTabItemMouseDown($event, panel)"
        @dragstart="onTabItemDragStart($event, panel)"
        @dragend="onTabItemDragEnd($event)"
      >
        <!--图标渲染-->
        <DynamicRender 
          v-if="dockHost?.hasSlot('tabIconRender')" 
          :render="() => dockHost?.renderSlot('tabIconRender', { dockData, panel })"
        />

        <!--标题-->
        <span>{{ panel.title }}</span>

        <!--关闭按钮-->
        <a 
          v-if="panel.closeable" 
          class="close"
          title="关闭"
          draggable="false"
          @click="onTabItemClose(panel)"
        >
          
          <!--关闭图标渲染-->
          <DynamicRender 
            v-if="dockHost?.hasSlot('tabCloseIconRender')" 
            :render="() => dockHost?.renderSlot('tabCloseIconRender', { dockData, panel })"
          />
          <div v-else-if="panel.closeUnSave" class="unsave-dot" draggable="false" />
          <img v-else :src="closeIcon" class="close-icon" draggable="false" />
        </a>
      </div>
    </template>
    <DynamicRender 
      v-if="dockHost?.hasSlot('tabExtraRender')" 
      :render="() => dockHost?.renderSlot('tabExtraRender', { dockData })"
    />
  </div>
</template>

<script lang="ts">
import { defineComponent, inject, PropType } from 'vue';
import { DockHostData } from './DockHostData';
import { DockData, DockPanel } from './DockLayoutData';
import DynamicRender from '../Common/Dynamic/DynamicRender.vue';

/**
 * 面板的默认Tab组件
 */
export default defineComponent({
  name: "DockPanelDefaultTab",
  props: {
    /**
     * 停靠数据
     */
    dockData: {
      type: Object as PropType<DockData>,
      default: null
    },
  },
  setup() {
    const dockHost = inject<DockHostData>('dockHost'); //顶级DockHostData
    return {
      dockHost,
      closeIcon: dockHost?.theme === 'dark' ? require('./DockPanelDefaultCloseDark.svg') : require('./DockPanelDefaultCloseLight.svg'),
    };
  },
  methods: {
    onTabItemMouseDown(e: MouseEvent, item: DockPanel) {
      if (e.button == 0) {
        const dockData = this.dockData;
        const last = dockData.activeTab;
        dockData.activeTab = item;
        this.dockHost?.onActiveTabChange(dockData, last, item);
      }
      else if (e.button == 2) {
        if (typeof item.onTabRightClick === "function")
          item.onTabRightClick();
      }
    },
    onTabItemClose(panel: DockPanel) {
      //用户自定义了关闭函数，则调用
      const shouldClose = typeof panel.onClose === "function" ? panel.onClose() : true;
      if (shouldClose)
        this.dockHost?.onClosePanel(panel);
    },
    //Tab拖动事件
    onTabItemDragStart(ev: DragEvent, item: DockPanel) {
      const dockHost = this.dockHost;
      (ev.target as HTMLElement).style.opacity = ".2";
      setTimeout(() => {
        if (dockHost) {
          dockHost.isDragging = true;
          dockHost.onStartDrag(item);
          dockHost.showDropLayout = true;
          dockHost.dropCurrentPanel = item;
        }
      }, 100);
      const dataTransfer = ev.dataTransfer;
      if (dataTransfer) {
        dataTransfer.dropEffect = "none";
        dataTransfer.setData("text/plain", "dock-panel-key-" + item.key);
        dataTransfer.setDragImage((ev.target as HTMLElement), 20, 20);
      }
    },
    //拖动结束事件
    onTabItemDragEnd(ev: DragEvent) {
      const dockHost = this.dockHost;
      (ev.target as HTMLElement).style.opacity = "";
      setTimeout(() => {
        if (dockHost) {
          dockHost.isDragging = false;
          dockHost.onEndDrag();
          dockHost.showDropLayout = false;
          dockHost.dropCurrentPanel = null;
        }
      }, 20);
    }
  },
  components: { DynamicRender }
});
</script>