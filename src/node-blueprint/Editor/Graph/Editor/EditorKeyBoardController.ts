import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";

/**
 * 键盘控制器上下文函数
 */
export interface EditorKeyBoardControllerContext {
  /**
   * 获取用户是否在编辑器中按下了 Alt 键
   * @returns 
   */
  isKeyAltDown: () => boolean;
  /**
   * 获取用户是否在编辑器中按下了 Ctrl 键
   * @returns 
   */
  isKeyControlDown: () => boolean;
}

/**
 * 编辑器的键盘控制器
 * @param options 
 * @returns 
 */
export function useEditorKeyBoardControllerController(context: NodeGraphEditorInternalContext) {
  
  let keyControlDown = false;
  let keyAltDown = false;

  function onKeyDown(e : KeyboardEvent) {
    if(HtmlUtils.isEventInControl(e))
      return;
    switch(e.code) {
      case 'ControlRight':
      case 'ControlLeft':
        keyControlDown = true;
        break;
      case 'AltRight':
      case 'AltLeft':
        keyAltDown = true;
        break;
    }
  }
  function onKeyUp(e : KeyboardEvent) {
    if(HtmlUtils.isEventInControl(e))
      return;
    switch(e.code) {
      case 'ControlRight':
      case 'ControlLeft':
        keyControlDown = false;
        break;
      case 'AltRight':
      case 'AltLeft':
        keyAltDown = false;
        break;
      case 'KeyA':
        if(keyAltDown) context.selectAllConnectors();
        else if(keyControlDown) context.selectAllNodes();
        break;
      case 'Delete': 
        /* TODO:  if(keyAltDown) editor.deleteSelectedConnectors();
        else editor.deleteSelectedBlocks(); */
        break;
    }
  }

  context.isKeyAltDown = () => keyAltDown;
  context.isKeyControlDown = () => keyControlDown;

  return {
    onKeyDown,
    onKeyUp,
  }
}