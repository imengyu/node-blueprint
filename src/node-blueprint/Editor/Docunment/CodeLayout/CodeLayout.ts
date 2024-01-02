import type { VNode } from "vue";

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

export interface CodeLayoutPanelInternal extends CodeLayoutPanel {
  open: boolean,
  resizeable: boolean,
  size: number,
  children: CodeLayoutPanelInternal[],
  activePanel: CodeLayoutPanelInternal|null;
  parentGroup: CodeLayoutPanelInternal|null;
  parentGrid: CodeLayoutGrid;
}

export type CodeLayoutPanelTabStyle = 'none'|'single'|'text'|'icon';

export interface CodeLayoutPanel {
  title: string,
  tooltip?: string,
  name: string,
  badge?: string|(() => VNode)|undefined,
  accept?: CodeLayoutGrid[],

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
  ) => boolean,

  /**
   * Set group tab style
   * * none: no tab, use in primary side area
   * * text: tab header only show text
   * * icon: tab header only show icon
   * 
   * Default: 'none'
   */
  tabStyle?: CodeLayoutPanelTabStyle,
  /**
   * Default: false
   */
  noAutoShink?: boolean;
  size?: number|undefined,
  minSize?: number|undefined,
  startOpen?: boolean|undefined,
  iconLarge?: string|(() => VNode)|undefined,
  iconSmall?: string|(() => VNode)|undefined,
  actions?: CodeLayoutActionButton[]|undefined,
}

export interface CodeLayoutGroupInstance {
  name: string,
  notifyRelayout: () => void,
}

export type CodeLayoutDragDropReferencePosition = ''|'drag-over-prev'|'drag-over-next';

export interface CodeLayoutContext {
  addGroup: (instance: CodeLayoutGroupInstance) => void,
  removeGroup: (instance: CodeLayoutGroupInstance) => void,
  dragDropToGrid: (grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) => void,
  dragDropToGroup: (group: CodeLayoutPanelInternal, panel: CodeLayoutPanelInternal) => void,
  dragDropToPanelNear: (reference: CodeLayoutPanelInternal, referencePosition: CodeLayoutDragDropReferencePosition, panel: CodeLayoutPanelInternal) => void,
  instance: CodeLayoutInstance;
}

export interface CodeLayoutActionButton {
  name: string,
  icon: string|(() => VNode),
  onClick: () => void,
}