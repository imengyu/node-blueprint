import type { ChunkedPanel } from './Cast/ChunkedPanel';
import type { EditorMousHandlerExtendHandlers, NodeGraphEditorMouseInfo } from './Editor/EditorMouseHandler';
import type { NodeGraphEditorViewport } from './Editor/Viewport';
import type { NodeGraphEditorSelectionContext } from './Editor/EditorSelectionContoller';
import type { NodeGraphEditorConnectorContext } from './Editor/EditorConnectorController';
import type { NodeGraphEditorGraphControllerContext } from './Editor/EditorGraphController';
export * from './Editor/Viewport';

/**
 * 公开的上下文函数
 */
export interface NodeGraphEditorContext extends NodeGraphEditorBaseContext, 
  NodeGraphEditorSelectionContext,
  NodeGraphEditorConnectorContext,
  NodeGraphEditorGraphControllerContext {
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
  getMouseInfo: () => NodeGraphEditorMouseInfo,
  getMouseHandler: () => EditorMousHandlerExtendHandlers,
}

export enum MouseEventUpdateMouseInfoType {
  Down,
  Move,
  Up,
}