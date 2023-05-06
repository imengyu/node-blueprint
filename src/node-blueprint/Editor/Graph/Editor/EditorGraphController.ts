import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { ChunkInstance } from "../Cast/ChunkedPanel";

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
    //TODO: currentGraph.value?.connectors.push(connector);
    ArrayUtils.addOnce((connector.startPort?.parent as NodeEditor).connectors, connector);
    ArrayUtils.addOnce((connector.endPort?.parent as NodeEditor).connectors, connector);

    //更新
    if (connector != null) {
      connector.chunkInfo = new ChunkInstance(
        connector.updateRegion(),
        "connector",
        connector.uid
      );
      context.getBaseChunkedPanel().addInstance(connector.chunkInfo);
    }
  }
  /**
   * 从当前图表中移除连接线
   * @param connector 
   */
  function removeConnector(connector: NodeConnectorEditor) {
    
    if (connector.chunkInfo) {
      context.getBaseChunkedPanel().removeInstance(connector.chunkInfo);
      connector.chunkInfo = null;
    }
    const 
      start = connector.startPort,
      end = connector.endPort;
    if (start != null) 
      ArrayUtils.remove((start.parent as NodeEditor).connectors, connector);
    if (end != null) 
    ArrayUtils.remove((end.parent as NodeEditor).connectors, connector);
    allConnectors.delete(connector.uid);
    //TODO: currentGraph.value?.connectors.remove(connector);
  }

  context.getConnectors = () => allConnectors;
  context.getNodes = () => allNodes;
  context.removeConnector = removeConnector;
  context.addConnector = addConnector;

  return {
    pushNodes,
    allNodes,
    allConnectors,
    foregroundNodes,
    backgroundNodes,
  }
}