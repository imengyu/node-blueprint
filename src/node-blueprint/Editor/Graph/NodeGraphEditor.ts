import type { Node } from '@/node-blueprint/Base/Flow/Node/Node';
import type { NodeConnector } from '@/node-blueprint/Base/Flow/Node/NodeConnector';
import type { ChunkedPanel } from './Cast/ChunkedPanel';
import type { NodeGraphEditorMouseInfo } from './Editor/EditorMouseHandler';
import type { IMouseDragHandlerEntry } from './Editor/MouseHandler';
import type { NodeGraphEditorViewport } from './Editor/Viewport';

export * from './Editor/Viewport';

export interface NodeGraphEditorContext {
  /**
   * 获取节点
   */
  getNodes(): Map<string, Node>;
  /**
   * 获取当前视口
   */
  getViewPort() : NodeGraphEditorViewport;
  /**
   * 获取 ChunkedPanel
   */
  getBaseChunkedPanel(): ChunkedPanel;

  //Selection management
  //==================================

  /**
   * 获取所有选中的节点
   * @returns 
   */
  getSelectNodes: () => Node[];
  /**
   * 获取选中的节点数量
   * @returns 
   */
  getSelectNodeCount: () => number;
  /**
   * 获取选中的连接线
   * @returns 
   */
  getSelectConnectors: () => NodeConnector[];

  /**
   * 选中当前编辑器中所有的节点
   * @returns 
   */
  selectAllNodes: () => void;
  /**
   * 选中当前编辑器中所有的连接线
   * @returns 
   */
  selectAllConnectors: () => void;
  /**
   * 取消选中所有的节点
   * @returns 
   */
  unSelectAllNodes: () => void;
  /**
   * 取消选中所有的节点连接线
   * @returns 
   */
  unSelectAllConnectors: () => void;
  /**
   * 选中一个或者多个节点
   * @param nodes 
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  selectSomeNodes(nodes: Node[], append?: boolean): void;
  /**
   * 取消选中某个连接线
   * @param connector 
   */
  unSelectConnector(connector: NodeConnector): void;
  /**
   * 取消选中某个节点
   */
  unSelectNode(node: Node): void;
  /**
   * 选中某个节点
   * @param node 节点
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  selectNode(node: Node, append?: boolean): void;
  /**
   * 选中某个连接线
   * @param connector 连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  selectConnector(connector: NodeConnector, append?: boolean): void;

  /**
   * 获取当前用户是否正在多选操作
   * @returns 
   */
  isMulitSelect: () => boolean;
}
export interface NodeGraphEditorInternalContext extends NodeGraphEditorContext {
  getMouseInfo: () => NodeGraphEditorMouseInfo,
  getMouseDownHandlers: () => IMouseDragHandlerEntry[],
}