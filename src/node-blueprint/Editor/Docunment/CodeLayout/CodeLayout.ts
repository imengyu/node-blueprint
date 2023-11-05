import type { VNode } from "vue";

export interface CodeLayoutConfig {
  activityBar: boolean,
  primarySideBar: boolean,
  primarySideBarWidth: number,
  secondarySideBar: boolean,
  secondarySideBarWidth: number,
  bottomPanel: boolean,
  bottomPanelHeight: number,
  bottomAlignment: 'left'|'center'|'right'|'justify',
  statusBar: boolean,
  statusBarHeight: number|string,
}

export type CodeLayoutGrid = 'primarySideBar'|'secondarySideBar'|'activityBar'|'bottomPanel'|'centerArea';

export interface CodeLayoutPanel {
  title: string,
  tooltip?: string,
  name: string,
  accept?: CodeLayoutGrid[],
  open: boolean,
  badge?: string|(() => VNode)|undefined,
  iconLarge?: string|(() => VNode)|undefined,
  iconSmall?: string|(() => VNode)|undefined,
  children?: CodeLayoutPanel[],
  actions?: {
    name: string,
    icon: string|(() => VNode),
    onClick: () => void,
  }[]|undefined,
}