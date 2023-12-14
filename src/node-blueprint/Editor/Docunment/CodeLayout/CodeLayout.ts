import type { VNode } from "vue";

export interface CodeLayoutConfig {
  primarySideBarSwitchWithActivityBar: boolean,
  primarySideBarWidth: number,
  secondarySideBarWidth: number,
  bottomPanelHeight: number,
  bottomAlignment: 'left'|'center'|'right'|'justify',
  statusBarHeight: number|string,
}

export type CodeLayoutGrid = 'primarySideBar'|'secondarySideBar'|'activityBar'|'bottomPanel'|'centerArea'|'none';


export interface CodeLayoutInstance {
  addGroup: (panel: CodeLayoutPanel, target: CodeLayoutGrid) => CodeLayoutPanel;
  removeGroup(panel: CodeLayoutPanel): CodeLayoutPanel;
  activeGroup: (panel: CodeLayoutPanel) => void;
  closePanel: (panel: CodeLayoutPanel) => void;
  togglePanel: (panel: CodeLayoutPanel) => boolean;
  openPanel: (panel: CodeLayoutPanel, closeOthers?: boolean) => void,
  addPanel: (panel: CodeLayoutPanel, parentGroup: CodeLayoutPanel, active?: boolean) => CodeLayoutPanel;
  removePanel: (panel: CodeLayoutPanel) => CodeLayoutPanel;
}

export interface CodeLayoutPanelInternal extends CodeLayoutPanel {
  open: boolean,
  children: CodeLayoutPanelInternal[],
  activePanel: CodeLayoutPanelInternal|null;
  parentGroup: CodeLayoutPanelInternal|null;
  parentGrid: CodeLayoutGrid;
}

export interface CodeLayoutPanel {
  title: string,
  tooltip?: string,
  name: string,
  accept?: CodeLayoutGrid[],
  badge?: string|(() => VNode)|undefined,
  iconLarge?: string|(() => VNode)|undefined,
  iconSmall?: string|(() => VNode)|undefined,
  actions?: {
    name: string,
    icon: string|(() => VNode),
    onClick: () => void,
  }[]|undefined,
}