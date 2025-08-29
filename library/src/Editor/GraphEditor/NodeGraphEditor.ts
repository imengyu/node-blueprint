import type { NodeEditorMouseControllerContext } from './Editor/EditorMouseHandler';
import type { NodeGraphEditorSelectionContext } from './Editor/EditorSelectionContoller';
import type { NodeGraphEditorConnectorContext } from './Editor/EditorConnectorController';
import type { NodeGraphEditorGraphControllerContext } from './Editor/EditorGraphController';
import type { NodeGraphEditorBasePanelsContext } from './Panel/BasePanels';
import type { NodeEditorKeyBoardControllerContext } from './Editor/EditorKeyBoardController';
import type { NodeEditorUserControllerContext } from './Editor/EditorUserController';
import type { NodeEditorContextMenuContext } from './Editor/EditorContextMenuHandler';
import type { NodeEditorClipBoardControllerContext } from './Editor/EditorClipBoardController';
import type { NodeGraphEditorZoomToolContext } from './SubComponents/ZoomTool';
import type { NodeEditorViewPortControllerContext } from './Editor/EditorViewPortController';
import type { NodeEditorHistoryControllerContext } from './Editor/EditorHistortyController';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
export * from './Editor/Viewport';

/**
 * 公开的上下文函数
 */
export interface NodeGraphEditorContext extends NodeGraphEditorBaseContext, 
  NodeGraphEditorSelectionContext,
  NodeGraphEditorConnectorContext,
  NodeGraphEditorGraphControllerContext,
  NodeGraphEditorBasePanelsContext,
  NodeEditorKeyBoardControllerContext,
  NodeEditorUserControllerContext,
  NodeEditorContextMenuContext,
  NodeEditorMouseControllerContext,
  NodeEditorClipBoardControllerContext,
  NodeGraphEditorZoomToolContext,
  NodeEditorViewPortControllerContext,
  NodeEditorHistoryControllerContext
{
}

/**
 * 基础上下文函数
 */
export interface NodeGraphEditorBaseContext {
  /**
   * 监听指定事件
   * @param name 事件名称
   * @param cb 回调
   */
  listenEvent(name: string, cb: NodeGraphEditorBaseEventCallback) : NodeGraphEditorBaseEventListener;
  /**
   * 发出指定事件
   * @param name 事件名称
   * @param args 事件参数
   */
  emitEvent(name: string, ...args: unknown[]) : void;

  /**
   * 获取编辑器设置
   */
  getSettings(): INodeGraphEditorSettings;
  /**
   * 获取当前打开的图表
   */
  getCurrentGraph(): NodeGraph,
  /**
   * 创建一个由上下文控制的临时变量，防止在编辑器切换后丢失。
   * 当上下文中存在变量时，使用已保存的变量。
   * @param name 名称
   * @param intitalValue 初始值
   */
  holdData<T>(name: string, intitalValue: T) : T;
  /**
   * 取消一个上下文控制的临时变量。
   * @param name 名称
   */
  unHoldData(name: string) : void;
}

export interface INodeGraphEditorSettings {
  drawDebugInfo?: boolean;
  drawGrid?: boolean;
  snapGrid?: boolean;
  snapGridSize?: number;
}

export type NodeGraphEditorBaseEventCallback =  (...args: unknown[]) => void;
export interface NodeGraphEditorBaseEventListener {
  /**
   * 取消监听当前事件
   */
  unListen: () => void;
}

/**
 * 内部上下文函数
 */
export interface NodeGraphEditorInternalContext extends NodeGraphEditorContext {
  internalManager: {
    autoNodeSizeChangeCheckerStartStop(start: boolean) : void;
    mouseEventUpdateMouseInfo: (e: MouseEvent, type: MouseEventUpdateMouseInfoType) => void,
    holdDataMap: Map<string, unknown>
  },
}

// eslint-disable-next-line no-shadow
export enum MouseEventUpdateMouseInfoType {
  Down,
  Move,
  Up,
}