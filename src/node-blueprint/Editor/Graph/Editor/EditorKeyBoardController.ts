import { onBeforeUnmount, onMounted } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";

/**
 * 键盘控制器上下文函数
 */
export interface NodeEditorKeyBoardControllerContext {
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
        if(keyAltDown)
          context.deleteSelectedConnectors();
        else 
          context.deleteSelectedNodes();
        break;
    }
  }

  context.isKeyAltDown = () => keyAltDown;
  context.isKeyControlDown = () => keyControlDown;

  onMounted(() => {
    document.addEventListener('keydown', onKeyDown);
    document.addEventListener('keyup', onKeyUp);
  });
  onBeforeUnmount(() => {
    document.removeEventListener('keydown', onKeyDown);
    document.removeEventListener('keyup', onKeyUp);
  });

  return {
    onKeyDown,
    onKeyUp,
  }
}