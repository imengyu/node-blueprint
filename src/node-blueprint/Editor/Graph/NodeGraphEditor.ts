import type { ChunkedPanel } from './Cast/ChunkedPanel';
import type { NodeEditorMouseControllerContext } from './Editor/EditorMouseHandler';
import type { NodeGraphEditorViewport } from './Editor/Viewport';
import type { NodeGraphEditorSelectionContext } from './Editor/EditorSelectionContoller';
import type { NodeGraphEditorConnectorContext } from './Editor/EditorConnectorController';
import type { NodeGraphEditorGraphControllerContext } from './Editor/EditorGraphController';
import type { NodeGraphEditorBasePanelsContext } from './Panel/BasePanels';
import type { NodeEditorKeyBoardControllerContext } from './Editor/EditorKeyBoardController';
import type { NodeEditorUserControllerContext } from './Editor/EditorUserController';
import type { NodeEditorContextMenuContext } from './Editor/EditorContextMenuHandler';
import type { NodeEditorClipBoardControllerContext } from './Editor/EditorClipBoardController';
import type { NodeGraphEditorZoomToolContext } from './SubComponents/ZoomTool';
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
  NodeGraphEditorZoomToolContext
{
}

/**
 * 基础上下文函数
 */
export interface NodeGraphEditorBaseContext {
  /**
   * 获取当前视口
   */
  getViewPort() : NodeGraphEditorViewport;
  /**
   * 获取 ChunkedPanel
   */
  getBaseChunkedPanel(): ChunkedPanel;
}
/**
 * 内部上下文函数
 */
export interface NodeGraphEditorInternalContext extends NodeGraphEditorContext {
  mouseEventUpdateMouseInfo: (e: MouseEvent, type: MouseEventUpdateMouseInfoType) => void,
}

// eslint-disable-next-line no-shadow
export enum MouseEventUpdateMouseInfoType {
  Down,
  Move,
  Up,
}