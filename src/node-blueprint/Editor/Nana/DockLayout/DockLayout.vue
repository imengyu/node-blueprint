<template>
  <div 
    ref="host"
    :class="'dock-host ' + theme"
    @dragover="onDragOver($event)"
    @dragenter="onDragEnter($event)"
    @dragleave="onDragLeave($event)"
    @drop="onDrop($event)"
  >
    <!--内容渲染层-->
    <template v-for="([ key, panel ]) in dockPanels" :key="key">
      <div
        :style="{
          display: panel.visible ? 'block' : '',
          left: `${panel.finalRegion.x}px`,
          top: `${panel.finalRegion.y}px`,
          width: `${panel.finalRegion.w}px`,
          height: `${panel.finalRegion.h}px`,
        }"
        class="dock-panel"
      >
        <DynamicRender v-if="panel.render" :render="panel.render" :data="panel" />
        <slot v-else :key="key" name="panelRender" :panel="panel" />
      </div>
    </template>
    <!--顶层容器-->
    <DockSplit 
      ref="mainLayout" 
      :dockDatas="(dockData.grids as DockData[])"
      :direction="startVerticalDirection ? 'vertical' : 'horizontal'"
    />
    <!--拖拽显示层-->
    <DockDropLayout 
      :isFloat="showDropIsFloat"
      :showDropLayout="showDropLayout"
      :showDropTop="showDropTop"
      :showDropBottom="showDropBottom"
      :showDropLeft="showDropLeft"
      :showDropRight="showDropRight"
      :showDropMiddle="showDropMiddle"
      :showDropLeftDep="showDropLeftDep"
      :showDropRightDep="showDropRightDep"
      :showDropTopDep="showDropTopDep"
      :showDropBottomDep="showDropBottomDep"
      :dropInRegion="(dropInRegion as Rect)"
      :dropStyleRegion="(dropStyleRegion as Rect)"
    />
  </div>
</template>

<script lang="ts">
import { type ComponentPublicInstance, defineComponent, renderSlot } from 'vue';
import { DockData, type DockDirection, DockPanel, DockRootData, type IDockGrid, type IDockPanel } from './DockLayoutData';
import DockDropLayout from './DockDropLayout.vue';
import DockSplit from './DockSplit.vue';
import DynamicRender from './DynamicRender.vue';
import { Rect, Vector2 } from './DockVector';
import DockUtils, { type IKeyAnyObject } from './DockUtils';

export default defineComponent({
  name: "DockLayout",
  components: { DockDropLayout, DockSplit, DynamicRender },
  provide() {
    return {
      dockHost: this,
    };
  },
  props: {
    /**
     * 第一个布局网格是不是垂直的，默认为false
     */
    startVerticalDirection: {
      type: Boolean,
      default: false
    },
    /**
     * Tab组件的高度，用于相关计算
     */
    tabHeight: {
      type: Number,
      default: 40
    },
    /**
     * 是否允许浮动窗口
     */
    allowFloatWindow: {
      type: Boolean,
      default: false
    },
    /**
     * 主题，可选 'light', 'dark', 默认是 'dark'
     */
    theme: {
      type: String,
      default: 'dark'
    },
  },
  emits: [
    'activeTabChange',
    'tabClosed',
    'dropFile',
  ],
  data() {
    return {
      dockPanels: new Map<string, DockPanel>(),
      dockData: new DockRootData(),
      needRemovePanels: new Array<string>(),
      isDragging: false,
      mainLayout: null as unknown | null,
      dropLayout: null as HTMLDivElement | null,
      host: null as HTMLDivElement | null,

      //拖拽相关变量
      dropStyleRegion: new Rect(),//高亮区域坐标
      dropStyleRegionInTab: new Rect(),//高亮区域坐标(Tab中)
      dropInRegionParent: new Rect(),//当前鼠标所在区域的父级网格坐标
      dropInRegion: new Rect(),//当前鼠标所在区域的网格坐标
      dropCurrentRegion : null as DockData|null,//当前鼠标所在区域的网格信息
      dropCurrentRegionDirection: '',//当前拖拽指定的强制插入方向
      dropCurrentPanel: null as DockPanel|null,//当前拖动的面板
      //拖拽高亮控制变量
      showDropIsFloat: false,
      showDropLayout: false,
      showDropMiddle: true,
      showDropLeftDep: true,
      showDropTopDep: true,
      showDropRightDep: true,
      showDropBottomDep: true,
      showDropTop: true,
      showDropBottom: true,
      showDropLeft: true,
      showDropRight: true,

      //内部使用属性
      lastPos: new Vector2(),
      lastSize: new Vector2(),
      nextInDir: '',
      checkSizeChangedTimer: 0,
      flushPosLock: false,
      currentDragPanel: null as DockPanel|null,
      currentDragHostPos: new Vector2(),
      
      lastHoverTabUid: '',
      lastHoverTab : null as HTMLElement|null,
    };
  },
  mounted() {
    setTimeout(() => {
      this.checkSizeChangedTimer = setInterval(this.checkSizeChangedTick, 200) as unknown as number;
      this.host = this.$refs.host as HTMLDivElement;
      this.lastSize.x = this.host.clientWidth;
      this.lastSize.y = this.host.clientHeight;
      this.mainLayout = this.$refs.mainLayout as ComponentPublicInstance;
      this.dropLayout = this.$refs.dropLayout as HTMLDivElement;
      this.dockData.currentDirection = this.startVerticalDirection ? "vertical" : "horizontal";
      this.$forceUpdate();
    }, 300);
  },
  beforeUnmount() {
    clearInterval(this.checkSizeChangedTimer);
  },
  methods: {

    //#region 面板相关接口

    /**
     * 通过key查找指定面板
     * @param key 
     */
    getDockPanel(key: string) {
      return this.dockPanels.get(key) || null;
    },
    /**
     * 查找指定名称的网格
     * @public
     * @param name 网格名称
     */
    findGrid(name: string): DockData | null {
      let find = (data: DockData, name_: string): DockData | null => {
        if (data.name === name_)
          return data;
        for (let i = 0; i < data.grids.length; i++) {
          let dataInChild = find(data.grids[i], name_);
          if (dataInChild)
            return dataInChild;
        }
        return null;
      };
      return find(this.dockData as DockData, name);
    },
    /**
     * 查找指定名称的网格，并将内容插入只它的子级
     * @param name 网格名称
     * @param panel 面板
     */
    findAndInsertPanel(name: string, panel: DockPanel) {
      let grid = this.findGrid(name);
      if (!grid) {
        console.error(`[DockLayout] Can not add Panel ${panel.key} to gird ${name} because grid do not exist.`);
        return;
      }
      if (grid) {
        grid = this.loopForLastChildren(grid);
        this.insertPanel(grid, panel);
      }
    },
    insertPanel(grid: DockData , panel: DockPanel) {
      if (grid?.addPanel(panel))
        this.onActiveTabChange(grid, null, grid.activeTab);
      this.forceFlushAllPanelPos();
    },
    /**
     * 递归查找最后一级子级
     * @param data 
     */
    loopForLastChildren(data: DockData): DockData {
      if (data.grids.length === 0)
        return data;
      for (let i = 0; i < data.grids.length; i++) {
        let dataInChild = this.loopForLastChildren(data.grids[i]);
        if (dataInChild)
          return dataInChild;
      }
      return data;
    },

    /**
     * 循环同步子级面板（真实区域）的位置
     * @param data 面板数据
     * @param region 父级区域
     */
    loopUpdateChildPanelPosition(data : DockData, region : Rect, onlySelf = false) {
      data.lastLayoutSize.set(region);
      if(!onlySelf && data.panels.length > 0) {
        let panel : DockPanel|null = null;
        for(let i = 0; i < data.panels.length; i++) {
          panel = data.panels[i];
          panel.finalRegion.set(
            region.x + 4 + 1, region.y + this.tabHeight,
            region.w - 8, region.h - this.tabHeight
          );
        }
      } else {
        let dockData : DockData|null = null;
        let rect = new Rect();
        let currSize = 0, curGridSize = 0;
        for(let i = 0; i < data.grids.length; i++) {
          dockData = data.grids[i];
          if(data.currentDirection === 'vertical') {
            curGridSize = region.h * (dockData.size / 100);
            rect.set(region.x, currSize, region.w, curGridSize);
            currSize += curGridSize;
            this.loopUpdateChildPanelPosition(dockData, rect, onlySelf);
          } else if(data.currentDirection === 'horizontal') {
            curGridSize = region.w * (dockData.size / 100);
            rect.set(currSize, region.y, curGridSize, region.h);
            currSize += curGridSize;
            this.loopUpdateChildPanelPosition(dockData, rect, onlySelf);
          }
        }
      }
    },
    /**
     * 循环同步所有子级面板（真实区域）的位置
     * @public
     * @param grid 面板
     */
    forceFlushAllPanelPos() {
      if (this.flushPosLock)
        return;
      this.flushPosLock = true;
      setTimeout(() => {
        const el = this.$refs.mainLayout as ComponentPublicInstance;
        const rect = new Rect(0, 0, el.$el.clientWidth, el.$el.clientHeight);
        this.dockData.lastLayoutSize.set(rect);
        this.loopUpdateChildPanelPosition(this.dockData as DockData, rect);
        this.flushPosLock = false;
      }, 40);
    },

    //#endregion 

    //#region 插槽相关

    //立即渲染一个插槽。（用于render函数中）
    renderSlot(name: string, param: IKeyAnyObject) {
      return renderSlot(this.$slots, name, param);
    },
    //检查是否存在某个名称的插槽
    hasSlot(name: string) {
      return this.$slots[name] !== undefined;
    },

    //#endregion

    //#region 检测大小更改

    onSizeChanged() {
      this.forceFlushAllPanelPos();
    },
    //检测大小更改
    checkSizeChangedTick() {
      const host = this.host as HTMLElement;
      if (!host)
        return;
      if(this.lastSize.x !== host.clientWidth || this.lastSize.y !== host.clientHeight) {
        this.onSizeChanged();
        this.lastSize.x = host.clientWidth;
        this.lastSize.y = host.clientHeight;
      }
    },

    //#endregion

    //#region 拖动相关

    onDrop(ev: DragEvent) {

      if(this.dropCurrentRegion === null || !ev.dataTransfer)
        return;

      ev.preventDefault();

      if((this.dropCurrentRegionDirection === 'float' && !this.allowFloatWindow)) 
        return; //不允许浮动窗口，则返回
      if(DockUtils.isNullOrEmpty(this.dropCurrentRegionDirection))
        return; //拖动区域是空的，返回
      
      //通过拖动数据找到当前正在拖动的面板
      let currentPanelKey = ev.dataTransfer.getData('text/plain');
      if(DockUtils.isNullOrEmpty(currentPanelKey) || currentPanelKey.length < 16)
        return;
      currentPanelKey = currentPanelKey.substring(15);
      let currentPanel = this.dockPanels.get(currentPanelKey);
      if(!currentPanel)
        return;

      //保存一下父级
      const dropCurrentRegionParent = this.dropCurrentRegion.parent; 

      //跨网格移动，需要先从之前的网格移出来
      const parent = currentPanel.parent;

      if(parent) {
        let needFlushTabActive = parent.removePanel(currentPanel);//在原来的容器中移除
        if(needFlushTabActive)
          this.onActiveTabChange(parent, null, parent.activeTab as DockPanel);
       
        const useAbleParent = this.checkAndRemoveEmptyGrid(parent); //检查容器嵌套情况并整理
        if (this.dropCurrentRegion.isIsolated()) // 如果目标插入容器已经被移除，则设置为其他可用容器
          this.dropCurrentRegion = useAbleParent;
      }

      //是放置在网格中

      //console.log('onDrop ', this.dropCurrentRegionDirection, currentPanel);

      //通过指示箭头来计算当前需要把面板放置在哪个位置
      switch(this.dropCurrentRegionDirection) {
        case 'float': 
          //浮动

          break;
        case 'middle':
          //居中，并且网格没有面板，则插入到当前空网格中
          if(this.dropCurrentRegion.grids.length === 0) {
            const lastActiveTab = this.dropCurrentRegion.activeTab as DockPanel|null;
            this.dropCurrentRegion.addPanel(currentPanel);
            this.dropCurrentRegion.activeTab = currentPanel;
            this.onActiveTabChange(this.dropCurrentRegion as DockData, lastActiveTab, currentPanel);
            this.onGridDropFinish();
          }
          break;
        case 'top': 
        case 'bottom':   
          //上下分割
          this.reGridRegion(this.dropCurrentRegion as DockData, 'vertical', currentPanel, parent);
          break;
        case 'right':
        case 'left': 
          //左右分割
          this.reGridRegion(this.dropCurrentRegion as DockData, 'horizontal', currentPanel, parent);
          break;
        case 'top-dep': 
        case 'bottom-dep': 
          //上下移动
          if(this.dropCurrentRegion.parent)
            this.reGridRegion(this.dropCurrentRegion.parent as DockData, 'vertical', currentPanel, parent);
          else if (dropCurrentRegionParent) //父级为空，说明跨网格移动后，之前的父级已经为空并且移除了，现在需要插入父级的父级
            this.reGridRegion(dropCurrentRegionParent as DockData, 'vertical', currentPanel, parent);
          break;
        case 'right-dep': 
        case 'left-dep': 
          //左右移动
          if(this.dropCurrentRegion.parent)
            this.reGridRegion(this.dropCurrentRegion.parent as DockData, 'horizontal', currentPanel, parent);
          else if (dropCurrentRegionParent) //父级为空，说明跨网格移动后，之前的父级已经为空并且移除了，现在需要插入父级的父级
            this.reGridRegion(dropCurrentRegionParent as DockData, 'horizontal', currentPanel, parent);
          break;
      }


      this.dropStyleRegion.set(0,0,0,0);
      this.dropStyleRegionInTab.set(0,0,0,0);

      //清除掉箭头的状态
      document.querySelectorAll('.dock-drop-square.active').forEach((e) => e.classList.remove('active'));
    },
    onDragEnter(ev: DragEvent) {
      let target = ev.target as HTMLElement;
      if (target) {
        if (target.getAttribute('data-drag-drop') === "true")
          this.dragArrowActive(target);
      }
      const host = this.host as HTMLElement;
      this.currentDragHostPos.x = DockUtils.getLeft(host);
      this.currentDragHostPos.y = DockUtils.getTop(host);
      //容器可能不在0，0的位置，需要相减偏移坐标
      const x = ev.clientX - this.currentDragHostPos.x;
      const y = ev.clientY - this.currentDragHostPos.y;
      this.lastPos.set(x, y);
      this.flushDragCurrentRegion(x, y)
    },
    onDragLeave(ev: DragEvent) {
      const target = ev.target as HTMLElement;
      if (target && target.getAttribute('data-drag-drop') === "true") 
        this.dragArrowDeactive(target);
    },
    onDragOver(ev: DragEvent) {ev.preventDefault();
      //容器可能不在0，0的位置，需要相减偏移坐标
      const x = ev.clientX - this.currentDragHostPos.x;
      const y = ev.clientY - this.currentDragHostPos.y;

      if(Math.abs(x - this.lastPos.x) > 5 || Math.abs(y - this.lastPos.y) > 5) {
        this.lastPos.set(x, y);
        this.flushDragCurrentRegion(x, y);
      }
    },
    onStartDrag (item: DockPanel) {
      this.currentDragPanel = item;
      this.dropCurrentRegion = item.parent; //因为子tab拖动由自身处理，容器没处理拖动，就没法知道dropCurrentRegion是啥了，手动设置
      setTimeout(() => this.flushDragDirectionRegion(), 200);
    },
    onEndDrag () {
      this.currentDragPanel = null;
    },

    //#endregion

    //#region 子容器的数据回传

    //开始拖动
    onGridDrag(thisGrid : DockData, nextGrid : DockData) {
      //先调用父级进行一次位置坐标整理
      if (thisGrid.parent)
        this.loopUpdateChildPanelPosition(thisGrid.parent, thisGrid.parent.lastLayoutSize, true);
      //调用两个网格进行位置调整
      this.loopUpdateChildPanelPosition(thisGrid, thisGrid.lastLayoutSize);
      if(nextGrid)
        this.loopUpdateChildPanelPosition(nextGrid, nextGrid.lastLayoutSize);
    },
    //拖动完成
    onGridDropFinish() {
      this.forceFlushAllPanelPos();
    },
    //切换显示状态
    onActiveTabChange(grid : DockData, lastActive : DockPanel|null, currentActive : DockPanel|null) {
      if(lastActive)
        lastActive.visible = false;
      if(currentActive)
        currentActive.visible = true;
      this.$emit('activeTabChange', currentActive, lastActive);
    },
    //关闭面板
    onClosePanel(panel: DockPanel) {
      const parent = panel.parent;
      if (parent) {
        parent.removePanel(panel);
        this.dockPanels.delete(panel.key);
        this.$emit('tabClosed', panel);
        this.onActiveTabChange(parent, null, parent.activeTab as DockPanel);//移除后，重新选择
        this.checkAndRemoveEmptyGrid(parent);//移除后，检查整理相关网格
        this.forceFlushAllPanelPos(); //移除后，强制刷新一下大小
      } else {
        console.error(`[DockLayout] Failed to close tab ${panel.key}, mabe it already closed.`);
      }
    },

    //#endregion

    //#region 拖动网格高亮相关

    dragArrowActive(el : HTMLElement) {
      const direction = el.getAttribute('data-direction') || '';
      if(DockUtils.isNullOrEmpty(direction))
        return;
      el.classList.add("active");
      this.dropCurrentRegionDirection = direction;
      this.flushDragDirectionRegion();
    },
    dragArrowDeactive(el : HTMLElement) {
      let direction = el.getAttribute('data-direction');
      if(!DockUtils.isNullOrEmpty(direction)) {
        el.classList.remove("active");
      }
      setTimeout(() => {
        if(this.dropCurrentRegionDirection === direction) {
          this.dropCurrentRegionDirection = 'float';
          this.showDropIsFloat = true;
          this.flushFloatDragLightBox();
        }
      }, 200);
    },
    //检查网格是否为空，为空则进行合并整理
    checkAndRemoveEmptyGrid(data : DockData) : DockData {
      if (data.alwaysVisible)
        return data;
      if (data.grids.length === 0 && data.panels.length === 0) {
        //当前网格是一个空壳，直接移除
        let parent = data.parent; 
        if(parent) {
          parent.removeGrid(data);
          return this.checkAndRemoveEmptyGrid(parent);
        }
      } else if (data.grids.length === 1 && data.panels.length === 0) { 
        //只有一个网格了，将子级合并到自己
        let child = data.grids[0];
        data.panels = child.panels;
        data.grids = child.grids;
        child.parent = null;
        child.panels = [];
        child.grids = [];
        data.resetPanelsParent();
        data.resetGridsParent();

        if (data.parent)
          this.checkAndRemoveEmptyGrid(data.parent);
      } 
      return data;
    },
    //重新进行网格布局
    reGridRegion(grid : DockData, driection : 'vertical'|'horizontal', currentPanel : DockPanel, panelOldParent: DockData|null) {
      if(grid.currentDirection === driection) { //方向相同

        const oldActiveTab = grid.activeTab;
        const isLeftDir = (this.dropCurrentRegionDirection.startsWith('top') || this.dropCurrentRegionDirection.startsWith('left'));
        const isDep = this.dropCurrentRegionDirection.endsWith('-dep');
        const inhertPropsParent = panelOldParent || grid;//必须保证新创建出来的网格继承之前的网格设置
        
        let newRegionOne = grid, newRegionTwo = new DockData();
        newRegionTwo.inhertProps(inhertPropsParent);
        newRegionTwo.setDirectionByParent(grid);//继承之前的网格设置
        newRegionTwo.name = grid.name + '-' + driection + '-split2';

        let oldActiveTabOne = newRegionOne.activeTab;
        let oldActiveTabTwo = newRegionTwo.activeTab;

        if(grid.panels.length > 0) {
          //拆分网格并重构层级
          newRegionOne = new DockData();
          newRegionOne.name = grid.name + '-' + driection + '-split1';
          newRegionOne.panels = grid.panels;
          newRegionOne.inhertProps(grid);
          newRegionOne.resetPanelsParent();
          newRegionOne.setDirectionByParent(grid); 
          grid.panels = [];

          //添加拆分的网格
          grid.addGrid(newRegionOne);
          grid.addGrid(newRegionTwo, isLeftDir ? 0 : undefined);

          if (grid.parent)
            this.checkAndRemoveEmptyGrid(grid.parent);//移除后，检查整理相关网格
        } else {
          //这本来就是网格，可直接添加，不需要拆分
          const index = grid.grids.indexOf(this.dropCurrentRegion as DockData);
          if(index === -1 || isDep)
            grid.addGrid(newRegionTwo, isLeftDir ? 0 : undefined)
          else
            grid.addGrid(newRegionTwo, isLeftDir ? index : index + 1)
          
        }


        newRegionOne.activeTab = oldActiveTab;
        newRegionTwo.addPanel(currentPanel);
        newRegionTwo.activeTab = currentPanel;
        
        this.onGridDropFinish();
        this.onActiveTabChange(newRegionOne, oldActiveTabOne, oldActiveTab as DockPanel);
        this.onActiveTabChange(newRegionTwo, oldActiveTabTwo, currentPanel);
      } else if(grid.parent) { //方向不同，直接推到父级去
        this.reGridRegion(grid.parent, driection, currentPanel, panelOldParent);
      } 
    },

    //刷新当前鼠标拖动插入方向箭头的区域信息
    flushDragDirectionRegion() {

      if(this.dropCurrentRegion !== null) {

        //检查一下是不是第一个
        let isParentFirst = false;
        let isParentLast  = false;
        if (this.dropCurrentRegion.parent) {
          const parenPanels = this.dropCurrentRegion.parent.panels;
          isParentFirst = parenPanels.indexOf(this.dropCurrentPanel as DockPanel) === 0;
          isParentLast = parenPanels.indexOf(this.dropCurrentPanel as DockPanel) === parenPanels.length - 1;
        }
        
        //刷新箭头显示
        if (this.dropCurrentRegion.allowDep) {
          this.showDropLeftDep = this.dropInRegionParent.x !== this.dropInRegion.x && !isParentFirst;
          this.showDropTopDep = this.dropInRegionParent.y !== this.dropInRegion.y && !isParentFirst;
          this.showDropRightDep = !isParentLast && this.dropInRegionParent.w !== this.dropInRegionParent.x + this.dropInRegion.w;
          this.showDropBottomDep = !isParentLast && this.dropInRegionParent.h !== this.dropInRegionParent.y + this.dropInRegion.h;
        } else {
          this.showDropLeftDep = false;
          this.showDropTopDep = false;
          this.showDropRightDep = false;
          this.showDropBottomDep = false;
        }
        
        let isCurrentViewNotRedundant = (!this.dropCurrentRegion.panels.includes(this.dropCurrentPanel as DockPanel) || this.dropCurrentRegion.panels.length > 1);
        let isSuperHrView =  (this.dropCurrentRegion.parent !== null || (this.dropCurrentRegion === this.dockData && this.dropCurrentRegion.currentDirection === 'horizontal'));
        let isSuperVeView =  (this.dropCurrentRegion.parent !== null || (this.dropCurrentRegion === this.dockData && this.dropCurrentRegion.currentDirection === 'vertical'));

        this.showDropMiddle = !this.dropCurrentRegion.panels.includes(this.dropCurrentPanel as DockPanel);
        this.showDropTop = isSuperVeView && isCurrentViewNotRedundant;
        this.showDropBottom = isSuperVeView && isCurrentViewNotRedundant;
        this.showDropLeft = isSuperHrView && isCurrentViewNotRedundant;
        this.showDropRight = isSuperHrView && isCurrentViewNotRedundant;
        //不同插入方向
        switch(this.dropCurrentRegionDirection) {
          case 'middle':
            this.dropStyleRegion.set(this.dropInRegion as Rect);
            break;
          case 'top': 
            this.dropStyleRegion.set(this.dropInRegion.x, this.dropInRegion.y, this.dropInRegion.w, this.dropInRegion.h / 2);
            break;
          case 'right': 
            this.dropStyleRegion.set(this.dropInRegion.x + this.dropInRegion.w / 2, this.dropInRegion.y, this.dropInRegion.w / 2, this.dropInRegion.h);
            break;
          case 'bottom':
            this.dropStyleRegion.set(this.dropInRegion.x, this.dropInRegion.y + this.dropInRegion.h / 2, this.dropInRegion.w, this.dropInRegion.h / 2);
            break;
          case 'left': 
            this.dropStyleRegion.set(this.dropInRegion.x, this.dropInRegion.y, this.dropInRegion.w / 2, this.dropInRegion.h);
            break;
          case 'top-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x, this.dropInRegionParent.y, this.dropInRegionParent.w, this.dropInRegionParent.h / 4);
            break;
          case 'right-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x + this.dropInRegionParent.w / 4 * 2, this.dropInRegionParent.y, this.dropInRegionParent.w / 4, this.dropInRegionParent.h);
            break;
          case 'bottom-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x, this.dropInRegionParent.y + this.dropInRegionParent.h / 4 * 2, this.dropInRegionParent.w, this.dropInRegionParent.h / 4);
            break; 
          case 'left-dep': 
            this.dropStyleRegion.set(this.dropInRegionParent.x, this.dropInRegionParent.y, this.dropInRegionParent.w / 4, this.dropInRegionParent.h);
            break;
        }
      } else {   
        //刷新箭头显示
        this.clearAllFloatDragLightBox();
        this.flushFloatDragLightBox();
      }
    },
    clearFloatDragArea() {
      this.dropStyleRegion.set(0, 0, 0, 0);
      this.dropStyleRegionInTab.set(0, 0, 0, 0);
    },
    clearAllFloatDragLightBox() {
      this.showDropLeftDep = false;
      this.showDropTopDep = false;
      this.showDropRightDep = false;
      this.showDropBottomDep = false;
      this.showDropTop = false;
      this.showDropBottom = false;
      this.showDropLeft = false;
      this.showDropRight = false;
      this.showDropMiddle = false;
      this.clearFloatDragArea();
    },
    flushFloatDragLightBox() {
      this.dropStyleRegion.set(this.lastPos.x - 50, this.lastPos.y + 40, 100, 50);
    },
    //刷新当前鼠标拖动所在的网格区域
    flushDragCurrentRegion(x : number, y : number) {

      const mainLayout = this.mainLayout as ComponentPublicInstance;

      const regionOut = new Rect(0, 0, mainLayout.$el.clientWidth, mainLayout.$el.clientHeight);
      const loopChilds = (dockData : DockData, region : Rect) : boolean => {
        let gridLen = dockData.grids.length;
        if(gridLen > 0) {
          //有子级，平分当前区域
          if(dockData.currentDirection === 'vertical') {
            let nowY = 0, nowH = 0, nowS = 0;
            for(let i = 0; i < gridLen; i++) {
              nowS = dockData.grids[i].size;
              nowH = (nowS <= 0 ? (1 / gridLen) : (nowS / 100)) * region.h;
              if(y >= nowY && y <= nowY + nowH) { //鼠标当前在某个网格中，那么不需要扫描其他网格了
                this.dropInRegionParent.set(region);//保存父级网格
                
                region.y = nowY; region.h = nowH;
                return loopChilds(dockData.grids[i], region);//递归扫描子网格
              } 
              nowY += nowH;
            }
          } else if(dockData.currentDirection === 'horizontal') {
            let nowX = region.x, nowW = 0, nowS = 0;
            for(let i = 0; i < gridLen; i++) {
              nowS = dockData.grids[i].size;
              nowW = (nowS <= 0 ? (1 / gridLen) : (nowS / 100)) * region.w;
              if(x >= nowX && x <= nowX + nowW) { //鼠标当前在某个网格中，那么不需要扫描其他网格了
                this.dropInRegionParent.set(region);//保存父级网格
                region.x = nowX; region.w = nowW;
                return loopChilds(dockData.grids[i], region);//递归扫描子网格
              }
              nowX += nowW;
            }
          }
        } else { 
          //没有子级

          //判断当前网格是否可以接受正在拖动的面板
          if (this.currentDragPanel 
            && this.currentDragPanel.tag 
            && dockData.acceptPanelTags.length > 0 
            && !dockData.acceptPanelTags.includes(this.currentDragPanel.tag)) {
            //不可以接受，拒绝放置
            return false;
          }
          this.dropCurrentRegion = dockData;//当前网格
          //扫描当前是否在Tab区域内
          //console.log(`x:${x},y:${y},region:${region}`);
          if(x >= region.x && x < region.getRight() && y >= region.y && y < region.y + this.tabHeight) {
            //Tab 区域内的拖放应该由子级处理，这里不处理，直接返回
            return true;
          }
        }
        return false;
      };

      this.dropCurrentRegion = null;
      this.dropInRegionParent.set(regionOut);

      const isTabDrag = loopChilds(this.dockData as DockData, regionOut);
      this.showDropIsFloat = this.dropCurrentRegionDirection === 'float';
      if(!isTabDrag && this.showDropIsFloat)
        this.flushFloatDragLightBox(); //刷新浮动高亮框位置

      //强制刷新一次
      this.flushDragDirectionRegion();

      //通过递归扫描，当前 regionOut 里面就是鼠标位置的网格了，现在设置到主变量上
      this.dropInRegion.set(regionOut);

      if (isTabDrag) {
        //tab中移动时不显示拖动高亮框状态
        this.clearAllFloatDragLightBox();
      }

      return isTabDrag;
    },

    //#endregion

    //#region 数据与面板相关
    
    /**
     * 获取界面网格布局数据
     * @public
     */
    getSaveData() : IDockGrid {
      return this.dockData.toJSON();
    },
    /**
     * 设置界面网格布局数据
     * @public
     * @param data 网格数据
     */
    setData(data : IDockGrid) {
      this.loadDockData(this.dockData as DockData, data, this.startVerticalDirection ? 'vertical' : 'horizontal');
      this.loadDockDataPanels(this.dockData as DockData, data);
    },

    //递归加载布局数据
    loadDockData(data : DockData, src : IDockGrid, direction : DockDirection) {
      data.currentDirection = direction;
      data.size = src.size;
      data.name = DockUtils.defaultIfUndefined(src.name, '');
      data.tag = DockUtils.defaultIfUndefined(src.tag, '');
      data.alwaysVisible = DockUtils.defaultIfUndefined(src.alwaysVisible, false);
      data.allowDep = DockUtils.defaultIfUndefined(src.allowDep, true);
      data.acceptPanelTags = src.acceptPanelTags || [];
      data.tabStyle = src.tabStyle || {};
      data.tabItemStyle = src.tabItemStyle || {};
      data.allowIsolated = true;

      src?.grids?.forEach((g) => {
        const newData = new DockData();
        g.uid = newData.uid;
        this.loadDockData(newData, g, direction === 'vertical' ? 'horizontal' : 'vertical');
        data.addGrid(newData, undefined, true);
      });

      if (data.name !== 'root')
        data.allowIsolated = false;
    },
    //对面板数据进行处理
    loadDockDataPanels(data : DockData, src : IDockGrid) {
      //递归遍历子级
      src?.grids?.forEach((g) => {
        let childData : DockData|null = null;
        for(let i = 0; i < data.grids.length; i++)
          if(data.grids[i].uid === g.uid) {
            childData = data.grids[i];
            break;
          }
        if(childData)
          this.loadDockDataPanels(childData, g);
      });
      //遍历面板
      src?.panels?.forEach((p) => {
        //用于重新对父级变化的面板进行重新添加
        let panel = this.dockPanels.get(p.key); 
        if(panel && panel.parent !== data) {
          if(panel.parent)
            panel.parent.removePanel(panel);
          if (data.addPanel(panel))
            this.onActiveTabChange(data, null, data.activeTab);
        }
      });
    },

    //#endregion

    //#region 公共接口

    /**
     * 更新面板实例的属性
     * @public
     * @param panel 
     */
    updatePanel(panel: IDockPanel) {
      const panelInstance = this.dockPanels.get(panel.key);
      if (!panelInstance) {
        console.error(`[DockLayout] Remove Panel ${panel.key} because it do not exist.`);
        return;
      }
      panelInstance.formJSON(panel);
    },
    /**
     * 向容器内插入面板。
     * * 注意：如果面板key已经插入当前容器，并且 `insertTo` 不为空，则会进行移动此面板至操作，
     * 新panel属性不会变化，需要手动调用 `updatePanel` 进行更新属性操作。
     * * 注意：如果 `insertTo` 不为空，则它的网格容器必须先存在，否则会添加失败。
     * * panel.key 不可为空。
     * @public
     * @param panel 面板
     * @param insertTo 将面板插入指定名称的网格，为空则插入至顶级网格
     */
    addPanel(panel: IDockPanel, insertTo?: string|DockData) {
      if (DockUtils.isNullOrEmpty(panel.key)) {
        console.error(`[DockLayout] Panel uid: ${panel.uid} key is empty`);
        return;
      }

      if (this.dockPanels.has(panel.key)) {
        if (!insertTo || DockUtils.isNullOrEmpty(insertTo as string))
          return;
        //已存在，重新添加到指定的父级网格
        const oldPanel = this.dockPanels.get(panel.key);
        if (!oldPanel)
          return;
        //从原来的网格移除
        const parent = oldPanel.parent;
        if(parent) {
          parent.removePanel(oldPanel);
          this.onActiveTabChange(parent, null, parent.activeTab as DockPanel);
          this.checkAndRemoveEmptyGrid(parent);
        }
        //添加到新的网格
        if (typeof insertTo === 'string')
          this.findAndInsertPanel(insertTo, oldPanel);
        else
          this.insertPanel(insertTo, oldPanel);
      } else {
        //新的网格，添加到指定的父级网格
        const newData = new DockPanel();
        newData.formJSON(panel);
        //添加到新的网格
        if (typeof insertTo === 'string')
          this.findAndInsertPanel(insertTo, newData);
        else
          this.insertPanel(insertTo || this.dockData as DockData, newData);
        this.dockPanels.set(panel.key, newData);
      }
    },
    /**
     * @public
     */
    addPanels(panels: IDockPanel[], insertTo?: string|DockData) {
      panels.forEach(panel => this.addPanel(panel, insertTo));
    },
    /**
     * 移除指定的面板
     * @public
     * @param key 面板唯一Key
     */
    removePanel(key: string) {
      const panel = this.dockPanels.get(key);
      if (!panel) {
        console.error(`[DockLayout] Remove Panel ${key} because it do not exist.`);
        return;
      }

      const parent = panel.parent;
      if(parent) {
        parent.removePanel(panel);
        this.onActiveTabChange(parent, null, parent.activeTab as DockPanel);
        this.checkAndRemoveEmptyGrid(parent);
      }

      this.dockPanels.delete(key);
    },
    /**
     * @public
     */
    removePanels(keys: string[]) {
      keys.forEach(key => this.removePanel(key));
    },
    /**
     * 激活指定的面板
     * @public
     * @param key 面板唯一Key
    */
    activePanel(key : string) {
      const panel = this.dockPanels.get(key);
      if(panel) {
        const parent = panel.parent;
        if(parent) {
          const last = parent.activeTab;
          parent.activeTab = panel;
          this.onActiveTabChange(this.dockData as DockData, last, panel);
        }
      }
    },
    resetAll() {
      this.dockData = new DockRootData();
      this.dockPanels.clear();
    },

    //#endregion

  }
});
</script>

<style lang="scss">
@import "./DockCommonStyles.scss";

$tab-height: 35px;

.dock-host {
  position: absolute;
  background-color: $tab-mormal-color;
}
.dock-grid {
  background-color: $tab-mormal-color;
}
.dock-grid, .dock-empty {
  position: relative;
  width: 100%;
  height: 100%;
}
.dock-panel {
  position: absolute;
  z-index: 60;
  display: none;
  overflow: hidden;
  overflow-y: scroll;
  background-color: $tab-active-color;

  @include pc-fix-scrollbar-white();
}

//light theme

.dock-host.light {
  position: absolute;
  background-color: $light-theme-tab-mormal-color;

  .dock-grid {
    background-color: $light-theme-tab-mormal-color;
  }
  .dock-panel {
    background-color: $light-theme-tab-active-color;
  }
}

</style>