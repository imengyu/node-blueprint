import { onMounted, ref, watch } from "vue";
import { NodeGraphEditorViewport, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { ChunkedPanel } from "../Cast/ChunkedPanel";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import type { NodeEditor } from "../Flow/NodeEditor";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { NodePortEditor } from "../Flow/NodePortEditor";

export interface NodeEditorViewPortControllerContext {
  viewPortManager: {
    /**
      * 获取当前视口
      */
    getViewPort() : NodeGraphEditorViewport;
    /**
      * 获取 ChunkedPanel
      */
    getBaseChunkedPanel(): ChunkedPanel;
    /**
     * 计算一些单元的矩形区域
     * @param nodes 要计算的单元
     */
    calcNodesRegion(nodes: NodeEditor[]): Rect;
    /**
     * 移动视口至节点中心位置
     * @param baseNode 
     * @returns 返回是否已经移至目标位置
     */
    moveViewportToNode(nodeOrPort : NodeEditor|NodePortEditor, showPositionIndicator ?: boolean) : boolean; 
    /**
     * 设置视口坐标
     * @param pos 
     */
    moveViewportToPosition(pos: Vector2): void;
    /**
     * 让视口跟随鼠标位置移动(通常在按下鼠标拖拽时使用)
     * @param pos 
     */
    moveViewportWithCursorPosition(pos: Vector2): void;
    /**
     * 记录视口位置
     */
    recordViewportPosition(): void;
    /**
     * 获取自上次记录以来视口移动的位置
     */
    getViewportMovedPosition(): Vector2;
  }
}

/**
 * 编辑器的视图功能控制器
 * @param options 
 * @returns 
 */
export function useEditorViewPortController(context: NodeGraphEditorInternalContext) {
  
  const chunkedPanel = new ChunkedPanel();
  const cursor = ref('default');
  const nodeExclusionEnable = ref(false);
  const viewPort = ref<NodeGraphEditorViewport>(new NodeGraphEditorViewport());

  //缩放功能
  function mouseWhellEvent(e: WheelEvent) {
    const mouseInfo = context.mouseManager.getMouseInfo();
    if (e.deltaY !== 0) {
      if (e.deltaY < 0) {
        //放大
        if (Math.abs(viewPort.value.scale - 1) <= 0.01) {
          //参考ue，放大到100后停止，需要按住ctrl才能继续放大
          if (context.keyboardManager.isKeyControlDown()) 
            viewPort.value.scaleAndCenter(Math.min(2, viewPort.value.scale + 0.05), mouseInfo.mouseCurrentPosScreen);
           else
            viewPort.value.scaleAndCenter(1, mouseInfo.mouseCurrentPosScreen);
        } else {
          viewPort.value.scaleAndCenter(Math.min(2, viewPort.value.scale + 0.05), mouseInfo.mouseCurrentPosScreen);
        }
      } else {
        //缩小
        viewPort.value.scaleAndCenter(Math.max(0.5, viewPort.value.scale - 0.05), mouseInfo.mouseCurrentPosScreen);
      }
    }
  }

  if (!context.mouseManager) context.mouseManager = {} as any;
  context.mouseManager.setCursor = (v: string) => { cursor.value = v };
  context.mouseManager.resetCursor = () => { cursor.value = 'default' };

  //扩展函数

  const BORDER_SIZE = 25;
  const BORDER_SIZE_DOWN = 45;
  const MOVE_SIZE = 10;

  /**
   * 计算一些单元的矩形区域
   * @param nodes 要计算的单元
   */
  function calcNodesRegion(nodes : NodeEditor[]) : Rect {
    let x = 0, y = 0, r = 0, b = 0;
    nodes.forEach((node) => {
      if(x === 0 || node.position.x < x) x = node.position.x;
      if(y === 0 || node.position.y < y) y = node.position.y;

      const size = node.getRealSize();

      if(r === 0 || node.position.x + size.x > r) r = node.position.x + size.x;
      if(b === 0 || node.position.y + size.y > b) b = node.position.y + size.y;
    })
    return new Rect(x, y, r - x, b - y);
  }

  const recordViewPortPos = new Vector2();
  const tempViewPortPos = new Vector2();

  function recordViewportPosition() {
    recordViewPortPos.set(viewPort.value.position as Vector2);
  }
  function getViewportMovedPosition() {
    return tempViewPortPos.set(viewPort.value.position as Vector2).substract(recordViewPortPos);
  }
  function moveViewportWithCursorPosition(pos: Vector2) {
    if (pos.x < BORDER_SIZE)
      viewPort.value.position.x -= MOVE_SIZE;
    else if (pos.x > viewPort.value.size.x - BORDER_SIZE) 
      viewPort.value.position.x += MOVE_SIZE;
    
    if (pos.y < BORDER_SIZE)
      viewPort.value.position.y -= MOVE_SIZE;
    else if (pos.y > viewPort.value.size.y - BORDER_SIZE_DOWN) 
      viewPort.value.position.y += MOVE_SIZE;
  }

  context.viewPortManager = {
    getBaseChunkedPanel: () => chunkedPanel,
    getViewPort: () => viewPort.value as NodeGraphEditorViewport,
    calcNodesRegion,
    moveViewportToPosition: (pos) => viewPort.value.position.set(pos),
    moveViewportWithCursorPosition,
    moveViewportToNode(nodeOrPort : NodeEditor|NodePortEditor, positionIndicator = false) : boolean {
      const node = nodeOrPort instanceof NodePortEditor ? nodeOrPort.parent as NodeEditor : nodeOrPort;
      const size = (node as NodeEditor).getRealSize();
      const offset = new Vector2(
        size.x / 2 - viewPort.value.size.x / 2, 
        size.y / 2 - viewPort.value.size.y / 2, 
      );
      const newPos = new Vector2(node.position).add(offset);

      viewPort.value.scaleScreenSizeToViewportSize(offset);

      if (positionIndicator)
        context.interfaceUtiles.showNodePositionIndicator(nodeOrPort);

      if (!viewPort.value.position.equal(newPos)) {
        viewPort.value.position = newPos;
        return false;
      }
      return true;
    },
    recordViewportPosition,
    getViewportMovedPosition
  };

  const currentShowNodes : NodeEditor[] = [];

  /**
   * 进行节点显示剔除
   */
  function doNodeExclusion() {
    const nodesMap = context.graphManager.getNodes();
    if (nodesMap.size > 64) {
      nodeExclusionEnable.value = true;
      for (const node of currentShowNodes)
        node.exclusionState = true;
      currentShowNodes.splice(0);
      //从区块检测器中选出当前显示在屏幕中的节点
      const instances = chunkedPanel.testRectCastTag(viewPort.value.rect(), 'node');
      //对比当前显示的节点和新的节点，进行隐藏和显示
      for (const instance of instances) {
        const node = nodesMap.get(instance.data as string);
        if (node) {
          node.exclusionState = false;
          currentShowNodes.push(node);
        }
      }
    } else if (nodeExclusionEnable.value) {
      nodeExclusionEnable.value = false;
    }
  }

  onMounted(() => {
    context.mouseManager.getMouseHandler().pushMouseWhellHandlers(mouseWhellEvent);
    setTimeout(() => doNodeExclusion(), 300);
  });

  watch(() => viewPort.value.position.x, doNodeExclusion);
  watch(() => viewPort.value.position.y, doNodeExclusion);
  watch(() => viewPort.value.scale, doNodeExclusion);

  return {
    chunkedPanel,
    cursor,
    viewPort,
    nodeExclusionEnable,
  }
}