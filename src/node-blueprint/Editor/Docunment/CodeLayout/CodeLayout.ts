import type { VNode } from "vue";
import { LateClass } from "./Composeable/LateClass";

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
  onNoAutoShinkGroupEmpty?: (group: CodeLayoutPanelInternal) => void,
}

export type CodeLayoutGrid = 'primarySideBar'|'secondarySideBar'|'activityBar'|'bottomPanel'|'centerArea'|'none';


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

export class CodeLayoutPanelInternal extends LateClass implements CodeLayoutPanel {
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
  removeChild(child: CodeLayoutPanelInternal) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentGroup = null;
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (child === this.activePanel)
      this.activePanel = null;
  }
  replaceChild(oldChild: CodeLayoutPanelInternal, child: CodeLayoutPanelInternal) {
    this.children.splice(
      this.children.indexOf(oldChild), 
      1, 
      child);   
    oldChild.parentGroup = null;
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (this.activePanel === oldChild)
      this.activePanel = child;
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }

  getIsTabContainer() {
    return this.tabStyle === 'text' || this.tabStyle === 'icon';
  }
  getIsTopGroup() {
    return !this.parentGroup
  }

  getContainerSize() {
    return this.pushLateAction('getContainerSize') as Promise<number>;
  }
  notifyRelayout() {
    this.pushLateAction('notifyRelayout');
  }
  relayoutAllWithNewPanel(panel: CodeLayoutPanelInternal) {
    this.pushLateAction('relayoutAllWithNewPanel', panel);
  }
  relayoutAllWithRemovePanel(panel: CodeLayoutPanelInternal) {
    this.pushLateAction('relayoutAllWithRemovePanel', panel);
  }
  relayoutAllWithResizedSize(resizedContainerSize: number) {
    this.pushLateAction('relayoutAllWithResizedSize', resizedContainerSize);
  }
}
export class CodeLayoutGridInternal {
  children : CodeLayoutPanelInternal[] = [];
  
  addChild(child: CodeLayoutPanelInternal, index?: number) {
    if (typeof index === 'number')
      this.children.splice(index, 0, child);
    else
      this.children.push(child);
  }
  removeChild(child: CodeLayoutPanelInternal) {
    if (this.hasChild(child))
      this.children.splice(this.children.indexOf(child), 1);
  }
  hasChild(child: CodeLayoutPanelInternal) {
    return this.children.includes(child);
  }
  replaceChild(oldChild: CodeLayoutPanelInternal, child: CodeLayoutPanelInternal) {
    this.children.splice(
      this.children.indexOf(oldChild), 
      1, 
      child);
  }
}

export type CodeLayoutPanelTabStyle = 'none'|'single'|'text'|'icon';

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

export type CodeLayoutDragDropReferencePosition = ''|'drag-over-prev'|'drag-over-next';

export interface CodeLayoutContext {
  dragDropToGrid: (grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) => void,
  dragDropToPanelNear: (reference: CodeLayoutPanelInternal, referencePosition: CodeLayoutDragDropReferencePosition, panel: CodeLayoutPanelInternal, dropToTabHeader: boolean) => void,
  instance: CodeLayoutInstance;
}

export interface CodeLayoutActionButton {
  name: string,
  icon: string|(() => VNode),
  onClick: () => void,
}