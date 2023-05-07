import type { INodeDefine, Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref } from "vue";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import type { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import { NodeEditor } from "../Flow/NodeEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { ChunkInstance } from "../Cast/ChunkedPanel";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodePortEditor } from "../Flow/NodePortEditor";

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

  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  userAddNode(define: INodeDefine, addNodeInPos?: Vector2|undefined) : void;
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
  const currentGraph = ref<NodeGraph|null>(null);

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

  /**
   * 用户添加单元
   * @param define 单元定义
   * @param addNodeInPos 添加之后设置单元的位置，如果不提供，则默认设置到视口中心位置
   */
  function userAddNode(define: INodeDefine, addNodeInPos?: Vector2|undefined) {
    //TODO: 检查单元是否只能有一个
    // if(define.settings.oneNodeOnly && currentGraph?.getNodesByGUID(define.guid).length > 0) {      
    //   DebugWorkProviderInstance.ModalProvider('warning', '提示', '当前文档中已经有 ' + blockData.baseInfo.name + ' 了，此单元只能有一个', () => {});
    //   return;
    // }
    //自定义检查回调
    // if(typeof blockData.callbacks.onAddCheck == 'function') {
    //   let err = blockData.callbacks.onAddCheck(blockData, this.currentGraph);
    //   if(err != null) {
    //     DebugWorkProviderInstance.ModalProvider('warning', '提示', err, () => {});
    //     return;
    //   }
    // }

    let newNode = new NodeEditor(define);
    if(addNodeInPos) { //在指定位置添加单元
      newNode.position = addNodeInPos;
      pushNodes(newNode)
    } 
    else { //在屏幕中央位置添加单元
      const center = context.getViewPort().rect().calcCenter();
      newNode.position = center;
      pushNodes(newNode);
    }

    if(context.isConnectToNew()) { //添加单元并连接
      const connectingEndPos = context.getConnectingInfo().endPos;
      newNode.position = connectingEndPos;
      pushNodes(newNode);

      setTimeout(() => {
        //重新定位单元位置至连接线末端位置
        let port = context.endConnectToNew(newNode);
        let pos = new Vector2();
        pos.set((port as NodePortEditor).getPortPositionViewport());
        pos.x = connectingEndPos.x - (pos.x - newNode.position.x);
        pos.y = connectingEndPos.y - (pos.y - newNode.position.y);
        newNode.position.set(pos);
      }, 100);
    } 
  }

  context.getConnectors = () => allConnectors;
  context.getNodes = () => allNodes;
  context.removeConnector = removeConnector;
  context.addConnector = addConnector;
  context.userAddNode = userAddNode;

  return {
    pushNodes,
    allNodes,
    allConnectors,
    foregroundNodes,
    backgroundNodes,
  }
}