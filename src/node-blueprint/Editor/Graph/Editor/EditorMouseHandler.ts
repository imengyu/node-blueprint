import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { Ref } from "vue";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";
import { createMouseDragHandler } from "./MouseHandler"

/**
 * 编辑器的鼠标处理
 * @param options 
 * @returns 
 */
export function useEditorMousHandler(options: {
  viewPort: Ref<NodeGraphEditorViewport>,
}) {
  const {
    viewPort
  } = options;

  const mouseInfo = new NodeGraphEditorMouseInfo();
  

  //拖拽处理
  const viewDragDownPos = new Vector2();
  const viewDragHandler = createMouseDragHandler({
    onDown(e) {
      e.stopPropagation();
      mouseInfo.mouseDowned = true;
      mouseInfo.mouseMoved = false;
      viewDragDownPos.set(viewPort.value.position);
      return true;
    },
    onMove(_, m, e) {
      e.stopPropagation();
      mouseInfo.mouseMoved = true;
      viewPort.value.position.set(viewDragDownPos);
      viewPort.value.position.substract(m);
    },
    onUp() {
      mouseInfo.mouseDowned = false;
    },
  });

  //按下入口
  function onMouseDown(e: MouseEvent) {
    if (viewDragHandler(e))
      return;
      
    //坐标更新
    mouseInfo.mouseMoved = false;
    mouseInfo.mouseDownPosScreen.set(e.x, e.y);
    viewPort.value.screenPointToViewportPoint(mouseInfo.mouseDownPosScreen, mouseInfo.mouseDownPosViewPort);
    updateMousePos(e);
  }
  //移动入口
  function onMouseMove(e: MouseEvent) {
    if (!mouseInfo.mouseDowned) {
      mouseInfo.mouseMoved = true;
      updateMousePos(e);
      //TODO: connectorCast();
    }
  }
  //滚轮
  function onMouseWhell(e: WheelEvent) {
    updateMousePos(e);
    e.preventDefault();

    //缩放功能
    if (e.deltaY !== 0) {
      const mousePosRefViewPort = new Vector2(mouseInfo.mouseCurrentPosViewPort);
      mousePosRefViewPort.substract(viewPort.value.position);
      if (e.deltaY < 0) {
        viewPort.value.scaleAndCenter(Math.min(2, Math.floor(Math.floor(viewPort.value.scale * 100) + 5) / 100), mousePosRefViewPort);
      } else {
        viewPort.value.scaleAndCenter(Math.max(0.5, Math.floor(Math.floor(viewPort.value.scale * 100) - 5) / 100), mousePosRefViewPort);
      }
    }
  }

  function updateMousePos(e: MouseEvent) {
    mouseInfo.mouseCurrentPosScreen.x = e.clientX;
    mouseInfo.mouseCurrentPosScreen.y = e.clientY;
    viewPort.value.screenPointToViewportPoint(
      mouseInfo.mouseCurrentPosScreen,
      mouseInfo.mouseCurrentPosViewPort
    );
  }


  return {
    onMouseDown,
    onMouseMove,
    onMouseWhell,
    mouseInfo,
  }
}

/**
 * 编辑器鼠标状态
 */
export class NodeGraphEditorMouseInfo {
  mouseDowned = false;
  mouseCurrentPosScreen = new Vector2();
  mouseCurrentPosViewPort = new Vector2();
  mouseDownPosScreen = new Vector2();
  mouseDownPosViewPort = new Vector2();
  mouseMoved = false;
}