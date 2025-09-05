import type { INodeConnectorSaveData } from "@/Core/Graph/NodeGraph";
import type { NodeGraphEditorInternalContext } from "@/Editor/GraphEditor/NodeGraphEditor";

//重做步骤重做相关连接线
export function restoreConectors(context: NodeGraphEditorInternalContext, restoreData: INodeConnectorSaveData[]) {
  for (const connector of restoreData) {
    const startPortInstance = context.graphManager.getNodePortByUid(connector.startPort.nodeUid, connector.startPort.portUid);
    const endPortInstance = context.graphManager.getNodePortByUid(connector.endPort.nodeUid, connector.endPort.portUid);
    if (!startPortInstance || !endPortInstance)
      continue;
    context.connectorManager.connectConnector(startPortInstance, endPortInstance, connector.uid);
  }
}