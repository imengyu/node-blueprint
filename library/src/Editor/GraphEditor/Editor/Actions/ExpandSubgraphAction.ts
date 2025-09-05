import type { NodeGraph } from "@/Core/Graph/NodeGraph";
import { EditorHistoryAction } from "../History/Action";
import type { EditorHistoryNodeGraphInfo } from "../History/InfoStorage";


//TODO: 完成
export class ExpandSubgraphAction extends EditorHistoryAction<EditorHistoryNodeGraphInfo, void, void> {
  constructor(subgraph: NodeGraph) {
    super("展开子图表", (actionContext) => actionContext.toNodeGraphInfo(subgraph));
  }
  /**
   * 触发展开图表
   *   添加节点到图表 ... n
   *   链接图表调用节点
   *   删除图表调用节点
   *   删除子图表 <-- 此步骤影响其他编辑器
   */

  protected async onStepExecute(inputParams: EditorHistoryNodeGraphInfo) {
    const currentGraph = context.graphManager.getCurrentGraph();

    currentGraph.children.push(...subgraph.children);
    currentGraph.children.remove(subgraph);

    const callNodes = context.graphManager.filterNodes(`GraphCall${subgraph.name}`);
    for (const callNode of callNodes) {
      const callPos = callNode.position;
      const copyNodeUidMapping = new Map<string, string>();
      const filteredNodeArray : NodeEditor[] = [];

      for (const node of subgraph.nodes.values()) {
        if (!node.isGraphInOutNode)
          filteredNodeArray.push(node as NodeEditor);
      }

      const region = context.viewPortManager.calcNodesRegion(filteredNodeArray);

      for (const node of filteredNodeArray) {
        if (!node.isGraphInOutNode) {
          const newNode = await this.addNode(node.define, {
            addNodeInPos: node.position.clone().substract(region.getPoint()).add(callPos),
            intitalOptions: node.options,
          });
          if (newNode)
            copyNodeUidMapping.set(node.uid, newNode.uid);
        }
      }
      for (const connector of subgraph.connectors) {
        if (!connector.startPort || !connector.endPort)
          continue;

        const startNodeUid = copyNodeUidMapping.get(connector.startPort.parent.uid);
        const endNodeUid = copyNodeUidMapping.get(connector.endPort.parent.uid);
        const startNode = startNodeUid ? currentGraph.nodes.get(startNodeUid) : undefined;
        const endNode = endNodeUid ? currentGraph.nodes.get(endNodeUid) : undefined;
        let startPort: NodePort|null = null;
        let endPort: NodePort|null = null;

        if (connector.startPort.parent.isGraphInOutNode) {
          //链接入节点
          const callerPort = callNode.getPortByGUID(connector.startPort.guid);
          startPort = callerPort ? callerPort.connectedFromPort[0].startPort : null;
          endPort = endNode?.getPortByGUID(connector.endPort.guid) ?? null;
        }
        else if(connector.endPort.parent.isGraphInOutNode) {
          //链接出节点
          const callerPort = callNode.getPortByGUID(connector.endPort.guid);
          startPort = startNode?.getPortByGUID(connector.startPort.guid) ?? null;
          endPort = callerPort ? callerPort.connectedToPort[0].endPort : null;
        }
        else {
          startPort = startNode?.getPortByGUID(connector.startPort.guid) ?? null;
          endPort = endNode?.getPortByGUID(connector.endPort.guid) ?? null;
        }
        
        if (startPort && endPort)
          context.connectorManager.connectConnector(startPort as NodePortEditor, endPort as NodePortEditor);
        else
          printError(TAG, null, `expandSubgraph: Failed to connect ${connector.startPort.guid} to ${connector.endPort.guid} connector uid: (${connector.uid})`);
      }

      deleteNode(callNode);
    }


  }
}