import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";

/**
 * 流程图信息（节点、连接、文件）管理器
 * @param options 
 * @returns 
 */
export function useEditorGraphController(context: NodeGraphEditorInternalContext) {
  const foregroundNodes = ref<Node[]>([]);
  const backgroundNodes = ref<Node[]>([]);
  const allNodes = new Map<string, Node>();

  /**
   * 向编辑器视口中添加节点
   * @param nodes 
   */
  function pushNodes(...nodes: Node[]) {
    return new Promise<void>((resolve) => {

      for (const node of nodes) {
        if (node.style.layer === 'normal')
          foregroundNodes.value.push(node);
        else if (node.style.layer === 'background')
          backgroundNodes.value.push(node);
        
        allNodes.set(node.uid, node);
      }

      setTimeout(() => {
        for (const node of nodes)
          node.editorHooks.callbackOnAddToEditor?.();
        resolve();
      }, 500);
    })
  }



  context.getNodes = () => {
    return allNodes;
  };

  return {
    pushNodes,
    foregroundNodes,
    backgroundNodes,
  }
}