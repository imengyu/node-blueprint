import { onMounted, ref } from "vue";
import { NodeGraphEditorViewport, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { ChunkedPanel } from "../Cast/ChunkedPanel";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";

export interface NodeEditorViewPortControllerContext {
  /**
   * 计算一些单元的矩形区域
   * @param nodes 要计算的单元
   */
  calcNodesRegion(nodes: NodeEditor[]): Rect;
  /**
   * 让视口跟随鼠标位置移动(通常在按下鼠标拖拽时使用)
   * @param pos 
   */
  moveViewportWithCursorPosition(pos: Vector2): void;
}

/**
 * 编辑器的视图功能控制器
 * @param options 
 * @returns 
 */
export function useEditorViewPortController(context: NodeGraphEditorInternalContext) {
  
  const chunkedPanel = new ChunkedPanel()
  const cursor = ref('default');
  const viewPort = ref<NodeGraphEditorViewport>(new NodeGraphEditorViewport());

  //缩放功能
  function mouseWhellEvent(e: WheelEvent) {
    const mouseInfo = context.getMouseInfo();
    if (e.deltaY !== 0) {
      if (e.deltaY < 0) {
        //放大
        if (Math.abs(viewPort.value.scale - 1) <= 0.01) {
          //参考ue，放大到100后停止，需要按住ctrl才能继续放大
          if (context.isKeyControlDown()) 
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
  
  //基础控制
  context.getBaseChunkedPanel = () => chunkedPanel;
  context.getViewPort = () => viewPort.value as NodeGraphEditorViewport;
  context.setCursor = (v: string) => { cursor.value = v };
  context.resetCursor = () => { cursor.value = 'default' };

  //扩展函数

  const BORDER_SIZE = 15;
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
  /**
   * 让视口跟随鼠标位置移动(通常在按下鼠标拖拽时使用)
   * @param pos 
   */
  function moveViewportWithCursorPosition(pos: Vector2) {
    if (pos.x < BORDER_SIZE)
      viewPort.value.position.x -= MOVE_SIZE;
    else if (pos.x > viewPort.value.size.x - BORDER_SIZE) 
      viewPort.value.position.x += MOVE_SIZE;
    
    if (pos.y < BORDER_SIZE)
      viewPort.value.position.y -= MOVE_SIZE;
    else if (pos.y > viewPort.value.size.y - BORDER_SIZE) 
      viewPort.value.position.y += MOVE_SIZE;
  }

  context.calcNodesRegion = calcNodesRegion;
  context.moveViewportWithCursorPosition = moveViewportWithCursorPosition;

  onMounted(() => {
    context.getMouseHandler().pushMouseWhellHandlers(mouseWhellEvent);
  });

  return {
    chunkedPanel,
    cursor,
    viewPort,
  }
}