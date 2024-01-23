import type { VNode } from "vue";
import { LateClass } from "./Composeable/LateClass";

//布局类型定义
export interface CodeLayoutConfig {
  primarySideBarSwitchWithActivityBar: boolean,
  primarySideBarWidth: number,
  primarySideBarMinWidth: number,
  secondarySideBarWidth: number,
  secondarySideBarMinWidth: number,
  bottomPanelHeight: number,
  bottomPanelMinHeight: number,
  bottomAlignment: 'left'|'center'|'right'|'justify',
  statusBarHeight: number|string,
  panelHeaderHeight: number,
  panelMinHeight: number,

  onGridFirstDrop?: (grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) => CodeLayoutPanelInternal;
  onGridEmpty?: (grid: CodeLayoutGrid) => void;
  onNoAutoShinkTabGroup?: (group: CodeLayoutPanelInternal) => void,
  onNoAutoShinkNormalGroup?: (group: CodeLayoutPanelInternal) => void,
}

//

export type CodeLayoutGrid = 'primarySideBar'|'secondarySideBar'|'bottomPanel'|'centerArea'|'none';

export interface CodeLayoutInstance {
  getPanelByName(name: string): CodeLayoutPanelInternal | undefined,
  addGroup: (panel: CodeLayoutPanel, target: CodeLayoutGrid) => CodeLayoutPanel;
  removeGroup(panel: CodeLayoutPanel): CodeLayoutPanel;
  activeGroup: (panel: CodeLayoutPanel) => void;
  closePanel: (panel: CodeLayoutPanel) => void;
  togglePanel: (panel: CodeLayoutPanel) => boolean;
  openPanel: (panel: CodeLayoutPanel, closeOthers?: boolean) => void,
  addPanel: (panel: CodeLayoutPanel, parentGroup: CodeLayoutPanel, active?: boolean) => CodeLayoutPanel;
  removePanel: (panel: CodeLayoutPanel) => CodeLayoutPanel;
  relayoutAll: () => void;
  relayoutGroup(name: string): void;
}
export interface CodeLayoutPanelParent {
  children : CodeLayoutPanelInternal[];
  activePanel : CodeLayoutPanelInternal|null;

  addChild(child: CodeLayoutPanelInternal, index?: number) : void;
  addChilds(childs: CodeLayoutPanelInternal[], startIndex?: number) : void;
  removeChild(child: CodeLayoutPanelInternal) : void;
  hasChild(child: CodeLayoutPanelInternal) : boolean;
  replaceChild(oldChild: CodeLayoutPanelInternal, child: CodeLayoutPanelInternal): void;
}

//内部类定义

export class CodeLayoutPanelInternal extends LateClass implements CodeLayoutPanel, CodeLayoutPanelParent {

  public constructor(getGrid: (name: CodeLayoutGrid) => CodeLayoutGridInternal) {
    super();
    this.callbackGetGrid = getGrid;
  }

  private callbackGetGrid: (name: CodeLayoutGrid) => CodeLayoutGridInternal;

  title = '';
  name = '';
  open = false;
  resizeable = false;
  size = 0;
  children : CodeLayoutPanelInternal[] = [];
  activePanel: CodeLayoutPanelInternal|null = null;
  parentGroup: CodeLayoutPanelInternal|null = null;
  parentGrid: CodeLayoutGrid = 'none';

  tooltip?: string;
  badge?: string|(() => VNode)|undefined;
  accept?: CodeLayoutGrid[];
  preDropCheck?: (
    dropPanel: CodeLayoutPanel, 
    targetGrid: CodeLayoutGrid,
    referencePanel?: CodeLayoutPanel|undefined,
    referencePosition?: CodeLayoutDragDropReferencePosition|undefined,
  ) => boolean;
  tabStyle?: CodeLayoutPanelTabStyle;
  noAutoShink = false;
  minSize?: number|undefined;
  startOpen?: boolean|undefined;
  iconLarge?: string|(() => VNode)|undefined;
  iconSmall?: string|(() => VNode)|undefined;
  actions?: CodeLayoutActionButton[]|undefined;

  addChild(child: CodeLayoutPanelInternal, index?: number) {
    if (this.name === child.name)
      throw new Error('Try add self');
    if (typeof index === 'number')
      this.children.splice(index, 0, child);
    else
      this.children.push(child);
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  addChilds(childs: CodeLayoutPanelInternal[], startIndex?: number) {
    if (typeof startIndex === 'number')
      this.children.splice(startIndex, 0, ...childs);
    else
      this.children.push(...childs);
    for (const child of childs) {
      if (this.name === child.name)
        throw new Error('Try add self');
      child.parentGroup = this;
      child.parentGrid = this.parentGrid;
    }
  }
  removeChild(child: CodeLayoutPanelInternal) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentGroup = null;
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (child.name === this.activePanel?.name)
      this.activePanel = this.children[0] || null;
  }
  replaceChild(oldChild: CodeLayoutPanelInternal, child: CodeLayoutPanelInternal) {
    this.children.splice(
      this.children.indexOf(oldChild), 
      1, 
      child);   
    oldChild.parentGroup = null;
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (this.activePanel?.name === oldChild.name)
      this.activePanel = child;
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  hasChild(child: CodeLayoutPanelInternal) {
    return this.children.includes(child);
  }

  lastRelayoutSize = 0;
  lastLayoutSizeCounter = 0;

  getIsTabContainer() {
    return this.tabStyle === 'text' || this.tabStyle === 'icon';
  }
  getIsTopGroup() {
    return !this.parentGroup
  }
  getIsInTab() {
    return this.parentGroup?.getIsTabContainer() ?? false;
  }
  getParentGrid() {
    if (this.parentGrid !== 'none')
      return this.callbackGetGrid(this.parentGrid);
    return null;
  }
  getParent() : CodeLayoutPanelParent|null {
    return this.parentGroup as CodeLayoutPanelParent ?? this.getParentGrid();
  }
  getIndexInParent() {
    if (this.parentGroup)
      return this.parentGroup.children.indexOf(this) ?? 0;
    return this.getParentGrid()?.children.indexOf(this) ?? 0;
  }
  getLastChildOrSelf() {
    return this.children.length > 0 ? 
      this.children[this.children.length - 1] 
      : this;
  }
  getFlatternChildOrSelf() {
    return this.children.length > 0 ? this.children : [ this ];
  }

  getContainerSize() {
    return this.lastRelayoutSize;
  }
  notifyRelayout() {
    this.pushLateAction('notifyRelayout');
  }
  relayoutAllWithNewPanel(panels: CodeLayoutPanelInternal[]) {
    this.pushLateAction('relayoutAllWithNewPanel', panels);
  }
  relayoutAllWithRemovePanel(panel: CodeLayoutPanelInternal) {
    this.pushLateAction('relayoutAllWithRemovePanel', panel);
  }
  relayoutAllWithResizedSize(resizedContainerSize: number) {
    this.pushLateAction('relayoutAllWithResizedSize', resizedContainerSize);
  }


}
export class CodeLayoutGridInternal implements CodeLayoutPanelParent {

  public constructor(
    name: CodeLayoutGrid,
    onSwitchCollapse: (open: boolean) => void
  ) {
    this.name = name;
    this.onSwitchCollapse = onSwitchCollapse;
  }

  private onSwitchCollapse: (open: boolean) => void;

  name: CodeLayoutGrid;
  children : CodeLayoutPanelInternal[] = [];
  activePanel : CodeLayoutPanelInternal|null = null;

  addChild(child: CodeLayoutPanelInternal, index?: number) {
    if (typeof index === 'number')
      this.children.splice(index, 0, child);
    else
      this.children.push(child);
    child.parentGrid = this.name;
  }
  addChilds(childs: CodeLayoutPanelInternal[], startIndex?: number) {
    if (typeof startIndex === 'number')
      this.children.splice(startIndex, 0, ...childs);
    else
      this.children.push(...childs);
    for (const child of childs) 
      child.parentGrid = this.name;
  }
  removeChild(child: CodeLayoutPanelInternal) {
    if (this.hasChild(child))
      this.children.splice(this.children.indexOf(child), 1);
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (child.name === this.activePanel?.name)
      this.activePanel = this.children[0] ?? null;
  }
  hasChild(child: CodeLayoutPanelInternal) {
    return this.children.includes(child);
  }
  replaceChild(oldChild: CodeLayoutPanelInternal, child: CodeLayoutPanelInternal) {
    this.children.splice(
      this.children.indexOf(oldChild), 
      1, 
      child);
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (this.activePanel?.name === oldChild.name)
      this.activePanel = child;
  }
  collapse() {
    this.onSwitchCollapse(false);
  }
  open() {
    this.onSwitchCollapse(true);
  }
}

export type CodeLayoutPanelTabStyle = 'none'|'single'|'text'|'icon';

//面板用户类型定义
export interface CodeLayoutPanel {
  title: string;
  tooltip?: string;
  name: string;
  badge?: string|(() => VNode)|undefined;
  accept?: CodeLayoutGrid[];

  /**
   * Custom check callback before this panel drop.
   * @param dropPanel The panel being prepared for drop.
   * @param targetGrid Target grid.
   * @param referencePanel Drop reference panel.
   * @param referencePosition Place position relative to the reference panel.
   * @returns Return true to allow user drop, false to reject.
   */
  preDropCheck?: (
    dropPanel: CodeLayoutPanel, 
    targetGrid: CodeLayoutGrid,
    referencePanel?: CodeLayoutPanel|undefined,
    referencePosition?: CodeLayoutDragDropReferencePosition|undefined,
  ) => boolean;

  /**
   * Set group tab style
   * * none: no tab, use in primary side area
   * * text: tab header only show text
   * * icon: tab header only show icon
   * 
   * Default: 'none'
   */
  tabStyle?: CodeLayoutPanelTabStyle;
  /**
   * Default: false
   */
  noAutoShink?: boolean;
  size?: number|undefined;
  minSize?: number|undefined;
  startOpen?: boolean|undefined;
  iconLarge?: string|(() => VNode)|undefined;
  iconSmall?: string|(() => VNode)|undefined;
  actions?: CodeLayoutActionButton[]|undefined;
}

//运行时类型定义
export type CodeLayoutDragDropReferencePosition = ''|'drag-over-prev'|'drag-over-next';

export interface CodeLayoutContext {
  dragDropToGrid: (grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) => void,
  dragDropToPanelNear: (
    reference: CodeLayoutPanelInternal, 
    referencePosition: CodeLayoutDragDropReferencePosition, 
    panel: CodeLayoutPanelInternal, 
    dropTo: 'normal'|'empty'|'tab-header'|'activiy-bar',
  ) => void,
  instance: CodeLayoutInstance;
}

export interface CodeLayoutActionButton {
  name: string,
  icon: string|(() => VNode),
  onClick: () => void,
}