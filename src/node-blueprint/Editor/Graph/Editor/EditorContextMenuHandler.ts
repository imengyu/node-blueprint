import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";


/**
 * 编辑器的右键菜单处理
 * @param options 
 * @returns 
 */
export function useEditorContextMenuHandler(context: NodeGraphEditorInternalContext) {
  

  function onCanvasContextMenu(e: MouseEvent) {
    e.preventDefault();
  }

  return {
    onCanvasContextMenu,
  }
}