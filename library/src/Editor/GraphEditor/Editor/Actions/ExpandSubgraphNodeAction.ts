import type { NodeGraph } from "@/Core/Graph/NodeGraph";
import { EditorHistoryAction } from "../History/Action";
import type { EditorHistoryNodeGraphInfo, EditorHistoryNodeInfo } from "../History/InfoStorage";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import { printError } from "@/Common/Logger/DevLog";
import { getGraphCallNodeGraph } from "@/Nodes/Lib/BaseNodes";
import type { NodePort } from "@/Core/Node/NodePort";

const TAG = 'ExpandSubgraphNodeAction';

//TODO: 完成
export class ExpandSubgraphNodeAction extends EditorHistoryAction<EditorHistoryNodeInfo, void, void> {
  constructor(node: NodeEditor) {
    super("展开指定子图表节点", (actionContext) => actionContext.toNodeInfo(node));
  }

  protected override async onConfirmExecute() {    
    return await this.context.interfaceUtiles.userActionConfirm(
      'warning', 
      '确定展开选中的图表/函数？如果有其它节点调用此子图表，将会失去调用'
    );
  }

  /**
   * 触发展开图表
   *   添加节点到图表 ... n
   *   链接图表调用节点
   *   删除图表调用节点
   *   删除子图表 <-- 此步骤影响其他编辑器
   */

  protected async onStepExecute(inputParams: EditorHistoryNodeInfo) {

    const currentGraph = this.context.getCurrentGraph();
    const subgraph = getGraphCallNodeGraph(this.context, inputParams.requestInstance());
    if (!subgraph)  {
      printError(TAG, null, "Expand subgraph failed, Missing ExpandSubgraph");
      return;
    }

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
          printError(TAG, null, `Failed to connect ${connector.startPort.guid} to ${connector.endPort.guid} connector uid: (${connector.uid})`);
      }

      deleteNode(callNode);
    }


  }
}