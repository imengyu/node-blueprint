import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { ref } from "vue";
import { MouseEventUpdateMouseInfoType, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { isMouseEventInNoDragControl } from "./EditorMouseHandler";
import { createMouseDragHandler } from "./MouseHandler";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";

/**
 * Selection management
 */
export interface NodeGraphEditorSelectionContext {
  /**
   * 获取所有选中的节点
   * @returns 
   */
  getSelectNodes: () => NodeEditor[];
  /**
   * 获取选中的节点数量
   * @returns 
   */
  getSelectNodeCount: () => number;
  /**
   * 获取选中的连接线
   * @returns 
   */
  getSelectConnectors: () => NodeConnectorEditor[];

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
  selectSomeNodes(nodes: NodeEditor[], append?: boolean): void;
  /**
   * 取消选中某个连接线
   * @param connector 
   */
  unSelectConnector(connector: NodeConnectorEditor): void;
  /**
   * 取消选中某个节点
   */
  unSelectNode(node: NodeEditor): void;
  /**
   * 选中某个节点
   * @param node 节点
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  selectNode(node: NodeEditor, append?: boolean): void;
  /**
   * 选中某个连接线
   * @param connector 连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  selectConnector(connector: NodeConnectorEditor, append?: boolean): void;

  /**
   * 获取当前用户是否正在多选操作
   * @returns 
   */
  isMulitSelect: () => boolean;

  /**
   * 获取最低矩形内的单元
   * @param rect 视口坐标
   */
  getNodesInRect(rect: Rect) : NodeEditor[];
}

/**
 * 选择控制器
 * @param viewPort 
 * @param mouseInfo 
 * @param mouseDownHandlers 
 * @returns 
 */
export function useEditorSelectionContoller(context: NodeGraphEditorInternalContext) {

  const selectNodes = ref(new Array<NodeEditor>());
  const selectConnectors = ref(new Array<NodeConnectorEditor>());
  const isMulitSelect = ref(false);
  const isMultiSelected = ref(false);
  const multiSelectRect = ref(new Rect());

  const mouseInfo = context.getMouseInfo();
  const viewPort = context.getViewPort();
  const mouseHandlers = context.getMouseHandler();

  //多选处理
  const selectDragDownPos = new Vector2();
  const selectDragHandler = createMouseDragHandler({
    onDown(e) {
      if (isMouseEventInNoDragControl(e))
        return false;
      if (context.isAnyConnectorHover())
        return false;
      if (e.button !== 0)
        return false;
      e.stopPropagation();
      context.mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Down);
      isMulitSelect.value = true;
      selectDragDownPos.set(viewPort.position);
      return true;
    },
    onMove(_, m, e) {
      e.preventDefault();
      e.stopPropagation();
      context.mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Move);
      context.moveViewportWithCursorPosition(mouseInfo.mouseCurrentPosEditor);
      doSelectNodes();
    },
    onUp(e) {
      isMulitSelect.value = false;
      context.mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Up);
      if (mouseInfo.mouseMoved)
        endSelectNodes();
      else
        unSelectAllNodes();
    },
  });

  mouseHandlers.pushMouseDownHandler(selectDragHandler);
  mouseHandlers.pushMouseUpHandlers((_mouseInfo) => {
    if (!_mouseInfo.mouseMoved) {
      if (context.isAnyConnectorHover())
        context.selectHoverConnectors();
      else
        context.unSelectAllConnectors();
    }
    return false;
  });

  /**
   * 取消选中所有连接线
   */
  function unSelectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    ArrayUtils.clear(selectConnectors.value);
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 选中所有连接线
   */
  function selectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    ArrayUtils.clear(selectConnectors.value);
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 取消选中所有单元
   */
  function unSelectAllNodes() {
    selectNodes.value.forEach((b) => doSelectNode(b as NodeEditor, false));
    ArrayUtils.clear(selectNodes.value);
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 选中当前编辑器中所有单元
   */
  function selectAllNodes() {
    const _selectNodes = selectNodes.value;
    ArrayUtils.clear(_selectNodes);
    context.getNodes().forEach((b) => {
      const node = b as NodeEditor;
      _selectNodes.push(node);
      doSelectNode(node, true);
    });
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 取消选中某个单元
   */
  function unSelectNode(node: NodeEditor) {
    ArrayUtils.remove(selectNodes.value, node);
    doSelectNode(node, false);
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 选中某个单元
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectNode(node: NodeEditor, append = false) {
    if (append) {
      if (selectNodes.value.includes(node)) {
        ArrayUtils.remove(selectNodes.value, node);
        doSelectNode(node, false);
      }
      else {
        selectNodes.value.push(node);
        doSelectNode(node, true);
      }
    }
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectNodes.value.push(node);
      doSelectNode(node,  true);
    }
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 选择指定的单元
   * @param nodes 
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectSomeNodes(nodes: NodeEditor[], append = false) {
    if (append) {
      nodes.forEach(node => {
        ArrayUtils.addOnce(selectNodes.value, node);
        doSelectNode(node, true);
      });
    }
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      nodes.forEach(node => {
        selectNodes.value.push(node);
        doSelectNode(node, true);
      });
    }
    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 获取最低矩形内的单元
   * @param rect 视口坐标
   */
  function getNodesInRect(rect: Rect) : NodeEditor[] {
    const castNodes = context.getBaseChunkedPanel().testRectCastTag(rect as Rect, "node");
    const thisTimeSelectedNode = new Array<NodeEditor>();
    castNodes.forEach((i) => {
      const block = context.getNodes().get(i.data as string);
      if (block) 
        ArrayUtils.addOnce(thisTimeSelectedNode, block);
    });
    return thisTimeSelectedNode;
  }

  function doSelectNode(node: NodeEditor, select: boolean) {
    node.selected = select;
    node.events.onEditorEvent?.(node, context, select ? 'select' : 'unselect');
  }

  //多选选择
  function doSelectNodes() {
    const _multiSelectRect = multiSelectRect.value;
    const _selectNodes = selectNodes.value;

    /**
     * 多选框的方向处理
     * 保证用户无论向哪个方向选择，都可以统一数据
     */
    if (mouseInfo.mouseCurrentPosViewPort.x > mouseInfo.mouseDownPosViewPort.x) {
      _multiSelectRect.x = mouseInfo.mouseDownPosViewPort.x;
      _multiSelectRect.w = mouseInfo.mouseCurrentPosViewPort.x - mouseInfo.mouseDownPosViewPort.x;
    } else {
      _multiSelectRect.x = mouseInfo.mouseCurrentPosViewPort.x;
      _multiSelectRect.w = mouseInfo.mouseDownPosViewPort.x - mouseInfo.mouseCurrentPosViewPort.x;
    }
    if (mouseInfo.mouseCurrentPosViewPort.y > mouseInfo.mouseDownPosViewPort.y) {
      _multiSelectRect.y = mouseInfo.mouseDownPosViewPort.y;
      _multiSelectRect.h = mouseInfo.mouseCurrentPosViewPort.y - mouseInfo.mouseDownPosViewPort.y;
    } else {
      _multiSelectRect.y = mouseInfo.mouseCurrentPosViewPort.y;
      _multiSelectRect.h = mouseInfo.mouseDownPosViewPort.y - mouseInfo.mouseCurrentPosViewPort.y;
    }
    //多选单元和连接
    if (_multiSelectRect.w > 0 && _multiSelectRect.h > 0) {

      /**
       * 选择单元
       */
      const castNodes = context.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "node");
      const thisTimeSelectedNode = new Array<NodeEditor>();
      castNodes.forEach((i) => {
        const block = context.getNodes().get(i.data as string);
        if (block) 
          ArrayUtils.addOnce(thisTimeSelectedNode, block);
      });
      for (let i = _selectNodes.length - 1; i >= 0; i--) {
        const b = _selectNodes[i] as NodeEditor;
        if (!ArrayUtils.contains(thisTimeSelectedNode, b)) {
          doSelectNode(b, false);
          ArrayUtils.remove(_selectNodes, b);
        } else
          ArrayUtils.remove(thisTimeSelectedNode, b);
      }
      thisTimeSelectedNode.forEach((b) => {
        doSelectNode(b, true);
        ArrayUtils.addOnce(_selectNodes, b);
      });

      /**
       * 选择连接线
       */
      selectConnectors.value.forEach((c) => {
        c.hover = false;
        c.selected = false;
      });
      ArrayUtils.clear(selectConnectors.value);
      context.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "connector").forEach((i) => {
        const connector = context.getConnectors().get(i.data as string);
        if (connector) {
          (connector as NodeConnectorEditor).selected = true;
          ArrayUtils.addOnce(selectConnectors.value, connector as NodeConnectorEditor);
        }
      });

      isMultiSelected.value = true;
    } else {
      _selectNodes.forEach((b) => b.selected = false);
      ArrayUtils.clear(_selectNodes);
      isMultiSelected.value = false;
    }

    notifySelectNodeOrConnectorChanged();
  }
  function endSelectNodes() {
    isMulitSelect.value = false;
    multiSelectRect.value.set(0, 0, 0, 0);
    selectNodes.value.forEach((node) => {
      //保存单元位置，以供后续多选移动使用
      node.saveLastNodePos();
    });
  }

  /**
   * 取消选中某个连接线
   */
  function unSelectConnector(connector: NodeConnectorEditor) {  
    ArrayUtils.remove(selectConnectors.value, connector);
    connector.selected = false;

    notifySelectNodeOrConnectorChanged();
  }
  /**
   * 选中某个连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectConnector(connector: NodeConnectorEditor, append = false) { 
    if (append)
      ArrayUtils.addOnce(selectConnectors.value, connector);
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectConnectors.value.push(connector);
    }
    connector.selected = true;
    notifySelectNodeOrConnectorChanged();
  }

  function notifySelectNodeOrConnectorChanged() {
    context.emitEvent('selectNodeOrConnectorChanged');
  }

  context.getNodesInRect = getNodesInRect;
  context.unSelectAllNodes = unSelectAllNodes;
  context.unSelectAllConnectors = unSelectAllConnectors;
  context.unSelectConnector = unSelectConnector;
  context.unSelectNode = unSelectNode;
  context.selectNode = selectNode;
  context.selectSomeNodes = selectSomeNodes;
  context.selectAllNodes = selectAllNodes;
  context.selectAllConnectors = selectAllConnectors;
  context.selectConnector = selectConnector;
  context.getSelectNodes = () => selectNodes.value as unknown as NodeEditor[];
  context.getSelectNodeCount = () => selectNodes.value.length;
  context.getSelectConnectors = () => selectConnectors.value as NodeConnectorEditor[];
  context.isMulitSelect = () => isMulitSelect.value;

  return {
    selectNodes,
    selectConnectors,
    isMulitSelect,
    isMultiSelected,
    multiSelectRect,
  }
}