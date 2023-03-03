import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";
import type { Ref } from "vue";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";
import { createMouseDragHandler, type IMouseDragHandlerEntry } from "./MouseHandler"

//鼠标事件目标元素是否不可拖动
export function isMouseEventInNoDragControl(e: MouseEvent) {
  return (
    HtmlUtils.isEventInControl(e) 
    || (e.target as HTMLElement).classList.contains('flow-block-no-move')
  );
}

/**
 * 编辑器的鼠标处理
 * @param options 
 * @returns 
 */
export function useEditorMousHandler(options: {
  viewPort: Ref<NodeGraphEditorViewport>,
}) {
  const { viewPort } = options;

  const mouseInfo = new NodeGraphEditorMouseInfo();
  const mouseDownHandlers = [] as IMouseDragHandlerEntry[];
  
  //拖拽处理
  const viewDragDownPos = new Vector2();
  const viewDragHandler = createMouseDragHandler({
    onDown(e) {
      if (isMouseEventInNoDragControl(e))
        return false;
      if (e.button !== 2 && e.button !== 1)
        return false;
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

  mouseDownHandlers.push(viewDragHandler);

  //按下入口
  function onMouseDown(e: MouseEvent) {
    //坐标更新
    viewPort.value.screenPointToViewportPoint(mouseInfo.mouseDownPosScreen, mouseInfo.mouseDownPosViewPort);
    mouseInfo.mouseDownPosScreen.set(e.x, e.y);
    mouseInfo.mouseMoved = false;

    for (const handler of mouseDownHandlers) {
      if (handler(e))
        return;
    }

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
      if (e.deltaY < 0) {
        viewPort.value.scaleAndCenter(Math.min(2, Math.floor(Math.floor(viewPort.value.scale * 100) + 5) / 100), mouseInfo.mouseCurrentPosScreen);
      } else {
        viewPort.value.scaleAndCenter(Math.max(0.5, Math.floor(Math.floor(viewPort.value.scale * 100) - 5) / 100), mouseInfo.mouseCurrentPosScreen);
      }
    }
  }

  function updateMousePos(e: MouseEvent) {
    mouseInfo.mouseCurrentPosScreen.x = e.clientX;
    mouseInfo.mouseCurrentPosScreen.y = e.clientY;

    viewPort.value.fixScreenPosWithEditorAbsolutePos(mouseInfo.mouseCurrentPosScreen);
    viewPort.value.screenPointToViewportPoint(
      mouseInfo.mouseCurrentPosScreen,
      mouseInfo.mouseCurrentPosViewPort
    );
  }


  return {
    onMouseDown,
    onMouseMove,
    onMouseWhell,
    mouseDownHandlers,
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