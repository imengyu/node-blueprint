import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";

/**
 * 编辑器的剪贴板控制器上下文函数
 */
export interface NodeEditorClipBoardControllerContext {
  /**
   * 剪切选中的单元
   * @returns 
   */
  cutSelectionNodes: () => void;
  /**
   * 复制选中的单元
   * @returns 
   */
  copySelectionNodes: () => void;
  /**
   * 从剪贴板粘贴单元
   * @returns 
   */
  pasteNodes: () => void;
  /**
   * 获取剪贴板是否可以粘贴单元
   * @returns 
   */
  isPasteable: () => boolean;
}

/**
 * 编辑器的剪贴板控制器
 * @param options 
 * @returns 
 */
export function useEditorClipBoardControllerController(context: NodeGraphEditorInternalContext) {
  
  function cutOrCopySelectionNodes(cut : boolean) {
    const selectNodes = context.getSelectNodes();

  }

  function cutSelectionNodes() {
    cutOrCopySelectionNodes(true);
  }
  function copySelectionNodes() {
    cutOrCopySelectionNodes(false);
  }
  function pasteNodes() {
    
    context.markGraphChanged();
  }
  function isPasteable() {
    return false;
  }

  context.cutSelectionNodes = cutSelectionNodes;
  context.copySelectionNodes = copySelectionNodes;
  context.pasteNodes = pasteNodes;
  context.isPasteable = isPasteable;

  return {}
}