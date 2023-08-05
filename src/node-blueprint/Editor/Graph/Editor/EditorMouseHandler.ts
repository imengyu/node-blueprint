import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";
import { MouseEventUpdateMouseInfoType, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { createMouseDragHandler, type IMouseEventHandlerEntry, type IMouseMoveHandlerEntry, type IMouseWhellHandlerEntry } from "./MouseHandler"

/**
 * 鼠标事件控制器上下文函数
 */
export interface NodeEditorMouseControllerContext {
  setCursor: (cursor: string) => void;
  resetCursor: () => void;
  getMouseInfo: () => NodeGraphEditorMouseInfo,
  updateMousePos(e: MouseEvent): void,
  getMouseHandler: () => EditorMousHandlerExtendHandlers,
}

const noDragControl = [
  'node-editor-no-move',
  'param-editor',
]

//鼠标事件目标元素是否不可拖动
export function isMouseEventInNoDragControl(e: MouseEvent) {
  const stopElement = e.currentTarget;

  function checkElement(el: HTMLElement) {
    if (el.classList)
      for (const c of noDragControl) {
        if (el.classList.contains(c))
          return true;
      }
    return false;
  }

  function checkLoop(el: HTMLElement, loop: number) {
    if (checkElement(el))
      return true;
    if (loop < 8 && el.parentNode && el.parentNode !== stopElement)
      return checkLoop(el.parentNode as HTMLElement, loop + 1);
    return false;
  }

  return (
    HtmlUtils.isEventInControl(e) 
    || checkLoop(e.target as HTMLElement, 1)
  );
}

/**
 * 扩展鼠标事件接口
 */
export class EditorMousHandlerExtendHandlers {
  mouseDownHandlers = [] as IMouseEventHandlerEntry[];
  mouseMoveHandlers = [] as IMouseMoveHandlerEntry[];
  mouseUpHandlers = [] as IMouseMoveHandlerEntry[];
  mouseWhellHandlers = [] as IMouseWhellHandlerEntry[];

  pushMouseDownHandler(handler: IMouseEventHandlerEntry) {
    this.mouseDownHandlers.push(handler);
  }
  pushMouseMoveHandlers(handler: IMouseMoveHandlerEntry) {
    this.mouseMoveHandlers.push(handler);
  }
  pushMouseUpHandlers(handler: IMouseMoveHandlerEntry) {
    this.mouseUpHandlers.push(handler);
  }
  pushMouseWhellHandlers(handler: IMouseWhellHandlerEntry) {
    this.mouseWhellHandlers.push(handler);
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
      if (context.isAnyConnectorHover())
        return false;
      e.stopPropagation();
      context.setCursor('grab')
      mouseInfo.mouseDowned = true;
      viewDragDownPos.set(viewPort.position);
      return true;
    },
    onMove(_, m, e) {
      e.stopPropagation();
      viewPort.position.set(viewDragDownPos);
      viewPort.scaleScreenSizeToViewportSize(m);
      viewPort.position.substract(m);
    },
    onUp(e) {
      mouseInfo.mouseDowned = false;
      context.resetCursor();
      onMouseUp(e);
    },
  });

  extendHandlerObject.pushMouseDownHandler(viewDragHandler);
  extendHandlerObject.pushMouseWhellHandlers(viewDragHandler);

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
  //鼠标放开入口
  function onMouseUp(e: MouseEvent) {
    mouseEventUpdateMouseInfo(e, MouseEventUpdateMouseInfoType.Up);
    for (const handler of extendHandlerObject.mouseUpHandlers) {
      if (handler(mouseInfo, e))
        return;
    }
  }
  //滚轮
  function onMouseWhell(e: WheelEvent) {
    e.stopPropagation();
    e.preventDefault();
    if (isMouseEventInNoDragControl(e))
      return;
    updateMousePos(e);
    for (const handler of extendHandlerObject.mouseWhellHandlers)
      handler(e);
  }

  function updateMousePos(e: MouseEvent) {
    mouseInfo.mouseCurrentPosScreen.set(e.clientX, e.clientY);
    mouseInfo.mouseCurrentPosEditor.set(e.clientX, e.clientY);

    viewPort.fixScreenPosWithEditorAbsolutePos(mouseInfo.mouseCurrentPosEditor);
    viewPort.screenPointToViewportPoint(
      mouseInfo.mouseCurrentPosScreen,
      mouseInfo.mouseCurrentPosViewPort
    );
  }

  function mouseEventUpdateMouseInfo(e: MouseEvent, type: MouseEventUpdateMouseInfoType) {
    updateMousePos(e);
    switch(type) {
      case MouseEventUpdateMouseInfoType.Down:
        //坐标更新
        mouseInfo.mouseDownPosScreen.set(e.clientX, e.clientY);
        mouseInfo.mouseDownPosEditor.set(e.clientX, e.clientY);
        viewPort.fixScreenPosWithEditorAbsolutePos(mouseInfo.mouseDownPosEditor);
        viewPort.screenPointToViewportPoint(mouseInfo.mouseDownPosScreen, mouseInfo.mouseDownPosViewPort);
        break;
      case MouseEventUpdateMouseInfoType.Move:
        break;
      case MouseEventUpdateMouseInfoType.Up:
        mouseInfo.mouseDowned = false;
        break;
    }
  }

  context.updateMousePos = updateMousePos;
  context.getMouseHandler = () => extendHandlerObject;
  context.getMouseInfo = () => mouseInfo;
  context.mouseEventUpdateMouseInfo = mouseEventUpdateMouseInfo;

  return {
    onMouseDown,
    onMouseMove,
    onMouseUp,
    onMouseWhell,
    mouseInfo,
  }
}

/**
 * 编辑器鼠标状态
 */
export class NodeGraphEditorMouseInfo {
  /**
   * 获取鼠标是否按下
   */
  mouseDowned = false;
  /**
   * 获取鼠标当前的坐标（屏幕坐标）
   */
  mouseCurrentPosScreen = new Vector2();
  /**
   * 获取鼠标当前的坐标（编辑器坐标）
   */
  mouseCurrentPosEditor = new Vector2();
  /**
   * 获取鼠标当前的坐标（视口坐标）
   */
  mouseCurrentPosViewPort = new Vector2();
  /**
   * 获取鼠标按下时的坐标（屏幕坐标）
   */
  mouseDownPosScreen = new Vector2();
  /**
   * 获取鼠标按下时的坐标（编辑器坐标）
   */
  mouseDownPosEditor = new Vector2();
  /**
   * 获取鼠标按下时的坐标（视口坐标）
   */
  mouseDownPosViewPort = new Vector2();
  /**
   * 获取当前鼠标是否按下
   */
  get mouseMoved() {
    return Math.abs(this.mouseDownPosScreen.x - this.mouseCurrentPosScreen.x) > 2 || 
      Math.abs(this.mouseDownPosScreen.y - this.mouseCurrentPosScreen.y) > 2;
  }
}