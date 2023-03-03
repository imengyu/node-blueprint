import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { ref, type Ref } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { isMouseEventInNoDragControl, NodeGraphEditorMouseInfo } from "./EditorMouseHandler";
import { createMouseDragHandler, type IMouseDragHandlerEntry } from "./MouseHandler";
import type { NodeGraphEditorViewport } from "./Viewport";

/**
 * 选择控制器
 * @param viewPort 
 * @param mouseInfo 
 * @param mouseDownHandlers 
 * @returns 
 */
export function useEditorSelectionContoller(context: NodeGraphEditorInternalContext) {

  const selectNodes = ref(new Array<Node>());
  const selectConnectors = ref(new Array<NodeConnector>());
  const isMulitSelect = ref(false);
  const isMultiSelected = ref(false);
  const multiSelectRect = ref(new Rect());

  const mouseInfo = context.getMouseInfo();
  const viewPort = context.getViewPort();
  const mouseDownHandlers = context.getMouseDownHandlers();

  //多选处理
  const selectDragDownPos = new Vector2();
  const selectDragHandler = createMouseDragHandler({
    onDown(e) {
      if (isMouseEventInNoDragControl(e))
        return false;
      if (e.button !== 0)
        return false;
      e.stopPropagation();
      mouseInfo.mouseDowned = true;
      mouseInfo.mouseMoved = false;
      isMulitSelect.value = true;
      selectDragDownPos.set(viewPort.position);
      return true;
    },
    onMove(_, m, e) {
      e.stopPropagation();
      mouseInfo.mouseMoved = true;


    },
    onUp() {
      isMulitSelect.value = false;
      mouseInfo.mouseDowned = false;
    },
  });

  mouseDownHandlers.push(selectDragHandler);

  /**
   * 取消选中所有连接线
   */
  function unSelectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      //TODO: b.selected = false;
      //b.hover = false;
    });
    ArrayUtils.clear(selectConnectors.value);
    notifySelectConnectorChanged();
  }
  /**
   * 选中所有连接线
   */
  function selectAllConnectors() {
    selectConnectors.value.forEach((b) => {
      //TODO: b.selected = false;
      //b.hover = false;
    });
    ArrayUtils.clear(selectConnectors.value);
    notifySelectConnectorChanged();
  }
  /**
   * 取消选中所有单元
   */
  function unSelectAllNodes() {
    selectNodes.value.forEach((b) => {
      b.editorState.selected = false;
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
      _selectNodes.push(b);
      b.editorState.selected = true;
    });
    notifySelectNodeChanged();
  }
  /**
   * 取消选中某个单元
   */
  function unSelectNode(node: Node) {
    ArrayUtils.remove(selectNodes.value, node);
    node.editorState.selected = false;
    notifySelectNodeChanged();
  }
  /**
   * 选中某个单元
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectNode(node: Node, append = false) {
    if (append)
      ArrayUtils.addOnce(selectNodes.value, node);
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectNodes.value.push(node);
    }
    node.editorState.selected = true;
    notifySelectNodeChanged();
  }
  //选择指定的单元
  function selectSomeNodes(nodes: Node[], append = false) {
    if (append) {
      nodes.forEach(node => {
        ArrayUtils.addOnce(selectNodes.value, node);
        node.editorState.selected = true;
      });
    }
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      nodes.forEach(node => {
        selectNodes.value.push(node);
        node.editorState.selected = true;
      });
    }
    notifySelectNodeChanged();
  }

  //多选选择
  function doSelectNodes() {
    const _multiSelectRect = multiSelectRect.value;
    const _selectNodes = selectNodes.value;

    //多选框的方向处理
    {
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
    }
    //多选单元和连接
    if (_multiSelectRect.w > 0 && _multiSelectRect.h > 0) {

      //选择单元
      const castNodes = context.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "block");
      const thisTimeSelectedNode = new Array<Node>();
      castNodes.forEach((i) => {
        const block = context.getNodes().get(i.data as string);
        if (block) 
          ArrayUtils.addOnce(thisTimeSelectedNode, block);
      });
      for (let i = _selectNodes.length - 1; i >= 0; i--) {
        const b = _selectNodes[i] as Node;
        if (!ArrayUtils.contains(thisTimeSelectedNode, b)) {
          b.editorState.selected = false;
          ArrayUtils.remove(_selectNodes, b);
        } else
          ArrayUtils.remove(thisTimeSelectedNode, b);
      }
      thisTimeSelectedNode.forEach((b) => {
        b.editorState.selected = true;
        ArrayUtils.addOnce(_selectNodes, b);
      });

      //选择单元
      selectConnectors.value.forEach((c) => {
        //c.hover = false;
        //c.selected = false;
      });
      ArrayUtils.clear(selectConnectors.value);
      context.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "connector").forEach((i) => {
        //TODO: const connector = context.getConnectors().get(i.data as string);
        //if (connector)
        //  selectConnectors.value.push(connector);
      });

      isMultiSelected.value = true;
    } else {
      _selectNodes.forEach((b) => b.editorState.selected = false);
      ArrayUtils.clear(_selectNodes);
      isMultiSelected.value = false;
    }

    notifySelectNodeChanged();
  }

  /**
   * 取消选中某个连接线
   */
  function unSelectConnector(connector: NodeConnector) {
    ArrayUtils.remove(selectConnectors.value, connector);
    // connector.selected = false;

    notifySelectConnectorChanged();
  }
  /**
   * 选中某个连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectConnector(connector: NodeConnector, append = false) { 
    if (append)
      ArrayUtils.addOnce(selectConnectors.value, connector);
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectConnectors.value.push(connector);
    }
    //TODO: connector.selected = true;
    notifySelectConnectorChanged();
  }

  function clearMulitSelect() {
    isMulitSelect.value = false;
    multiSelectRect.value.set(0, 0, 0, 0);
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
  context.getSelectNodes = () => selectNodes.value as Array<Node>;
  context.getSelectNodeCount = () => selectNodes.value.length;
  context.getSelectConnectors = () => selectConnectors.value as Array<NodeConnector>;
  context.isMulitSelect = () => isMulitSelect.value;

  return {
    selectNodes,
    selectConnectors,
    isMulitSelect,
    isMultiSelected,
    multiSelectRect,
  }
}