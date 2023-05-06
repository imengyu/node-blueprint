import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";
import { MouseEventUpdateMouseInfoType, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { createMouseDragHandler, type IMouseDragHandlerEntry, type IMouseMoveHandlerEntry } from "./MouseHandler"

//鼠标事件目标元素是否不可拖动
export function isMouseEventInNoDragControl(e: MouseEvent) {
  return (
    HtmlUtils.isEventInControl(e) 
    || (e.target as HTMLElement).classList.contains('flow-block-no-move')
  );
}

/**
 * 扩展鼠标事件接口
 */
export class EditorMousHandlerExtendHandlers {
  mouseDownHandlers = [] as IMouseDragHandlerEntry[];
  mouseMoveHandlers = [] as IMouseMoveHandlerEntry[];

  pushMouseDownHandler(handler: IMouseDragHandlerEntry) {
    this.mouseDownHandlers.push(handler);
  }
  pushMouseMoveHandlers(handler: IMouseMoveHandlerEntry) {
    this.mouseMoveHandlers.push(handler);
  }
}

/**
 * 编辑器的鼠标处理
 * @param options 
 * @returns 
 */
export function useEditorMousHandler(context: NodeGraphEditorInternalContext) {
  const mouseInfo = new NodeGraphEditorMouseInfo();
  const viewPort = context.getViewPort();

  /**
   * 对外鼠标事件接口
   */
  const extendHandlerObject = new EditorMousHandlerExtendHandlers();
   
  //拖拽处理
  const viewDragDownPos = new Vector2();
  const viewDragHandler = createMouseDragHandler({
    onDown(e) {
      if (isMouseEventInNoDragControl(e))
        return false;
      if (e.button !== 2 && e.button !== 1)
        return false;
      e.stopPropagation();
      context.setCursor('grab')
      mouseInfo.mouseDowned = true;
      mouseInfo.mouseMoved = false;
      viewDragDownPos.set(viewPort.position);
      return true;
    },
    onMove(_, m, e) {
      e.stopPropagation();
      mouseInfo.mouseMoved = true;
      viewPort.position.set(viewDragDownPos);
      viewPort.scaleScreenSizeToViewportSize(m);
      viewPort.position.substract(m);
    },
    onUp(e) {
      mouseInfo.mouseDowned = false;
      context.ressetCursor();
      mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Up);
    },
  });

  extendHandlerObject.pushMouseDownHandler(viewDragHandler);

  //按下入口
  function onMouseDown(e: MouseEvent) {
    mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Down);

    for (const handler of extendHandlerObject.mouseDownHandlers) {
      if (handler(e))
        return;
    }
  }
  //移动入口
  function onMouseMove(e: MouseEvent) {
    mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Move);
    
    for (const handler of extendHandlerObject.mouseMoveHandlers) {
      if (handler(mouseInfo, e))
        return;
    }
  }
  //滚轮
  function onMouseWhell(e: WheelEvent) {
    updateMousePos(e);
    e.preventDefault();

    //缩放功能
    if (e.deltaY !== 0) {
      if (e.deltaY < 0) {
        viewPort.scaleAndCenter(Math.min(2, Math.floor(Math.floor(viewPort.scale * 100) + 5) / 100), mouseInfo.mouseCurrentPosScreen);
      } else {
        viewPort.scaleAndCenter(Math.max(0.5, Math.floor(Math.floor(viewPort.scale * 100) - 5) / 100), mouseInfo.mouseCurrentPosScreen);
      }
    }
  }

  function updateMousePos(e: MouseEvent) {
    mouseInfo.mouseCurrentPosScreen.x = e.clientX;
    mouseInfo.mouseCurrentPosScreen.y = e.clientY;

    viewPort.fixScreenPosWithEditorAbsolutePos(mouseInfo.mouseCurrentPosScreen);
    viewPort.screenPointToViewportPoint(
      mouseInfo.mouseCurrentPosScreen,
      mouseInfo.mouseCurrentPosViewPort
    );
  }

  function mouseEventUpdateMouseInfo(e: MouseEvent, type: MouseEventUpdateMouseInfoType) {
    switch(type) {
      case MouseEventUpdateMouseInfoType.Down:
        //坐标更新
        viewPort.screenPointToViewportPoint(mouseInfo.mouseDownPosScreen, mouseInfo.mouseDownPosViewPort);
        mouseInfo.mouseDownPosScreen.set(e.x, e.y);
        mouseInfo.mouseMoved = false;
        break;
      case MouseEventUpdateMouseInfoType.Move:
        mouseInfo.mouseMoved = true;
        break;
      case MouseEventUpdateMouseInfoType.Up:
        mouseInfo.mouseDowned = false;
        break;
    }
    updateMousePos(e);
  }


  context.getMouseHandler = () => extendHandlerObject;
  context.getMouseInfo = () => mouseInfo;
  context.mouseEventUpdateMouseInfo = mouseEventUpdateMouseInfo;

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