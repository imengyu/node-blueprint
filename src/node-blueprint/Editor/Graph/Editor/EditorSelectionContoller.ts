import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { ref, type Ref } from "vue";
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
export function useEditorSelectionContoller(
  viewPort: Ref<NodeGraphEditorViewport>,
  mouseInfo: NodeGraphEditorMouseInfo,
  mouseDownHandlers: IMouseDragHandlerEntry[],
) {

  const selectNodes = ref(new Array<Node>());
  const selectConnectors = ref(new Array<NodeConnector>());
  const isMulitSelect = ref(false);
  const isMultiSelected = ref(false);
  const multiSelectRect = ref(new Rect());

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
      selectDragDownPos.set(viewPort.value.position);
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
    selectConnectors.value.clear();
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
    selectConnectors.value.clear();
    notifySelectConnectorChanged();
  }
  /**
   * 取消选中所有单元
   */
  function unSelectAllNodes() {
    selectNodes.value.forEach((b) => {
      b.selected = false;
      b.hover = false;
    });
    selectNodes.value.clear();
    notifySelectNodeChanged();
  }
  /**
   * 选中当前编辑器中所有单元
   */
  function selectAllNodes() {
    const _selectNodes = selectNodes.value;
    _selectNodes.clear();
    editor.getNodes().forEach((b) => {
      _selectNodes.push(b);
      b.selected = true;
    });
    notifySelectNodeChanged();
  }
  /**
   * 取消选中某个单元
   */
  function unSelectNode(block: Node) {
    selectNodes.value.remove(block);
    block.selected = false;
    notifySelectNodeChanged();
  }
  /**
   * 选中某个单元
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectNode(block: Node, append = false) {
    if (append)
      selectNodes.value.addOnce(block);
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      selectNodes.value.push(block);
    }
    block.selected = true;
    notifySelectNodeChanged();
  }
  //选择指定的单元
  function selectSomeNodes(blocks: Node[], append = false) {
    if (append) {
      blocks.forEach(element => {
        selectNodes.value.addOnce(element);
        element.selected = true;
      });
    }
    else {
      unSelectAllNodes();
      unSelectAllConnectors();
      blocks.forEach(block => {
        selectNodes.value.push(block);
        block.selected = true;
      });
    }
    notifySelectNodeChanged();
  }

  //多选选择
  function doSelectNodes() {
    const _multiSelectRect = multiSelectRect.value;
    const _selectNodes = selectNodes.value;
    const _mouseInfo = editor.getMouseInfo();

    //多选框的方向处理
    {
      if (_mouseInfo.mouseCurrentPosViewPort.x > _mouseInfo.mouseDownPosViewPort.x) {
        _multiSelectRect.x = _mouseInfo.mouseDownPosViewPort.x;
        _multiSelectRect.w = _mouseInfo.mouseCurrentPosViewPort.x - _mouseInfo.mouseDownPosViewPort.x;
      } else {
        _multiSelectRect.x = _mouseInfo.mouseCurrentPosViewPort.x;
        _multiSelectRect.w = _mouseInfo.mouseDownPosViewPort.x - _mouseInfo.mouseCurrentPosViewPort.x;
      }
      if (_mouseInfo.mouseCurrentPosViewPort.y > _mouseInfo.mouseDownPosViewPort.y) {
        _multiSelectRect.y = _mouseInfo.mouseDownPosViewPort.y;
        _multiSelectRect.h = _mouseInfo.mouseCurrentPosViewPort.y - _mouseInfo.mouseDownPosViewPort.y;
      } else {
        _multiSelectRect.y = _mouseInfo.mouseCurrentPosViewPort.y;
        _multiSelectRect.h = _mouseInfo.mouseDownPosViewPort.y - _mouseInfo.mouseCurrentPosViewPort.y;
      }
    }
    //多选单元和连接
    if (_multiSelectRect.w > 0 && _multiSelectRect.h > 0) {

      //选择单元
      const castNodes = editor.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "block");
      const thisTimeSelectedNode = new Array<Node>();
      castNodes.forEach((i) => {
        const block = editor.getNodes().get(i.data as string);
        if (block) thisTimeSelectedNode.addOnce(block);
      });
      for (let i = _selectNodes.length - 1; i >= 0; i--) {
        const b = _selectNodes[i] as Node;
        if (!thisTimeSelectedNode.contains(b)) {
          b.selected = false;
          _selectNodes.remove(b);
        } else
          thisTimeSelectedNode.remove(b);
      }
      thisTimeSelectedNode.forEach((b) => {
        b.selected = true;
        _selectNodes.addOnce(b);
      });

      //选择单元
      selectConnectors.value.forEach((c) => {
        c.hover = false;
        c.selected = false;
      });
      selectConnectors.value.clear();
      editor.getBaseChunkedPanel().testRectCastTag(_multiSelectRect as Rect, "connector").forEach((i) => {
        const connector = editor.getConnectors().get(i.data as string);
        if (connector) selectConnectors.value.push(connector);
      });

      isMultiSelected.value = true;
    } else {
      _selectNodes.forEach((b) => b.selected = false);
      _selectNodes.clear();
      isMultiSelected.value = false;
    }

    notifySelectNodeChanged();
  }

  /**
   * 取消选中某个连接线
   */
  function unSelectConnector(connector: NodeConnector) {
    selectConnectors.value.remove(connector);
    connector.selected = false;

    notifySelectConnectorChanged();
  }
  /**
   * 选中某个连接线
   * @param append 是否是追加选择，否则将会清空之前的选择
   */
  function selectConnector(connector: NodeConnector, append = false) {
    if (append)
      selectConnectors.value.addOnce(connector);
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

  return {
    selectNodes,
    selectConnectors,
    isMulitSelect,
    isMultiSelected,
    multiSelectRect,
  }
}