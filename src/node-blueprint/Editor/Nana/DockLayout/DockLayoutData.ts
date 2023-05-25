import type { VNode } from "vue";
import DockUtils, { type IKeyAnyObject } from "./DockUtils";
import { Rect } from "./DockVector";

/**
 * 描述拖动界面面板属性的接口
 */
export interface IDockPanel {
  /**
   * 当前面板的标签，用于拖动相关判断
   */
  tag?: string;
  /**
   * 面板唯一Key
   */
  key: string;
  /**
   * 面板标题
   */
  title?: string;
  /**
  * 面板的图标类
  */
  iconClass?: string;
  /**
  * 关闭按扭是否显示未保存圆点。默认：否
  */
  closeUnSave?: boolean;
  /**
  * 是否显示关闭按扭。默认：否
  */
  closeable?: boolean;
  /**
   * 是否使用 tabItemRender 插槽自定义绘制Tab条目，默认：否
   */
  customTab?: boolean;
  /**
   * 如果指定了渲染函数，则会调用此渲染函数渲染面板内容
   */
  render?: ((panel: IDockPanel) => VNode)|null;
  /**
  * 关闭按扭点击事件回调。如果返回 true，则执行移除面板操作。
  */
  onClose?: (() => boolean) | null;
  /**
  * 标签右键点击事件回调
  */
  onTabRightClick?: (() => void) | null;

  uid?: string;
}

/**
 * 描述拖动界面网格属性的接口
 */
export interface IDockGrid {
  /**
   * 格子的大小（占父级的百分比1-100），为0则表示自动平均占据父容器
   */
  size: number,
  /**
  * 子网格
  */
  grids?: IDockGrid[],
  /**
  * 子面板
  */
  panels?: IDockPanel[],
  /**
  * 是否是永远显示（否则在当前网格没有子面板时会被移除掉）
  */
  alwaysVisible?: boolean;
  /**
  * 当前格子名称
  */
  name?: string;
  /**
   * 标签
   */
  tag?: string;
  /**
  * 可放入的面板标签数组。此限制仅在用户拖动时有效，使用 `addPanel`, `setData` 等接口添加的面板不受此限制。
  */
  acceptPanelTags?: string[];
  /**
   * 是否允许拖拽入当前面板时深层插入，深层插入会在当前同级创建新的网格，如果你希望把面板限制在当前容器中（搭配acceptPanelTags），可以设置此属性为false。默认：是
   */
  allowDep?: boolean;
  /**
   * Tab的自定义样式
   */
  tabStyle?: IKeyAnyObject;
  /**
   * Tab条目的自定义样式
   */
  tabItemStyle?: IKeyAnyObject;

  uid?: string;
}

/**
 * 拖动界面网格方向定义
 */
export type DockDirection = 'vertical' | 'horizontal' | 'unknow';

/**
 * tabItemRender 插槽数据定义
 */
export interface DockTabItemRenderData {
  dockData: DockData, 
  panel: DockPanel, 
  index: number, 
  onTabItemMouseDown: (e: MouseEvent, item: DockPanel) => void, 
  onTabItemDragStart: (ev: DragEvent, item: DockPanel) => void, 
  onTabItemDragEnd: (ev: DragEvent) => void, 
  onTabItemClose: (panel: DockPanel) => void, 
}

export function getTargetGridSize(nowLen: number) : number {
  if (nowLen === 0) 
    return 100;
  else if (nowLen <= 6)
    return 100 / nowLen;
  return 14;
}


/**
 * 停靠容器数据
 */
export class DockData implements IDockGrid {

  constructor() {
    this.uid = DockUtils.genNonDuplicateID(16);
  }

  /**
   * 当前容器的布局方向
   */
  currentDirection: DockDirection = 'unknow';
  /**
   * 子容器
   */
  grids = new Array<DockData>();
  /**
   * 其中包含的面板
   */
  panels = new Array<DockPanel>();
  /**
   * 当前容器的大小（占父级的百分比1-100）
   */
  size = 0;
  /**
   * 是否是永远显示（否则在当前网格没有子面板时会被移除）
   */
  alwaysVisible = false;
  /**
   * 当前激活的面板
   */
  activeTab: DockPanel | null = null;
  /**
   * 名称
   */
  name = '';
  /**
   * 标签
   */
  tag = '';
  /**
   * 允许拖放的子面板
   */
  acceptPanelTags = [] as string[];
  /**
   * 允许深层插入
   */
  allowDep = true;
  /**
   * Tab的自定义样式
   */
  tabStyle = {};
   /**
    * Tab条目的自定义样式
    */
  tabItemStyle = {};

  //内部使用
  uid = '';
  startSize = 0;
  lastLayoutSize = new Rect();
  parent: DockData | null = null;
  allowIsolated = false;

  isIsolated() : boolean {
    return this.parent === null;
  }

  addPanel(panel: DockPanel, insertIndex?: number): boolean {
    if (!this.allowIsolated && this.isIsolated()) {
      console.error('addPanel on a isolated DockData', this.name);
      return false;
    }
    if (panel.parent !== null && (panel.parent !== this)) {
      console.error('Panel ' + panel.key + ' Not removed before adding, current parent', panel.parent, 'target parent', this.name);
      return false;
    }
    if (!this.panels.includes(panel)) {
      if (typeof insertIndex === 'number') this.panels.splice(insertIndex, 0, panel);
      else this.panels.push(panel);
      panel.parent = this;
      if (this.activeTab === null) {
        this.activeTab = panel;
        return true;
      }
    }
    return false;
  }
  removePanel(panel: DockPanel): boolean {
    const i = this.panels.indexOf(panel);
    if (i >= 0) {
      this.panels.splice(i, 1);
      panel.parent = null;
      if (this.activeTab === panel) {
        //移除面板后，检查网格选中，如果选中项是移除的面板，则重新选中一个面板
        this.activeTab = this.panels[i >= this.panels.length ? this.panels.length - 1 : i];
        return true;
      }
    }
    return false;
  }
  addGrid(grid: DockData, insertIndex?: number, forceSize = false): void {
    if (!this.allowIsolated && this.isIsolated()) {
      console.error('addGrid on a isolated DockData', this.name);
      return;
    }

    if (!this.grids.includes(grid)) {

      if (typeof insertIndex === 'number')
        this.grids.splice(insertIndex, 0, grid);
      else
        this.grids.push(grid);
      grid.parent = this;

      if (!forceSize) {
        //计算网格新插入后的大小
        const targetSize = getTargetGridSize(this.grids.length);
        const cutSize = targetSize / (this.grids.length - 1);

        //重新分配子的大小
        this.grids.forEach((g) => {
          g.size -= cutSize;
        });

        grid.size = targetSize;
      }
    }
  }
  removeGrid(grid: DockData): void {
    const index = this.grids.indexOf(grid);
    if (index >= 0) {
      this.grids.splice(index, 1);

      grid.parent = null;

      //该子大小腾出来了，重新分配其他子的大小
      const equalDivisionSize = grid.size / this.grids.length;
      this.grids.forEach((g) => {
        g.size += equalDivisionSize
      });
    }
  }
  resetPanelsParent(): void {
    this.panels.forEach((v) => v.parent = this);
  }
  resetGridsParent(): void {
    this.grids.forEach((v) => v.parent = this);
  }
  //依据父级方向设置当前的方向
  setDirectionByParent(parent: DockData): void {
    if (parent.currentDirection === 'vertical') {
      this.currentDirection = 'horizontal';
    } else {
      this.currentDirection = 'vertical';
    }
  }
  //从父级继承一些用户属性
  inhertProps(parent: DockData) : void {
    //this.alwaysVisible = parent.alwaysVisible;
    this.acceptPanelTags = parent.acceptPanelTags;
    this.allowDep = parent.allowDep;
    this.tabItemStyle = parent.tabItemStyle;
    this.tabStyle = parent.tabStyle;
    this.tag = parent.tag;
  }

  /**
   * 递归序列化为JSON以供保存
   */
  toJSON(): IDockGrid {
    return {
      size: this.size,
      grids: this.grids.map((v) => v.toJSON()),
      panels: this.panels.map((v) => v.toJSON()),
      alwaysVisible: this.alwaysVisible,
      name: this.name,
      acceptPanelTags: this.acceptPanelTags,
    }
  }
}

/**
 * 停靠容器数据
 */
export class DockRootData extends DockData {

  constructor() {
    super();
    this.allowIsolated = true;
  }
}

/**
 * 描述拖动界面网格属性实体
 */
export class DockPanel implements IDockPanel {

  constructor() {
    this.uid = DockUtils.genNonDuplicateID(16);
  }

  /**
   * 父级
   */
  parent: DockData | null = null;
  /**
   * 当前面板的标签，用于拖动相关判断
   */
  tag = '';

  /**
   * 如果指定了渲染函数，则会调用此渲染函数渲染面板内容
   */
  render: ((panel: IDockPanel) => VNode)|null = null;

  //内部使用
  uid = '';
  visible = false;
  finalRegion = new Rect();

  /**
   * 面板唯一Key
   */
  key = '';
  /**
   * 面板标题
   */
  title = '';
  /**
   * 面板的图标类
   */
  iconClass = '';
  /**
   * 关闭按扭是否显示未保存圆点
   */
  closeUnSave = false;
  /**
   * 是否显示关闭按扭
   */
  closeable = false;
  /**
   * 是否使用 tabItemRender 插槽自定义绘制Tab条目，默认：否
   */
  customTab = false;
  /**
   * 关闭按扭点击事件回调。如果返回 true，则执行移除面板操作。
   */
  onClose: (() => boolean) | null = null;
  /**
   * 标签右键点击事件回调
   */
  onTabRightClick: (() => void) | null = null;

  /**
   * 递归序列化为JSON以供保存
   */
  toJSON(): IDockPanel {
    return {
      uid: this.uid,
      tag: this.tag,
      key: this.key,
      title: this.title,
      iconClass: this.iconClass,
      closeUnSave: this.closeUnSave,
      closeable: this.closeable,
      customTab: this.customTab,
    };
  }
  /**
   * 从JSON创建当前对象
   * @param json 
   */
  formJSON(json: IDockPanel): void {
    this.uid = DockUtils.defaultIfUndefined(json.uid, this.uid);
    this.tag = DockUtils.defaultIfUndefined(json.tag, this.tag);
    this.key = DockUtils.defaultIfUndefined(json.key, this.key);
    this.title = DockUtils.defaultIfUndefined(json.title, this.title);
    this.iconClass = DockUtils.defaultIfUndefined(json.iconClass, this.iconClass);
    this.closeUnSave = DockUtils.defaultIfUndefined(json.closeUnSave, this.closeUnSave);
    this.closeable = DockUtils.defaultIfUndefined(json.closeable, this.closeable);
    this.customTab = DockUtils.defaultIfUndefined(json.customTab, this.customTab);
    this.onClose = DockUtils.defaultIfUndefined(json.onClose, this.onClose);
    this.onTabRightClick = DockUtils.defaultIfUndefined(json.onTabRightClick, this.onTabRightClick);
    this.render = DockUtils.defaultIfUndefined(json.render, this.render);
  }
}

/**
 * DockLayout 公共接口
 */
export interface DockLayoutInterface {
  /**
   * 获取界面网格布局数据
   * @public
   */
  getSaveData: () => IDockGrid;
  /**
   * 设置界面网格布局数据
   * @public
   * @param data 网格数据
   */
  setData: (data: IDockGrid) => void;
  /**
   * 更新面板实例的属性
   * @public
   * @param panel 
   */
  updatePanel: (panel: IDockPanel) => void;
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
  addPanel: (panel: IDockPanel, insertTo?: string|DockData) => void;
  /**
   * 向容器内插入面板。同 `addPanel`
   * @public
   * @param panels 面板数组
   * @param insertTo 将面板插入指定名称的网格，为空则插入至顶级网格
   */
  addPanels: (panels: IDockPanel[], insertTo?: string|DockData) => void;
  /**
   * 移除指定的面板
   * @public
   * @param key 面板唯一Key
   */
  removePanel: (key: string) => void;
  /**
   * 移除多个指定的面板
   * @public
   * @param keys 面板唯一Key
   */
  removePanels: (keys: string[]) => void;
  /**
   * 激活指定的面板
   * @public
   * @param key 面板唯一Key
  */
  activePanel: (key: string) => void;

}