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

export interface CodeLayoutPanel {
  title: string,
  tooltip?: string,
  name: string,
  badge?: string|(() => VNode)|undefined,
  accept?: CodeLayoutGrid[],
  accsizeept?: CodeLayoutGrid[],
  /**
   * Set group tab style
   * * none: no tab, use in primary side area
   * * text: tab header only show text
   * * icon: tab header only show icon
   * 
   * Default: 'none'
   */
  tabStyle?: 'none'|'single'|'text'|'icon',
  size?: number|undefined,
  minSize?: number|undefined,
  startOpen?: boolean|undefined,
  iconLarge?: string|(() => VNode)|undefined,
  iconSmall?: string|(() => VNode)|undefined,
  actions?: CodeLayoutActionButton[]|undefined,
}

export interface CodeLayoutGroupInstance {
  notifyRelayout: () => void,
}
export interface CodeLayoutContext {
  addGroup: (instance: CodeLayoutGroupInstance) => void,
  removeGroup: (instance: CodeLayoutGroupInstance) => void,
}

export interface CodeLayoutActionButton {
  name: string,
  icon: string|(() => VNode),
  onClick: () => void,
}