
import { ref, toRaw } from "vue";
import { ChunkInstance } from "../Cast/ChunkedPanel";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { NodePort } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeEditor } from "../Flow/NodeEditor";
import { devWarning, printError, printWarning } from "@/node-blueprint/Base/Logger/DevLog";
import { NodeGraphEditorInternalMessages } from "../Meaasges/EditorInternalMessages";

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
              printError(TAG, `Faild to add node: ${node.name} UID: ${node.uid} (${node.guid}) because: too many nodes in frame (>${MAX_NODES_PER_FRAME})`);
            else
              foregroundNodes.value.push(node);
            break;
          case 'background':
            if (backgroundNodes.value.length > MAX_NODES_PER_FRAME)
              printError(TAG, `Faild to add node: ${node.name} UID: ${node.uid} (${node.guid}) because: too many nodes in frame (>${MAX_NODES_PER_FRAME})`);
            else
              backgroundNodes.value.push(node);
            break;
          default:
            printError(TAG, `Faild to add node: ${node.name} UID: ${node.uid} (${node.guid}) because: bad style.layer: ${node.style.layer}`);
            break;
        }        
        allNodes.set(node.uid, node);
      }
      context.userInterfaceNextTick(() => {
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
      printError(TAG, `addConnector: Bad connector data ${connector.uid} baceuse: startPort or endPort is null`);
      return;
    }
    if (!(connector.startPort instanceof NodePort) || !(connector.endPort instanceof NodePort)) {
      printError(TAG, `addConnector: Bad connector data ${connector.uid} baceuse: startPort or endPort is null`);
      return;
    }

    allConnectors.set(connector.uid, connector);
    if (currentGraph.value)
      ArrayUtils.addOnce(currentGraph.value.connectors, connector);
    ArrayUtils.addOnce((connector.startPort.parent as NodeEditor).connectors, connector);
    ArrayUtils.addOnce((connector.endPort.parent as NodeEditor).connectors, connector);

    //更新
    if (connector !== null) {
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
    if (start !== null) 
      ArrayUtils.remove((start.parent as NodeEditor).connectors, connector);
    if (end !== null) 
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

      //断开所有连接
      context.unConnectNodeConnectors(node);

      if (currentGraph.value)
        currentGraph.value.nodes.delete(node.uid);
        
      node.editorHooks.callbackOnRemoveFromEditor?.();

      //删除
      allNodes.delete(node.uid);
      switch(node.style.layer) {
        case 'normal':
          ArrayUtils.remove(foregroundNodes.value, node);
          break;
        case 'background':
          ArrayUtils.remove(backgroundNodes.value, node);
          break;
      }

      context.postUpMessage(NodeGraphEditorInternalMessages.NodeRemoved, { node, byUser });
    }
    return true;
  }
  /**
   * 标记当前图表已经被用户修改
   */
  function markGraphChanged() {
    if (currentGraph.value)
      currentGraph.value.fileChanged = true;
    postUpMessage(NodeGraphEditorInternalMessages.GraphChanged, toRaw(currentGraph.value));
  }
  /**
   * 加载图表
   * @param graph 
   */
  function loadGraph(graph: NodeGraph) {
    return new Promise<void>((resolve, reject) => {
      closeGraph();
      currentGraph.value = graph;
      graph.activeEditor = context;
      pushNodes(...(Array.from(graph.nodes.values()) as NodeEditor[])).then(() => {
        context.userInterfaceNextTick(() => {
          graph.connectors.forEach((connector) => {
            addConnector(connector as NodeConnectorEditor);
            (connector as NodeConnectorEditor).updatePortValue();
            connector.setConnectionState();
            context.connectorSuccessSetState(connector as NodeConnectorEditor);
          });
  
          context.startGlobalIsolateCheck();
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
        context.postUpMessage(NodeGraphEditorInternalMessages.NodeAdded, { node });
      }
    } else {
      printWarning('Graph', 'addNode fail: no currentGraph');
    }
  }
  function addNode(node: NodeEditor) {
    if (currentGraph.value) {
      pushNodes(node);
      node.parent = currentGraph.value;
      currentGraph.value.nodes.set(node.uid, node);
      context.postUpMessage(NodeGraphEditorInternalMessages.NodeAdded, { node });
    } else {
      printWarning('Graph', 'addNode fail: no currentGraph');
    }
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
      default: devWarning(TAG, `dispstchMessage failed: Unkown message ${message}`); break;
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

  context.filterNodes = filterNodes;
  context.sendMessageToNode = sendMessageToNode;
  context.sendMessageToNodes = sendMessageToNodes;
  context.sendMessageToFilteredNodes = sendMessageToFilteredNodes;
  context.dispstchMessage = dispstchMessage;
  context.postUpMessage = postUpMessage;

  context.closeGraph = closeGraph;
  context.clearAll = clearAll;
  context.getConnectors = () => allConnectors;
  context.getNodes = () => allNodes;
  context.removeConnector = removeConnector;
  context.addConnector = addConnector;
  context.removeNode = removeNode;
  context.addNodes = addNodes;
  context.addNode = addNode;
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