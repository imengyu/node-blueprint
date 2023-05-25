import type { DockData, DockPanel } from "./DockLayoutData";
import type { VNode } from "vue";
import type { IKeyAnyObject } from "./DockUtils";

/**
 * 主容器内部使用的公共接口
 */
export interface DockHostData {
  isDragging: boolean;
  onStartDrag: (item: DockPanel) => void;
  onEndDrag: () => void;
  onGridDrag: (thisGrid : DockData, nextGrid : DockData) => void;
  onGridDropFinish: (grid : DockData) => void;  //拖动完成
  onActiveTabChange: (grid : DockData, lastActive : DockPanel|null, currentActive : DockPanel) => void;
  onClosePanel: (panel: DockPanel) => void;
  renderSlot: (name: string, param: IKeyAnyObject) => VNode[];
  hasSlot: (name: string) => boolean;
  getDockPanel: (key: string) => DockPanel|null;
  clearAllFloatDragLightBox: () => void;
  checkAndRemoveEmptyGrid: (parent: DockData) => void;//移除后，检查整理相关网格
  forceFlushAllPanelPos: (parent: DockData) => void;
  dropCurrentPanel: DockPanel|null;
  dropCurrentRegion: DockData|null,//当前鼠标所在区域的网格信息
  showDropLayout : boolean;
  tabHeight: number;
  theme: 'dark'|'light';
  host: HTMLDivElement|null,
}