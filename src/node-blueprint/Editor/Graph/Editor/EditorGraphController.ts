
import { ref } from "vue";
import { ChunkInstance } from "../Cast/ChunkedPanel";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeEditor } from "../Flow/NodeEditor";
import { printError, printWarning } from "@/node-blueprint/Base/Utils/Logger/DevLog";

export interface NodeGraphEditorGraphControllerContext {
  /**
   * 获取节点
   */
  getNodes(): Map<string, NodeEditor>;
  /**
   * 获取连接线
   */
  getConnectors(): Map<string, NodeConnectorEditor>;  
  /**
    * 添加节点至当前图表中
    * @param nodes 
    */
  addNode(nodes: NodeEditor) : void;
  /**
    * 添加节点至当前图表中
    * @param nodes 
    */
  addNodes(nodes: NodeEditor[]) : void;
  /**
   * 移除节点
   * @param node 
   * @param byUser 是否是用户操作，如果是用户操作，则会调用删除检查回调
   */
  removeNode(node: NodeEditor, byUser: boolean) : void;
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
  /**
   * 获取当前打开的图表
   */
  getCurrentGraph() : NodeGraph;
  /**
   * 标记当前图表已经被用户修改
   */
  markGraphChanged() : void;
  /**
   * 关闭图表
   */
  closeGraph() : void;
  /**
   * 清空编辑器内所有内容
   */
  clearAll() : void;
}

const TAG = 'EditorGraphController';

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
  const currentGraph = ref<NodeGraph|null>(null);

  /**
   * 向编辑器视口中添加节点
   * @param nodes 
   */
  function pushNodes(...nodes: NodeEditor[]) {
    return new Promise<void>((resolve) => {

      for (const node of nodes) {
        switch(node.style.layer) {
          case 'normal':
            foregroundNodes.value.push(node);
            break;
          case 'background':
            backgroundNodes.value.push(node);
            break;
          default:
            printError(TAG, `Faild to add node: ${node.getName()} UID: ${node.uid} (${node.guid}) because: bad style.layer: ${node.style.layer}`);
            break;
        }        
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
    currentGraph.value?.connectors.push(connector);
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
    if (currentGraph.value)
      ArrayUtils.remove(currentGraph.value.connectors, connector);
    allConnectors.delete(connector.uid);
  }
  /**
   * 移除节点
   * @param node 
   */
  function removeNode(node: NodeEditor, byUser: boolean) {
    if (allNodes.has(node.uid)) {

      //自定义检查回调
      if (byUser) {
        const err = node.events.onDeleteCheck?.(node, context.getCurrentGraph());
        if (err) {
          printWarning(
            TAG,
            `无法删除单元 ${node.define.name} ( ${node.uid}) : ${err}`
          );
          return false;
        }
      }

      node.editorHooks.callbackOnRemoveFromEditor?.();

      allNodes.delete(node.uid);
      switch(node.style.layer) {
        case 'normal':
          ArrayUtils.remove(foregroundNodes.value, node);
          break;
        case 'background':
          ArrayUtils.remove(backgroundNodes.value, node);
          break;
      }
    }
    return true;
  }

  /**
   * 标记当前图表已经被用户修改
   */
  function markGraphChanged() {
    
  }

  /**
   * 加载图表
   * @param graph 
   */
  function loadGraph(graph: NodeGraph) {
    closeGraph();
    graph.nodes.forEach((node) => {
      pushNodes(node as NodeEditor);
    });
    graph.connectors.forEach((connector) => {
      allConnectors.set(connector.uid, connector as NodeConnectorEditor);
    });
    graph.activeEditor = context;
    currentGraph.value = graph;
  }
  /**
   * 关闭图表
   * @param graph 
   */
  function closeGraph() {
    if (currentGraph.value) {
      clearAll();
      currentGraph.value.activeEditor = null;
      currentGraph.value = null;
    }
  }
  /**
   * 清空编辑器内所有内容
   */
  function clearAll() {
    ArrayUtils.clear(foregroundNodes.value);
    ArrayUtils.clear(backgroundNodes.value);
    allNodes.clear();
    allConnectors.clear();
  }

  context.closeGraph = () => closeGraph;
  context.clearAll = () => clearAll;
  context.getConnectors = () => allConnectors;
  context.getNodes = () => allNodes;
  context.removeConnector = removeConnector;
  context.addConnector = addConnector;
  context.removeNode = removeNode;
  context.addNodes = (nodes) => pushNodes(...nodes);
  context.addNode = (node) => pushNodes(node);
  context.getCurrentGraph = () => currentGraph.value as NodeGraph;
  context.markGraphChanged = markGraphChanged;

  return {
    loadGraph,
    pushNodes,
    allNodes,
    allConnectors,
    foregroundNodes,
    backgroundNodes,
  }
}