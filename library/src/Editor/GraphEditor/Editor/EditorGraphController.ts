
import { ref, toRaw } from "vue";
import { ChunkInstance } from "./Cast/ChunkedPanel";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Node } from "@/Core/Node/Node";
import type { NodeConnectorEditor } from "@/Core/Editor/NodeConnectorEditor";
import type { NodeGraph } from "@/Core/Graph/NodeGraph";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import type { NodePortEditor } from "@/Core/Editor/NodePortEditor";
import { devWarning, printError, printWarning } from "@/Common/Logger/DevLog";
import { NodeGraphEditorInternalMessages } from "./Messages/EditorInternalMessages";
import { NodePort } from "@/Core/Node/NodePort";

export interface NodeGraphEditorGraphControllerContext {
  graphManager: {
    /**
     * 获取节点
     */
    getNodes(): Map<string, NodeEditor>;
    /**
     * 通过UID获取节点
     * @param uid UID
     */
    getNodeByUid(uid: string): NodeEditor|null;
    /**
     * 通过UID数组获取节点数组
     * @param uid UID数组
     */
    getNodesByUids(uids: string[]): NodeEditor[];
    /**
     * 通过UID获取节点端口
     * @param uid UID
     * @param pguid 端口UID
     */
    getNodePortByUid(uid: string, pguid: string): NodePortEditor|null;
    /**
     * 获取连接线
     */
    getConnectors(): Map<string, NodeConnectorEditor>;  
    /**
     * 通过UID数组获取连接线实例
     * @param uids 
     */
    getConnectorsByUids(uids: string[]): NodeConnectorEditor[];  
    /**
     * 通过UID获取连接线实例
     * @param uid 
     */
    getConnectorByUid(uid: string): NodeConnectorEditor|null;  
    /**
     * 通过UID查找当前图表中的全部子图表，如果未找到，则返回null
     * @param uid 
     */
    getSubGraphByUid(uid: string): NodeGraph|null;  
    /**
     * 通过UID查找当前文档中的全部子图表，如果未找到，则返回null
     * @param uid 
     */
    getDocGraphByUid(uid: string): NodeGraph|null;  
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
    removeNode(node: NodeEditor, byUser: boolean) : boolean;
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
    
    /**
     * 按标签筛选节点
     * @param tag 标签
     */
    filterNodes(tag: string): NodeEditor[];
    /**
     * 向指定节点发送消息
     * @param node 节点
     * @param message 消息号
     * @param data 消息数据
     */
    sendMessageToNode(node: NodeEditor, message: string | number, data: any): void;
    /**
     * 向多个节点发送消息
     * @param nodes 节点数组
     * @param message 消息号
     * @param data 消息数据
     */
    sendMessageToNodes(nodes: NodeEditor[], message: string | number, data: any): void;
    /**
     * 向多个已筛选的节点发送消息
     * @param tag 筛选标签
     * @param message 消息号
     * @param data 消息数据
     */
    sendMessageToFilteredNodes(tag: string, message: string|number, data: any) : void;
    
  },
  /**
   * 向编辑器分发消息
   * @param message 消息
   * @param data 消息数据
   */
  dispstchMessage(message: string, data: any) : void;
  /**
   * 向顶级编辑器分发消息
   * @param message 消息
   * @param data 消息数据
   */
  postUpMessage(message: string, data: any) : void;
}

const TAG = 'EditorGraphController';

const MAX_NODES_PER_FRAME = 2048;

/**
 * 流程图信息（节点、连接、文件）管理器
 * @param options 
 * @returns 
 */
export function useEditorGraphController(
  context: NodeGraphEditorInternalContext,
  onUpMessage: (msg: string, data: any) => void,
) {
  const foregroundNodes = ref<Node[]>([]);
  const backgroundNodes = ref<Node[]>([]);
  const allNodes = new Map<string, NodeEditor>();
  const allConnectors = new Map<string, NodeConnectorEditor>();
  const currentGraph = ref<NodeGraph|null>(null);
  let graphEndHoldCb: VoidFunction|null = null;

  /**
   * 向编辑器视口中添加节点
   * @param nodes 
   */
  function pushNodes(...nodes: NodeEditor[]) {
    //当节点非常多时，分步添加
    if (nodes.length > 32) {
      const arrays : NodeEditor[][] = [];
      while (nodes.length > 0)
        arrays.push(nodes.splice(0, 32));
      return Promise.all(arrays.map((nodesSplited) => {
        return new Promise<void>((resolve, reject) => {
          setTimeout(() => {
            pushNodes(...nodesSplited)
              .then(() => resolve())
              .catch(reject);
          }, 200);
        });
      }))
    }
    return new Promise<void>((resolve) => {
      for (const node of nodes) {
        switch(node.style.layer) {
          case 'normal':
            if (foregroundNodes.value.length > MAX_NODES_PER_FRAME)
              printError(TAG, null, `Faild to add node: ${node.name} UID: ${node.uid} (${node.guid}) because: too many nodes in frame (>${MAX_NODES_PER_FRAME})`);
            else
              foregroundNodes.value.push(node);
            break;
          case 'background':
            if (backgroundNodes.value.length > MAX_NODES_PER_FRAME)
              printError(TAG, null, `Faild to add node: ${node.name} UID: ${node.uid} (${node.guid}) because: too many nodes in frame (>${MAX_NODES_PER_FRAME})`);
            else
              backgroundNodes.value.push(node);
            break;
          default:
            printError(TAG, null, `Faild to add node: ${node.name} UID: ${node.uid} (${node.guid}) because: bad style.layer: ${node.style.layer}`);
            break;
        }        
        allNodes.set(node.uid, node);
      }
      context.interfaceUtiles.userInterfaceNextTick(() => {
        for (const node of nodes) {
          node.editorHooks.callbackOnAddToEditor?.();
          node.events.onAddToEditor?.(node);
        }
        resolve();
      });
    })
  }
  /**
   * 添加连接线至当前图表中
   * @param connector 
   */
  function addConnector(connector: NodeConnectorEditor) {
    if (!connector.startPort || !connector.endPort) {
      printError(TAG, null, `addConnector: Bad connector data ${connector.uid} baceuse: startPort or endPort is null`);
      return;
    }
    if (!(connector.startPort instanceof NodePort) || !(connector.endPort instanceof NodePort)) {
      printError(TAG, null, `addConnector: Bad connector data ${connector.uid} baceuse: startPort or endPort is null`);
      return;
    }

    allConnectors.set(connector.uid, connector);
    if (currentGraph.value)
      currentGraph.value.connectors.addOnce(connector);
    connector.startPort.parent.connectors.addOnce(connector);
    connector.endPort.parent.connectors.addOnce(connector);

    //更新
    if (connector !== null) {
      connector.chunkInfo = new ChunkInstance(
        connector.updateRegion(),
        "connector",
        connector.uid
      );
      context.viewPortManager.getBaseChunkedPanel().addInstance(connector.chunkInfo);
    }
  }
  /**
   * 从当前图表中移除连接线
   * @param connector 
   */
  function removeConnector(connector: NodeConnectorEditor) {
    
    if (connector.chunkInfo) {
      context.viewPortManager.getBaseChunkedPanel().removeInstance(connector.chunkInfo);
      connector.chunkInfo = null;
    }
    const 
      start = connector.startPort,
      end = connector.endPort;
    if (start !== null) 
      start.parent.connectors.remove(connector);
    if (end !== null) 
      end.parent.connectors.remove(connector);
    if (currentGraph.value)
      currentGraph.value.connectors.remove(connector);
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
        const err = node.events.onDeleteCheck?.(node, context.graphManager.getCurrentGraph());
        if (err) {
          printWarning(
            TAG,
            null,
            `无法删除单元 ${node.define.name} ( ${node.uid}) : ${err}`
          );
          return false;
        }
      }

      //断开所有连接
      context.connectorManager.unConnectNodeConnectors(node);

      if (currentGraph.value)
        currentGraph.value.nodes.delete(node.uid);
        
      node.editorHooks.callbackOnRemoveFromEditor?.();

      //删除
      allNodes.delete(node.uid);
      switch(node.style.layer) {
        case 'normal':
          foregroundNodes.value.remove(node);
          break;
        case 'background':
          backgroundNodes.value.remove(node);
          break;
      }

      postUpMessage(NodeGraphEditorInternalMessages.NodeRemoved, { node, byUser });
    }
    return true;
  }
  /**
   * 标记当前图表已经被用户修改
   */
  function markGraphChanged() {
    if (currentGraph.value && !currentGraph.value.fileChanged) {
      currentGraph.value.fileChanged = true;
      postUpMessage(NodeGraphEditorInternalMessages.GraphChanged, toRaw(currentGraph.value));
    }
  }
  /**
   * 加载图表
   * @param graph 
   */
  function loadGraph(graph: NodeGraph) {
    return new Promise<void>((resolve, reject) => {
      closeGraph();
      currentGraph.value = graph;
      graphEndHoldCb = graph.editorHolder.hold(context);
      pushNodes(...(Array.from(graph.nodes.values()) as NodeEditor[])).then(() => {
        context.interfaceUtiles.userInterfaceNextTick(() => {
          graph.connectors.forEach((connector) => {
            addConnector(connector as NodeConnectorEditor);
            (connector as NodeConnectorEditor).updatePortValue();
            connector.setConnectionState();
            context.connectorManager.connectorSuccessSetState(connector as NodeConnectorEditor);
          });
  
          context.connectorManager.startGlobalIsolateCheck();
          resolve();
        });
      }).catch(reject);
    });
  }
  function addNodes(nodes: NodeEditor[]) {
    if (currentGraph.value) {
      pushNodes(...nodes);
      for (const node of nodes) {
        node.parent = currentGraph.value;
        currentGraph.value.nodes.set(node.uid, node);
        postUpMessage(NodeGraphEditorInternalMessages.NodeAdded, { node });
      }
    } else {
      printWarning('Graph', null, 'addNode fail: no currentGraph');
    }
  }
  function addNode(node: NodeEditor) {
    if (currentGraph.value) {
      pushNodes(node);
      node.parent = currentGraph.value;
      currentGraph.value.nodes.set(node.uid, node);
      postUpMessage(NodeGraphEditorInternalMessages.NodeAdded, { node });
    } else {
      printWarning('Graph', null, 'addNode fail: no currentGraph');
    }
  }

  function getNodeByUid(uid: string): NodeEditor|null {
    return allNodes.get(uid) || null;
  }
  function getNodePortByUid(uid: string, pguid: string): NodePortEditor|null {
    return getNodeByUid(uid)?.mapPorts.get(pguid) as NodePortEditor || null;
  }
  function getConnectorByUid(uid: string): NodeConnectorEditor|null {
    return allConnectors.get(uid) || null;
  }
  function getSubGraphByUid(uid: string): NodeGraph|null {
    if (!currentGraph.value)
      return null;
    return currentGraph.value.getChildGraphByUid(uid);
  }
  function getDocGraphByUid(uid: string): NodeGraph|null {
    if (!currentGraph.value)
      return null;
    return currentGraph.value.getParentDocunment()?.findChildGraph(uid) ?? null;
  }
  function getNodesByUids(uids: string[]): NodeEditor[] {
    return uids
      .map(p => getNodeByUid(p))
      .filter(p => p !== null) as NodeEditor[]; 
  }
  function getConnectorsByUids(connectorUids: string[]): NodeConnectorEditor[] {
    return connectorUids
      .map(p => getConnectorByUid(p))
      .filter(p => p !== null) as NodeConnectorEditor[];
  }

  /**
   * 关闭图表
   * @param graph 
   */
  function closeGraph() {
    if (currentGraph.value) {
      clearAll();
      if (graphEndHoldCb) {
        graphEndHoldCb();
        graphEndHoldCb = null;
      }
      currentGraph.value = null;
    }
  }
  /**
   * 清空编辑器内所有内容
   */
  function clearAll() {
    foregroundNodes.value.clear();
    backgroundNodes.value.clear();
    allNodes.clear();
    allConnectors.clear();
  }

  /**
   * 按标签筛选节点
   * @param tag 筛选标签
   */
  function filterNodes(tag: string) {
    if (!currentGraph.value)
      return [];
    const nodes : NodeEditor[] = [];
    for (const [,node] of currentGraph.value.nodes) {
      if (node.tags.includes(tag))
        nodes.push(node as NodeEditor);
    }
    return nodes;
  }
  /**
   * 向指定节点发送消息
   * @param node 节点
   * @param message 消息号
   * @param data 消息数据
   */
  function sendMessageToNode(node: NodeEditor, message: string|number, data: any) {
    node.events.onEditorMessage?.(node, context, { message, data });
  }
  /**
   * 向多个节点发送消息
   * @param nodes 节点数组
   * @param message 消息号
   * @param data 消息数据
   */
  function sendMessageToNodes(nodes: NodeEditor[], message: string|number, data: any) {
    nodes.forEach(node => node.events.onEditorMessage?.(node, context, { message, data }));
  }
  /**
   * 向多个已筛选的节点发送消息
   * @param tag 筛选标签
   * @param message 消息号
   * @param data 消息数据
   */
  function sendMessageToFilteredNodes(tag: string, message: string|number, data: any) {
    filterNodes(tag).forEach(node => node.events.onEditorMessage?.(node, context, { message, data }));
  }
  /**
   * 向打开的编辑器分发消息
   * @param message 消息
   * @param data 消息数据
   */
  function dispstchMessage(message: string, data: any) {
    switch (message) {
      case 'sendMessageToFilteredNodes': sendMessageToFilteredNodes(data.tag, data.message, data.data); break;
      case 'sendMessageToNode': sendMessageToNodes(data.nodes, data.message, data.data); break;
      case 'sendMessageToNodes': sendMessageToNode(data.node, data.message, data.data); break;
      case 'emitEvent': context.emitEvent(data.message, data.data); break;
      default: devWarning(TAG, null, `dispstchMessage failed: Unkown message ${message}`); break;
    }
  }
  /**
   * 向顶级编辑器分发消息
   * @param message 消息
   * @param data 消息数据
   */
  function postUpMessage(message: string, data: any) {
    onUpMessage(message, data);
  }

  context.dispstchMessage = dispstchMessage;
  context.postUpMessage = postUpMessage;
  context.getCurrentGraph = () => currentGraph.value as NodeGraph;
  context.graphManager = {
    filterNodes,
    sendMessageToNode,
    sendMessageToNodes,
    sendMessageToFilteredNodes,
    closeGraph,
    clearAll,
    getConnectors: () => allConnectors,
    getNodes: () => allNodes,
    getNodeByUid,
    getNodePortByUid,
    getConnectorByUid,
    getSubGraphByUid,
    getDocGraphByUid,
    getNodesByUids,
    getConnectorsByUids,
    removeConnector,
    addConnector,
    removeNode,
    addNodes,
    addNode,
    getCurrentGraph: () => currentGraph.value as NodeGraph,
    markGraphChanged,
  };

  return {
    loadGraph,
    pushNodes,
    allNodes,
    allConnectors,
    foregroundNodes,
    backgroundNodes,
  }
}