import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref } from "vue";

/**
 * 流程图信息（节点、连接、文件）管理器
 * @param options 
 * @returns 
 */
export function useEditorGraphController() {
  const foregroundNodes = ref<Node[]>([]);
  const backgroundNodes = ref<Node[]>([]);

  /**
   * 向编辑器视口中添加节点
   * @param nodes 
   */
  function pushNodes(...nodes: Node[]) {
    for (const node of nodes) {
      if (node.style.layer === 'normal')
        foregroundNodes.value.push(node);
      else if (node.style.layer === 'background')
        backgroundNodes.value.push(node);
    }

    setTimeout(() => {
      for (const node of nodes)
        node.editorHooks.callbackOnAddToEditor?.();
    }, 500);
  }

  return {
    pushNodes,
    foregroundNodes,
    backgroundNodes,
  }
}