import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { ref } from "vue";
import { MouseEventUpdateMouseInfoType, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { isMouseEventInNoDragControl } from "./EditorMouseHandler";
import { createMouseDragHandler } from "./MouseHandler";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";

/**
 * Selection management
 */
export interface NodeGraphEditorSelectionContext {
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
      e.stopPropagation();
      context.mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Move);
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

  /**
   * 取消选中所有连接线
   */
  function unSelectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    ArrayUtils.clear(selectConnectors.value);
    notifySelectConnectorChanged();
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
    notifySelectConnectorChanged();
  }
  /**
   * 取消选中所有单元
   */
  function unSelectAllNodes() {
    selectNodes.value.forEach((b) => {
      b.selected = false;
    });
    ArrayUtils.clear(selectNodes.value);
    notifySelectNodeChanged();
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
      node.selected = true;
    });
    notifySelectNodeChanged();
  }
  /**
   * 取消选中某个单元
   */
  function unSelectNode(n: Node) {
    const node = n as NodeEditor;
    ArrayUtils.remove(selectNodes.value, node);
    node.selected = false;
    notifySelectNodeChanged();
  }
  /**
   * 选中某个单元
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectNode(n: Node, append = false) {
    const node = n as NodeEditor;
    if (append)
      ArrayUtils.addOnce(selectNodes.value, node);
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectNodes.value.push(node);
    }
    node.selected = true;
    notifySelectNodeChanged();
  }
  //选择指定的单元
  function selectSomeNodes(ns: Node[], append = false) {
    const nodes = ns as NodeEditor[];
    if (append) {
      nodes.forEach(node => {
        ArrayUtils.addOnce(selectNodes.value, node);
        node.selected = true;
      });
    }
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      nodes.forEach(node => {
        selectNodes.value.push(node);
        node.selected = true;
      });
    }
    notifySelectNodeChanged();
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
          b.selected = false;
          ArrayUtils.remove(_selectNodes, b);
        } else
          ArrayUtils.remove(thisTimeSelectedNode, b);
      }
      thisTimeSelectedNode.forEach((b) => {
        b.selected = true;
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
          selectConnectors.value.push(connector as NodeConnectorEditor);
        }
      });

      isMultiSelected.value = true;
    } else {
      _selectNodes.forEach((b) => b.selected = false);
      ArrayUtils.clear(_selectNodes);
      isMultiSelected.value = false;
    }

    notifySelectNodeChanged();
  }
  function endSelectNodes() {
    isMulitSelect.value = false;
    multiSelectRect.value.set(0, 0, 0, 0);
    selectNodes.value.forEach((node) => {
      //保存单元位置，以供后续多选移动使用
      node.saveLastBlockPos();
    });
  }

  /**
   * 取消选中某个连接线
   */
  function unSelectConnector(c: NodeConnector) {  
    const connector = c as NodeConnectorEditor;
    ArrayUtils.remove(selectConnectors.value, connector);
    connector.selected = false;

    notifySelectConnectorChanged();
  }
  /**
   * 选中某个连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectConnector(c: NodeConnector, append = false) { 
    const connector = c as NodeConnectorEditor;
    if (append)
      ArrayUtils.addOnce(selectConnectors.value, connector);
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectConnectors.value.push(connector);
    }
    connector.selected = true;
    notifySelectConnectorChanged();
  }

  function notifySelectConnectorChanged() {
    
  }
  function notifySelectNodeChanged() {

  }

  context.unSelectAllNodes = unSelectAllNodes;
  context.unSelectAllConnectors = unSelectAllConnectors;
  context.unSelectConnector = unSelectConnector;
  context.unSelectNode = unSelectNode;
  context.selectNode = selectNode;
  context.selectSomeNodes = selectSomeNodes;
  context.selectAllNodes = selectAllNodes;
  context.selectAllConnectors = selectAllConnectors;
  context.selectConnector = selectConnector;
  context.getSelectNodes = () => selectNodes.value as unknown as Node[];
  context.getSelectNodeCount = () => selectNodes.value.length;
  context.getSelectConnectors = () => selectConnectors.value as NodeConnector[];
  context.isMulitSelect = () => isMulitSelect.value;

  return {
    selectNodes,
    selectConnectors,
    isMulitSelect,
    isMultiSelected,
    multiSelectRect,
  }
}