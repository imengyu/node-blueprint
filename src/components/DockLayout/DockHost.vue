<script lang="ts">
import { Rect } from "@/model/Rect";
import { Vector2 } from "@/model/Vector2";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import StringUtils from "../../utils/StringUtils";
import { DockData, DockDirection, DockHostData, DockPanelData, IDockGridData } from "./DockData";
import DockGrid from "./DockGrid.vue";
import DockDropLayout from "./DockDropLayout.vue";
import { VNode } from "vue/types/umd";

@Component({
  components: {
    DockGrid: DockGrid,
    DockDropLayout: DockDropLayout
  },
})
export default class DockHost extends Vue implements DockHostData {
  dockPanels = new Map<string, DockPanelData>();
  dockData = new DockData();
  dockHost: DockHostData = null;

  needRemovePanels = new Array<string>();
  isDragging = false;

  mainLayout : DockGrid = null;
  dropLayout: HTMLDivElement = null;
  host: HTMLDivElement = null;
  dropStyleRegion = new Rect();//高亮区域坐标
  dropStyleRegionInTab = new Rect();//高亮区域坐标(Tab中)
  dropInRegionParent = new Rect();//当前鼠标所在区域的父级网格坐标
  dropInRegion = new Rect();//当前鼠标所在区域的网格坐标
  dropCurrentRegion : DockData = null;//当前鼠标所在区域的网格信息
  dropCurrentRegionDirection : string = '';//当前拖拽指定的强制插入方向
  dropCurrentPanel: DockPanelData = null;//当前拖动的面板
  dropIsTabMove = false;//当前拖动是否是在Tab中移动
  dropTabMoveTargetIndex = 0;//在Tab中移动到的目标索引

  showDropLayout = false;
  showDropMiddle = true;
  showDropLeftDep = true;
  showDropTopDep = true;
  showDropRightDep = true;
  showDropBottomDep = true;
  showDropTop = true;
  showDropBottom = true;
  showDropLeft = true;
  showDropRight = true;

  /**
   * 第一个布局网格是不是垂直的，默认为false
   */
  @Prop({ default: false }) startVerticalDirection: boolean;
  @Prop({ default: '' }) defaultAddGridName: string;
  @Prop({ default: 40 }) tabHeight: number;
  tabOffset = 3;


  //#region 插槽操作

  getSlots(key : string) {
    return this.$slots[key];
  }
  getOneSlot(key : string) {
    let s = this.$slots[key];
    return s.length > 0 ? s[0] : null;
  }

  lastBuildSlotCount = 0;

  bulidAllSlots() : VNode[] {

    let defSlot = this.$slots["default"];
    let dockPanels = this.dockPanels; 
         
    this.dockData.currentDirection = this.startVerticalDirection ? "vertical" : "horizontal";

    if(defSlot.length == this.lastBuildSlotCount) {
      //在这里刷新一次所有VNode
      defSlot.forEach((v) => {
        if (v.tag && v.tag.endsWith("DockPanel") && !StringUtils.isNullOrEmpty(v.key)) {
          if (this.dockPanels.has(v.key.toString())) {
            let panelData = this.dockPanels.get(v.key.toString());
            if(panelData.vnode != v) {
              panelData.vnode = v;
            }
          }
        }
      });
    } else {
      //首先清空标记
      dockPanels.forEach((v) => (v.refFound = false));

      if (defSlot.length > 0) {
        //扫描所有插槽
        defSlot.forEach((v) => {
          let key = v.key + '';
          if (v.tag && v.tag.endsWith("DockPanel") && !StringUtils.isNullOrEmpty(key)) {
            let panelData = dockPanels.get(key);
            if (panelData)
              panelData.isNew = false;
            else {
              panelData = new DockPanelData();
              panelData.isNew = true;
              panelData.key = key;
              dockPanels.set(key, panelData);
            }
            //标记插槽有效
            panelData.refFound = true;
            if(panelData.vnode != v) {
              panelData.vnode = v;
            }

            //复制属性
            let props = v.componentOptions ? v.componentOptions.propsData as { [index: string]: any } : null;
            if(props) {
              panelData.iconClass = props['iconClass'];
              panelData.title = props['title'];
              panelData.closeable = props['closeable'];
              panelData.closeUnSave = props['closeUnSave'];
              panelData.insertTo = props['insertTo'];
              panelData.tabLeftOffset = props['tabLeftOffset'];
            }


          }
        });
      } 
    
      let hasNewItem = false;

      this.needRemovePanels.empty();
      dockPanels.forEach((v, k) => {
        if (!v.refFound) {
          //如果没有有效标记，则标记删除插槽
          this.needRemovePanels.push(k);
          return;
        }
        //是新添加的，加入网格树
        if (v.isNew) {
          v.isNew = false;
          if(!StringUtils.isNullOrEmpty(v.insertTo))
            this.findAndInsertPanel(v.insertTo, v);
          else if(StringUtils.isNullOrEmpty(this.defaultAddGridName)) {
            let grid = this.loopForLastChildren(this.dockData);
            grid.addPanel(v);
          }  
          else
            this.findAndInsertPanel(this.defaultAddGridName, v);
          hasNewItem = true;
        }
      });
      this.$nextTick(() => {     
        //进行删除插槽
        this.needRemovePanels.forEach((k) => {
          let dockData = this.dockPanels.get(k);
          let parent = dockData.parent;
          dockPanels.delete(k);
          //删除
          if(parent) {
            let needFlushTabActive = parent.removePanel(dockData);
            if(needFlushTabActive) this.onActiveTabChange(parent, null, parent.activeTab);
            let el = document.getElementById('dock-panel-'+dockData.uid);
            if(el) this.host.removeChild(el);
            this.checkAndRemoveEmptyGrid(parent);
          }
        });
      });
      if(hasNewItem)
        this.$forceUpdate();
    }

    this.lastBuildSlotCount = defSlot.length;
    let tabHeight = this.tabHeight - this.tabOffset;

    //构建网格
    let arrBuildSlot = new Array<VNode>();
    let loopChild = function(data : DockData, region : Rect) {    
      data.lastLayoutSize.Set(region);
      if(data.panels.length > 0) {
        let panel : DockPanelData = null;
        for(let i = 0; i < data.panels.length; i++) {
          panel = data.panels[i];
          panel.vnode.data.attrs['id'] = 'dock-panel-' + panel.uid;
          let style = <any>panel.vnode.data.style;
          if(!style) { 
            style = new Object();
            panel.vnode.data.style = style;
          }
          style.top = `${region.y + tabHeight}px`;
          style.left = `${region.x + 2}px`;
          style.width = `${region.w - 4}px`;
          style.height = `${region.h - tabHeight}px`;
          style.display = panel == data.activeTab ? 'block' : 'none';

          (<any>panel.vnode.componentOptions.propsData)['dockPanelData'] = panel;
          //if(panel.vnode.data.props) panel.vnode.data.props['dockPanelData'] = panel;

          arrBuildSlot.push(panel.vnode);
        }
      } else {
        let dockData : DockData = null;
        let rect = new Rect();
        let currSize = 0, curGridSize = 0;
        for(let i = 0; i < data.grids.length; i++) {
          dockData = data.grids[i];
          if(data.currentDirection === 'vertical') {
            curGridSize = region.h * (dockData.size / 100);
            rect.Set(region.x, currSize, region.w, curGridSize);
          } else if(data.currentDirection === 'horizontal') {
            curGridSize = region.w * (dockData.size / 100);
            rect.Set(currSize, region.y, curGridSize, region.h);
          }
          currSize += curGridSize;
          loopChild(dockData, rect);
        }
      }
    }
    if(this.$refs.mainLayout) {
      let el = <Vue>this.$refs.mainLayout;
      let rect = new Rect(0,0,el.$el.clientWidth,el.$el.clientHeight);
      this.dockData.lastLayoutSize.Set(rect.h);
      loopChild(this.dockData, rect);
    }
    return arrBuildSlot;
  }

  loopForLastChildren(data : DockData) : DockData {
    if(data.grids.length == 0)
      return data;
    for(let i = 0; i < data.grids.length; i++) {
      let dataInChild = this.loopForLastChildren(data.grids[i]);
      if(dataInChild) 
        return dataInChild;
    }
    return data;
  }
  loopUpdateChildPanelPosition(data : DockData, region : Rect) {
    data.lastLayoutSize.Set(region);
    if(data.panels.length > 0) {
      let panel : DockPanelData = null;
      for(let i = 0; i < data.panels.length; i++) {
        panel = data.panels[i];
        let panelEl = document.getElementById('dock-panel-' + panel.uid);
        if(panelEl) {        
          panelEl.style.top = `${region.y + this.tabHeight - this.tabOffset}px`;
          panelEl.style.left = `${region.x + 2}px`;
          panelEl.style.width = `${region.w - 4}px`;
          panelEl.style.height = `${region.h - this.tabHeight - this.tabOffset}px`;
        }
      }
    } else {
      let dockData : DockData = null;
      let rect = new Rect();
      let currSize = 0, curGridSize = 0;
      for(let i = 0; i < data.grids.length; i++) {
        dockData = data.grids[i];
        if(data.currentDirection === 'vertical') {
          curGridSize = region.h * (dockData.size / 100);
          rect.Set(region.x, currSize, region.w, curGridSize);
          currSize += curGridSize;
          this.loopUpdateChildPanelPosition(dockData, rect);
        } else if(data.currentDirection === 'horizontal') {
          curGridSize = region.w * (dockData.size / 100);
          rect.Set(currSize, region.y, curGridSize, region.h);
          currSize += curGridSize;
          this.loopUpdateChildPanelPosition(dockData, rect);
        }
      }
    }
  }
  forceFlushAllPanelPos() {
    let el = <Vue>this.$refs.mainLayout;
    let rect = new Rect(0,0,el.$el.clientWidth,el.$el.clientHeight);
    this.dockData.lastLayoutSize.Set(rect);
    this.loopUpdateChildPanelPosition(this.dockData, rect);
  }

  /**
   * 查找网格
   */
  public findGrid(name : string) : DockData|null {
    let find = (data : DockData, name : string) : DockData => {
      if(data.name === name) 
        return data;
      for(let i = 0; i < data.grids.length; i++) {
        let dataInChild = find(data.grids[i], name);
        if(dataInChild) 
          return dataInChild;
      }
      return null;
    };
    return find(this.dockData, name);
  }
  findAndInsertPanel(name : string, panel : DockPanelData) {
    let grid = this.findGrid(name);
    if(grid) {
      grid = this.loopForLastChildren(grid);
      grid.addPanel(panel);
    }
  }

  //#endregion

  //#region 子容器的数据回传

  onGridDrag(thisGrid : DockData, nextGrid : DockData) {
    this.loopUpdateChildPanelPosition(thisGrid, thisGrid.lastLayoutSize);
    if(nextGrid)
      this.loopUpdateChildPanelPosition(nextGrid, nextGrid.lastLayoutSize);
  }
  onGridDropFinish(grid : DockData) {
    this.forceFlushAllPanelPos();
  }
  onActiveTabChange(grid : DockData, lastActive : DockPanelData, currentActive : DockPanelData) {
    if(lastActive){
      let lastActiveEl = document.getElementById('dock-panel-' + lastActive.uid);
      if(lastActiveEl) lastActiveEl.style.display = 'none';
    } 
    if(currentActive){
      let currentActiveEl = document.getElementById('dock-panel-' + currentActive.uid); 
      if(currentActiveEl) currentActiveEl.style.display = 'block';
    }
  }
  onSizeChanged() {
    this.forceFlushAllPanelPos();
  }

  //检测大小更改
  private checkSizeChangedTimer : any = null;
  private lastSize = new Vector2();
  private checkSizeChangedTick() {
    if(!this.dataSetFinished)
      return;
    if(this.lastSize.x != this.host.clientWidth || this.lastSize.y != this.host.clientHeight) {
      this.onSizeChanged();
      this.lastSize.x = this.host.clientWidth;
      this.lastSize.y = this.host.clientHeight;
    }
  }

  //#endregion

  //#region 主容器拖动事件

  lastPos = new Vector2();

  //放置
  onDrop(ev: DragEvent) {

    if(this.dropCurrentRegion == null)
      return;

    ev.preventDefault();

    if(!this.dropIsTabMove && this.dropCurrentRegionDirection == 'float')
      return;
    
    //通过拖动数据找到当前正在拖动的面板
    let currentPanelKey = ev.dataTransfer.getData('text/plain');
    if(StringUtils.isNullOrEmpty(currentPanelKey) || currentPanelKey.length < 16)
      return;
    currentPanelKey = currentPanelKey.substring(15);
    let currentPanel = this.dockPanels.get(currentPanelKey);
    if(!currentPanel)
      return;

    let currentIndexInPanel = this.dropCurrentRegion.panels.indexOf(currentPanel);  
    let parent = currentPanel.parent; 
    if(parent && !(this.dropIsTabMove && parent == this.dropCurrentRegion)) {
      let needFlushTabActive = parent.removePanel(currentPanel);//在原来的容器中移除
      if(needFlushTabActive) this.onActiveTabChange(parent, null, parent.activeTab);
      this.checkAndRemoveEmptyGrid(parent);
    }

    if(this.dropIsTabMove) { 
      //是放置在标签页中
      
      //如果拖动元素不在当前Tab中,或目标与当前索引不一致，重新插入
      if(currentIndexInPanel < 0 || currentIndexInPanel != this.dropTabMoveTargetIndex) {
        
        //如果拖动元素在当前Tab中，当前拖动的元素移除掉之后，后面的索引-1      
        if(currentIndexInPanel >= 0) {
          parent.panels.remove(currentPanel);
          if(currentIndexInPanel < this.dropTabMoveTargetIndex) 
            this.dropTabMoveTargetIndex--; 
        }
        
        //重新插入
        let lastActiveTab = this.dropCurrentRegion.activeTab;
        this.dropCurrentRegion.addPanel(currentPanel, this.dropTabMoveTargetIndex);
        this.dropCurrentRegion.activeTab = currentPanel;
        this.onGridDropFinish(this.dropCurrentRegion);
        this.onActiveTabChange(this.dropCurrentRegion, lastActiveTab, currentPanel);
      }
    } else {
      //是放置在网格中

      //通过指示箭头来计算当前需要把面板放置在哪个位置
      switch(this.dropCurrentRegionDirection) {
        case 'float': 
          //浮动

          break;
        case 'middle':
          if(this.dropCurrentRegion.grids.length == 0) {
            let lastActiveTab = this.dropCurrentRegion.activeTab;
            this.dropCurrentRegion.addPanel(currentPanel);
            this.dropCurrentRegion.activeTab = currentPanel;
            this.onActiveTabChange(this.dropCurrentRegion, lastActiveTab, currentPanel);
            this.onGridDropFinish(this.dropCurrentRegion);
          }
          break;
        case 'top': 
        case 'bottom':   
          this.reGridRegion(this.dropCurrentRegion, 'vertical', currentPanel);
          break;
        case 'right':
        case 'left': 
          this.reGridRegion(this.dropCurrentRegion, 'horizontal', currentPanel);
          break;
        case 'top-dep': 
        case 'bottom-dep': 
          this.reGridRegion(this.dropCurrentRegion.parent, 'vertical', currentPanel);
          break;
        case 'right-dep': 
        case 'left-dep': 
          this.reGridRegion(this.dropCurrentRegion.parent, 'horizontal', currentPanel);
          break;
      }
    }

    this.dropIsTabMove = false;
    this.dropStyleRegion.Set(0,0,0,0);
    this.dropStyleRegionInTab.Set(0,0,0,0);

    //清除掉箭头的状态
    document.querySelectorAll('.dock-drop-square.active').forEach((e) => e.classList.remove('active'));
  }
  onDragEnter(ev: DragEvent) {
    let target = <HTMLElement>ev.target;
    if (target) {
      if (target.getAttribute('data-drag-drop') == "true")
        this.dragArrowActive(target);
    }
  }
  onDragLeave(ev: DragEvent) {
    let target = <HTMLElement>ev.target;
    if (target) {
      if (target.getAttribute('data-drag-drop') == "true") 
        this.dragArrowDeactive(target);
    }
  }
  onDragOver(ev: DragEvent) {
    ev.preventDefault();
    let x = ev.clientX - this.host.offsetLeft;
    let y = ev.clientY - this.host.offsetTop;

    if(Math.abs(x - this.lastPos.x) > 10 || Math.abs(y - this.lastPos.y) > 10) {
      this.lastPos.Set(x, y);
      this.flushDragCurrentRegion(this.lastPos.x, this.lastPos.y);
    }
  }

  nextInDir = '';

  dragArrowActive(el : HTMLElement) {
    let direction = el.getAttribute('data-direction');
    if(StringUtils.isNullOrEmpty(direction))
      return;
    el.classList.add("active");
    this.nextInDir = direction;
  }
  dragArrowDeactive(el : HTMLElement) {
    let direction = el.getAttribute('data-direction');
    if(!StringUtils.isNullOrEmpty(direction)) {
      el.classList.remove("active");
      this.dropCurrentRegionDirection = this.nextInDir;
      this.flushDragDirectionRegion();
    }
  }

  checkAndRemoveEmptyGrid(data : DockData) {
    if (data.alwaysVisible)
      return;
    if (data.grids.length == 0 && data.panels.length == 0) {
      let parent = data.parent; 
      if(parent) {
        parent.removeGrid(data);
        this.checkAndRemoveEmptyGrid(parent);
      }
    } else if (data.grids.length == 1 && data.panels.length == 0) { 
      //只有一个网格了，合并重复的
      let child = data.grids[0];
      data.panels = child.panels;
      data.grids = child.grids;
      data.resetPanelsParent();
      data.resetGridsParent();

      //递归继续合并子级的数据
      if(data) this.checkAndRemoveEmptyGrid(data);
    } 
  }
  reGridRegion(grid : DockData, driection : 'vertical'|'horizontal', currentPanel : DockPanelData) {
    if(grid.currentDirection === driection) { //方向相同

      let oldActiveTab = grid.activeTab;
      let isLeftDir = (this.dropCurrentRegionDirection.startsWith('top') || this.dropCurrentRegionDirection.startsWith('left'));
      let isDep = this.dropCurrentRegionDirection.endsWith('-dep');
      
      let newRegionOne = grid, newRegionTwo = new DockData();
      newRegionTwo.setDirectionByParent(grid);
      newRegionTwo.addPanel(currentPanel);

      if(grid.panels.length > 0) {
        //拆分网格并重构层级
        newRegionOne = new DockData();
        newRegionOne.panels = grid.panels;
        newRegionOne.resetPanelsParent();
        newRegionOne.setDirectionByParent(grid); 
        grid.panels = [];

        //添加拆分的网格
        grid.addGrid(newRegionOne);
        grid.addGrid(newRegionTwo, isLeftDir ? 0 : undefined);
        this.onGridDropFinish(newRegionOne);
        this.onGridDropFinish(newRegionTwo);
      } else {
        //这本来就是网格，可直接添加，不需要拆分
        let index = grid.grids.indexOf(this.dropCurrentRegion);
        if(index == -1 || isDep)
          grid.addGrid(newRegionTwo, isLeftDir ? 0 : undefined)
        else
          grid.addGrid(newRegionTwo, isLeftDir ? index : index + 1)
        
        this.onGridDropFinish(newRegionTwo);
      }

      let oldActiveTabOne = newRegionOne.activeTab;
      let oldActiveTabTwo = newRegionTwo.activeTab;

      newRegionOne.activeTab = oldActiveTab;
      newRegionTwo.activeTab = currentPanel;
      
      this.onActiveTabChange(newRegionOne, oldActiveTabOne, oldActiveTab);
      this.onActiveTabChange(newRegionTwo, oldActiveTabTwo, currentPanel);
    } else if(grid.parent) { //方向不同，直接推到父级去
      this.reGridRegion(grid.parent, driection, currentPanel);
    } 
  }

  lastHoverTabUid = '';
  lastHoverTab : HTMLElement = null;

  //刷新当前鼠标拖动插入方向箭头的区域信息
  flushDragDirectionRegion() {

    //刷新箭头显示
    this.showDropLeftDep = this.dropInRegionParent.x != this.dropInRegion.x;
    this.showDropTopDep = this.dropInRegionParent.y != this.dropInRegion.y;
    this.showDropRightDep = this.dropInRegionParent.w != this.dropInRegion.w;
    this.showDropBottomDep = this.dropInRegionParent.h != this.dropInRegion.h;

    if(this.dropCurrentRegion != null) {

      let isCurrentViewNotRedundant = (!this.dropCurrentRegion.panels.contains(this.dropCurrentPanel) || this.dropCurrentRegion.panels.length > 1);
      let isSuperHrView =  (this.dropCurrentRegion.parent != null || (this.dropCurrentRegion == this.dockData && this.dropCurrentRegion.currentDirection === 'horizontal'));
      let isSuperVeView =  (this.dropCurrentRegion.parent != null || (this.dropCurrentRegion == this.dockData && this.dropCurrentRegion.currentDirection === 'vertical'));

      this.showDropMiddle = !this.dropCurrentRegion.panels.contains(this.dropCurrentPanel);
      this.showDropTop = isSuperVeView && isCurrentViewNotRedundant;
      this.showDropBottom = isSuperVeView && isCurrentViewNotRedundant;
      this.showDropLeft = isSuperHrView && isCurrentViewNotRedundant;
      this.showDropRight = isSuperHrView && isCurrentViewNotRedundant;
      //不同插入方向
      switch(this.dropCurrentRegionDirection) {
        case 'middle':
          this.dropStyleRegion.Set(this.dropInRegion);
          break;
        case 'top': 
          this.dropStyleRegion.Set(this.dropInRegion.x, this.dropInRegion.y, this.dropInRegion.w, this.dropInRegion.h / 2);
          break;
        case 'right': 
          this.dropStyleRegion.Set(this.dropInRegion.x + this.dropInRegion.w / 2, this.dropInRegion.y, this.dropInRegion.w / 2, this.dropInRegion.h);
          break;
        case 'bottom':
          this.dropStyleRegion.Set(this.dropInRegion.x, this.dropInRegion.y + this.dropInRegion.h / 2, this.dropInRegion.w, this.dropInRegion.h / 2);
          break;
        case 'left': 
          this.dropStyleRegion.Set(this.dropInRegion.x, this.dropInRegion.y, this.dropInRegion.w / 2, this.dropInRegion.h);
          break;
        case 'top-dep': 
          this.dropStyleRegion.Set(this.dropInRegionParent.x, this.dropInRegionParent.y, this.dropInRegionParent.w, this.dropInRegionParent.h / 4);
          break;
        case 'right-dep': 
          this.dropStyleRegion.Set(this.dropInRegionParent.x + this.dropInRegionParent.w / 4 * 2, this.dropInRegionParent.y, this.dropInRegionParent.w / 4, this.dropInRegionParent.h);
          break;
        case 'bottom-dep': 
          this.dropStyleRegion.Set(this.dropInRegionParent.x, this.dropInRegionParent.y + this.dropInRegionParent.h / 4 * 2, this.dropInRegionParent.w, this.dropInRegionParent.h / 4);
          break; 
        case 'left-dep': 
          this.dropStyleRegion.Set(this.dropInRegionParent.x, this.dropInRegionParent.y, this.dropInRegionParent.w / 4, this.dropInRegionParent.h);
          break;
      }
    } else {
      this.showDropTop = false;
      this.showDropBottom = false;
      this.showDropLeft = false;
      this.showDropRight = false;
      this.showDropMiddle = false;
      if(this.dropIsTabMove) this.dropStyleRegion.Set(this.dropStyleRegionInTab);
      else this.flushFloatDragLightBox();
    }
  }
  flushFloatDragLightBox() {
    this.dropStyleRegion.Set(this.lastPos.x - 100, this.lastPos.y + 12, 200, 100);
  }
  //刷新当前鼠标拖动所在的网格区域
  flushDragCurrentRegion(x : number, y : number) {

    let lastRegion = this.dropCurrentRegion;

    let region = new Rect(0, 0, this.mainLayout.$el.clientWidth, this.mainLayout.$el.clientHeight);
    let loopChilds = (dockData : DockData, region : Rect) : boolean => {
      let gridLen = dockData.grids.length;
      if(gridLen > 0) {
        //有子级，平分当前区域
        if(dockData.currentDirection === 'vertical') {
          let nowY = 0, nowH = 0, nowS = 0;
          for(let i = 0; i < gridLen; i++) {
            nowS = dockData.grids[i].size;
            nowH = (nowS <= 0 ? (1 / gridLen) : (nowS / 100)) * region.h;
            if(y >= nowY && y <= nowY + nowH) { //鼠标当前在某个网格中，那么不需要扫描其他网格了
              this.dropInRegionParent.Set(region);//保存父级网格
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
              this.dropInRegionParent.Set(region);//保存父级网格
              region.x = nowX; region.w = nowW;
              return loopChilds(dockData.grids[i], region);//递归扫描子网格
            }
            nowX += nowW;
          }
        }
      } else { //没有子级
        this.dropCurrentRegion = dockData;//当前网格
        //扫描当前是否在Tab区域内
        this.dropIsTabMove = false;
        //console.log(`x:${x},y:${y},region:${region}`);
        if(x >= region.x && x < region.getRight() && y >= region.y && y < region.y + this.tabHeight) {
          //获取鼠标悬浮的Tab元素
          if(this.lastHoverTabUid != dockData.uid) {
            this.lastHoverTab = document.getElementById('dock-tab-contol-uid-'+dockData.uid);
            this.lastHoverTabUid = dockData.uid;
          }
          
          let tab = this.lastHoverTab;
          if(tab) {
            let scroll = tab.scrollLeft;
            let xref = x - region.x;
            this.dropIsTabMove = true;
            this.dropTabMoveTargetIndex = -1;
            this.dropStyleRegionInTab.Set(0, region.y, 30, tab.offsetHeight+3);
            //直接获取所有子tab条目，计算出将要插入到哪个位置
            for(let i = 0; i < tab.childNodes.length; i++) {
              let item = <HTMLElement>tab.childNodes[i];
              if(xref >= item.offsetLeft - 30 - scroll && xref <= item.offsetLeft + item.offsetWidth - 30 - scroll) {
                this.dropTabMoveTargetIndex = i;
                this.dropStyleRegionInTab.x = region.x + item.offsetLeft - 14 - scroll + 32;
                break;
              }
            }
            if(this.dropTabMoveTargetIndex == -1) {
              let item = <HTMLElement>tab.childNodes[tab.childNodes.length - 1];
              if(xref >= item.offsetLeft + item.offsetWidth - 30 - scroll) {
                this.dropTabMoveTargetIndex = tab.childNodes.length;
                this.dropStyleRegionInTab.x = region.x + item.offsetLeft - 14 + item.clientWidth - scroll + 32;
              } else {
                this.dropStyleRegionInTab.w = 0;
              }
            }

            //设置高亮区域
            this.dropStyleRegion.Set(this.dropStyleRegionInTab);
          } 
          return true;
        }
        return false;
      }
    };

    this.dropCurrentRegion = null;
    this.dropInRegionParent.Set(region);

    if(!loopChilds(this.dockData, region)) {
      if(this.dropCurrentRegionDirection === 'float') {
        this.flushFloatDragLightBox();
      }
    }

    //强制刷新一次
    if(lastRegion != this.dropCurrentRegion)
      this.flushDragDirectionRegion();

    //通过递归扫描，当前region里面就是鼠标位置的网格了，现在设置到主变量上
    this.dropInRegion.Set(region);
  }

  onStartDrag () {
    setTimeout(() => this.flushDragDirectionRegion(), 100);
  }
  onEndDrag () {

  }

  //#endregion

  //#region 数据操作

  dataSetFinished = false;

  public getSaveData() : IDockGridData {
    return this.dockData.toJSON();
  }
  public setData(data : IDockGridData) {
    this.lastBuildSlotCount = 0;
    this.loadDockData(this.dockData, data, this.startVerticalDirection ? 'vertical' : 'horizontal');
    //强制刷新
    this.bulidAllSlots();
    this.loadDockDataPanels(this.dockData, data);
    this.dataSetFinished = true;
    this.$forceUpdate();
  }

  private loadDockData(data : DockData, src : IDockGridData, direction : DockDirection) {
    data.currentDirection = direction;
    data.size = src.size;
    data.name = src.name || '';
    data.alwaysVisible = src.alwaysVisible;
    data.noPanelViewSlotName = src.noPanelViewSlotName;

    src.grids.forEach((g) => {
      let newData = new DockData();
      g.uid = newData.uid;
      this.loadDockData(newData, g, direction === 'vertical' ? 'horizontal' : 'vertical');
      data.addGrid(newData, undefined, true);
    });
  }
  private loadDockDataPanels(data : DockData, src : IDockGridData) {
    src.grids.forEach((g) => {
      let childData : DockData = null;
      for(let i = 0; i < data.grids.length; i++)
        if(data.grids[i].uid === g.uid) {
          childData = data.grids[i];
          break;
        }
      if(childData)
        this.loadDockDataPanels(childData, g);
    });
    src.panels.forEach((p) => {
      let panel = this.dockPanels.get(p.key); 
      if(panel) {
        if(panel.parent)
          panel.parent.removePanel(panel);
        data.addPanel(panel);
      }
    });
  }


  //#endregion

  mounted() {
    setTimeout(() => {
      this.checkSizeChangedTimer = setInterval(this.checkSizeChangedTick, 1000);
      this.dockHost = this;
      this.host = <HTMLDivElement>this.$refs.host;
      this.lastSize.x = this.host.clientWidth;
      this.lastSize.y = this.host.clientHeight;
      this.mainLayout = <DockGrid>this.$refs.mainLayout;
      this.dropLayout = <HTMLDivElement>this.$refs.dropLayout;
      this.$forceUpdate();
    }, 300);
    //JSON.stringify(testDockHost.getSaveData())
  }
  beforeDestroy() {
    clearInterval(this.checkSizeChangedTimer);
  }

  render() {
    let h = this.$createElement;
    let allNodes = this.dataSetFinished ? this.bulidAllSlots() : [];

    return h('div', {
      class: 'dock-host',
      ref: 'host',
      on: {
        dragover: ($event : DragEvent) => this.onDragOver($event),
        dragenter: ($event : DragEvent) => this.onDragEnter($event),
        dragleave: ($event : DragEvent) => this.onDragLeave($event),
        drop: ($event : DragEvent) => this.onDrop($event),
      }
    }, [
      //主区域
      h(DockGrid, {
        ref: 'mainLayout',
        props: {
          dockData: this.dockData,
          dockHost: this.dockHost
        }
      }, []),
      //拖放区域
      h(DockDropLayout, {
        props: {
          showDropLayout: this.showDropLayout,
          showDropTop: this.showDropTop,
          showDropBottom: this.showDropBottom,
          showDropLeft: this.showDropLeft,
          showDropRight: this.showDropRight,
          showDropMiddle: this.showDropMiddle,
          showDropLeftDep: this.showDropLeftDep,
          showDropRightDep: this.showDropRightDep,
          showDropTopDep: this.showDropTopDep,
          showDropBottomDep: this.showDropBottomDep,
          dropInRegion: this.dropInRegion,
          dropStyleRegion: this.dropStyleRegion,
        }
      }, []),
      allNodes,
    ]);
  }
}
</script>
