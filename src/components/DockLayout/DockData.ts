import { Rect } from '@/model/Rect';
import CommonUtils from '@/utils/CommonUtils';
import { VNode } from 'vue/types/umd';

export type DockDirection = 'vertical'|'horizontal'|'unknow';

/**
 * 停靠容器数据
 */
export class DockData {

  public constructor() {
    this.uid = CommonUtils.genNonDuplicateID(16);
  }

  /**
   * 当前容器的布局方向
   */
  public currentDirection: DockDirection = 'unknow';
  /**
   * 子容器
   */
  public grids = new Array<DockData>();
  /**
   * 其中包含的面板
   */
  public panels = new Array<DockPanelData>();
  /**
   * 当前容器的大小（占父级的百分比1-100）
   */
  public size = 0;
  /**
   * 是否是永远显示（否则在当前网格没有子面板时会被移除）
   */
  public alwaysVisible = false;
  /**
   * 当前激活的面板
   */
  public activeTab : DockPanelData = null;
  /**
   * 名称
   */
  public name = '';


  //内部使用
  public uid = '';
  public startSize = 0;
  public lastLayoutSize = new Rect();
  public parent : DockData = null;
  public noPanelViewSlotName = '';

  public addPanel(panel : DockPanelData, insertIndex ?: number) {
    if(!this.panels.contains(panel)) {
      if(typeof insertIndex === 'number') this.panels.insert(insertIndex, panel);
      else this.panels.push(panel);
      panel.parent = this;
      if(this.activeTab == null) this.activeTab = panel;
    }
  }
  public removePanel(panel : DockPanelData) {
    let i = this.panels.indexOf(panel);
    if(i >= 0) {
      this.panels.splice(i, 1);
      if(this.activeTab == panel) {
        this.activeTab = this.panels[i >= this.panels.length ? this.panels.length - 1 : i];
        return true;
      }
      panel.parent = null;
    }
    return false;
  }
  public addGrid(grid : DockData, insertIndex ?: number, forceSize = false) {
    if(!this.grids.contains(grid)) {

      if(typeof insertIndex === 'number') this.grids.insert(insertIndex, grid);
      else this.grids.push(grid);
      grid.parent = this;

      if(!forceSize) {
        //计算网格新插入后的大小
        let targetSize = getTargetGridSize(this.grids.length);
        let cutSize = targetSize / (this.grids.length - 1);

        //重新分配子的大小
        this.grids.forEach((g) => {
          g.size -= cutSize;
        });

        grid.size = targetSize;
      }
    }
  }
  public removeGrid(grid : DockData) {
    if(this.grids.remove(grid)) {
      grid.parent = null;

      //该子大小腾出来了，重新分配其他子的大小
      let equalDivisionSize = grid.size / this.grids.length;
      this.grids.forEach((g) => {
        g.size += equalDivisionSize
      });
    }
  }
  public resetPanelsParent() { this.panels.forEach((v) => v.parent = this); }
  public resetGridsParent() { this.grids.forEach((v) => v.parent = this); }
  public setDirectionByParent(parent : DockData) {
    if(parent.currentDirection === 'vertical') {
      this.currentDirection = 'horizontal';
    } else {
      this.currentDirection = 'vertical';
    }
  }

  public toJSON() : IDockGridData {
    return {
      size: this.size,
      grids: this.grids.map((v) => v.toJSON()),
      panels: this.panels.map((v) => v.toJSON()),
      alwaysVisible: this.alwaysVisible,
    }
  }
}

function getTargetGridSize(nowLen : number) {
  if(nowLen === 0) return 100;
  else if(nowLen <= 6)
    return 100 / nowLen;
  return 14;
}

/**
 * 停靠面板数据
 */
export class DockPanelData {

  public constructor() {
    this.uid = CommonUtils.genNonDuplicateID(16);
  }

  public key = '';
  public title = '';
  public iconClass = '';
  public vnode : VNode = null;
  public visible = true;
  public closeUnSave = false;
  public closeable = false;
  public parent : DockData = null;

  public refFound = false;
  public isNew = true;
  public uid = '';
  public insertTo = '';
  public tabLeftOffset = 0;

  public onClose : () => void = null;
  public onTabRightClick : () => void = null;

  public toJSON() : IDockPanelData {
    return {
      key: this.key
    }
  }
}

/**
 * 停靠网格的保存数据
 */
export interface IDockGridData {
  /**
   * 格子的大小（占父级的百分比1-100），为0则表示自动平均占据父容器
   */
  size : number,
  /**
   * 子网格
   */
  grids: IDockGridData[],
  /**
   * 子面板
   */
  panels: IDockPanelData[],
  /**
   * 是否是永远显示（否则在当前网格没有子面板时会被移除掉）
   */
  alwaysVisible ?: boolean;
  /**
   * 当当前网格没有面板时，显示的视图插槽名字（在DockHost中定义）
   * （只有在alwaysVisible为true时有效）
   */
  noPanelViewSlotName ?: string;
  /**
   * 当前格子名称
   */
  name ?:string;
  
  uid ?:string;
}
/**
 * 面板的保存数据
 */
export interface IDockPanelData {
  /**
   * 面板的key（和Vue组件上的key一致）
   */
  key: string
}

/**
 * 主容器数据
 */
export interface DockHostData {
  isDragging: boolean;
  onStartDrag: () => void;
  onEndDrag: () => void;
  onGridDrag: (thisGrid : DockData, nextGrid : DockData) => void;
  onActiveTabChange: (grid : DockData, lastActive : DockPanelData, currentActive : DockPanelData) => void;
  dropCurrentPanel: DockPanelData;
  showDropLayout : boolean;
  host: HTMLDivElement,
  tabHeight: number;
  getSlots: (key: string) => VNode[];
  getOneSlot: (key: string) => VNode;
}