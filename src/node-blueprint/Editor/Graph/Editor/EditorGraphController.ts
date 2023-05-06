import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";

export interface NodeGraphEditorGraphControllerContext {
  /**
   * 获取节点
   */
  getNodes(): Map<string, Node>;
  /**
   * 获取连接线
   */
  getConnectors(): Map<string, NodeConnector>;  
  /**
    * 添加连接线至当前图表中
    * @param connector 
    */
  addConnector(connector: NodeConnectorEditor) : void;
  /**
    * 从当前图表中移除连接线
    * @param connector 
    */
  removeConnector(connector: NodeConnectorEditor) : void;
}

/**
 * 流程图信息（节点、连接、文件）管理器
 * @param options 
 * @returns 
 */
export function useEditorGraphController(context: NodeGraphEditorInternalContext) {
  const foregroundNodes = ref<Node[]>([]);
  const backgroundNodes = ref<Node[]>([]);
  const allNodes = new Map<string, NodeEditor>();
  const allConnectors = new Map<string, NodeConnectorEditor>();

  /**
   * 向编辑器视口中添加节点
   * @param nodes 
   */
  function pushNodes(...nodes: NodeEditor[]) {
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
  /**
   * 添加连接线至当前图表中
   * @param connector 
   */
  function addConnector(connector: NodeConnectorEditor) {
    allConnectors.set(connector.uid, connector);
  }
  /**
   * 从当前图表中移除连接线
   * @param connector 
   */
  function removeConnector(connector: NodeConnectorEditor) {
    allConnectors.delete(connector.uid);
  }

  context.getConnectors = () => allConnectors;
  context.getNodes = () => allNodes;
  context.removeConnector = removeConnector;
  context.addConnector = addConnector;

  return {
    pushNodes,
    foregroundNodes,
    backgroundNodes,
  }
}