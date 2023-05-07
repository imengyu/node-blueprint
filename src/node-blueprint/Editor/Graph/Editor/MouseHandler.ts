import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodeGraphEditorMouseInfo } from "./EditorMouseHandler";

export type IMouseEventHandlerEntry = (e: MouseEvent) => boolean;
export type IMouseMoveHandlerEntry = (mouseInfo : NodeGraphEditorMouseInfo, e: MouseEvent) => boolean;

/**
 * 创建鼠标按下移动处理器
 * @param options 处理器
 * @returns 返回入口，入口需要在 mousedown 事件中调用
 */
export function createMouseDragHandler(options: {
  /**
   * 按下事件
   * @param e 
   * @returns 
   */
  onDown: (e: MouseEvent) => boolean;
  /**
   * 按下并且移动事件
   * @param e 
   * @returns 
   */
  onMove: (downPos: Vector2, movedPos: Vector2, e: MouseEvent) => void;
  /**
   * 释放事件
   * @param e 
   * @returns 
   */
  onUp: (e: MouseEvent) => void;
}) : IMouseEventHandlerEntry{

  const { onDown, onMove, onUp } = options;
  const mouseDownPosition = new Vector2();
  const movedPosition = new Vector2();

  function mousemove(e: MouseEvent) {
    movedPosition.set(e.x, e.y);
    movedPosition.substract(mouseDownPosition);
    onMove(mouseDownPosition, movedPosition, e);
  }
  function mouseup(e: MouseEvent) {
    onUp(e);
    mouseDownPosition.set(0, 0);
    document.removeEventListener('mousemove', mousemove);
    document.removeEventListener('mouseup', mouseup);
  }

  //MouseDown handler
  return (e: MouseEvent) => {
    if (onDown(e)) {
      mouseDownPosition.set(e.x, e.y);
      document.addEventListener('mousemove', mousemove);
      document.addEventListener('mouseup', mouseup);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    return false;
  };
}

/**
 * 创建鼠标按下并且放开处理器
 * @param options 
 * @returns 
 */
export function createMouseDownAndUpHandler(options: {
  /**
   * 按下事件
   * @param e 
   * @returns 
   */
  onDown: (e: MouseEvent) => boolean;
  /**
   * 释放事件
   * @param e 
   * @returns 
   */
  onUp: (e: MouseEvent) => void;
}) : IMouseEventHandlerEntry {
  const { onDown, onUp } = options;

  function mouseup(e: MouseEvent) {
    onUp(e);
    document.removeEventListener('mouseup', mouseup);
  }
  //MouseDown handler
  return (e: MouseEvent) => {
    if (onDown(e)) {
      document.addEventListener('mouseup', mouseup);
      e.preventDefault();
      e.stopPropagation();
      return true;
    }
    return false;
  };
}