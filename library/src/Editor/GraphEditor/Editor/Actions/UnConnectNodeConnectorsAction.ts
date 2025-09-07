import type { INodeConnectorSaveData } from "@/Core/Graph/NodeGraph";
import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import { EditorHistoryAction } from "../History/Action";
import { restoreConectors } from "./Shared/Connectors";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";

export class UnConnectNodeConnectorsAction extends EditorHistoryAction<EditorHistoryNodeInfo, INodeConnectorSaveData[], void> {
  constructor(node: NodeEditor) {
    super("删除节点的连接线", 
      (actionContext) => actionContext.toNodeInfo(node)
    );
  }
  protected override async onStepExecute(info: EditorHistoryNodeInfo) { 
    const node = info.requestInstance();
    const deletedConnectors : INodeConnectorSaveData[] = [];
    deletedConnectors.push(
      ...this.context.connectorManager
        .unConnectNodeConnectors(node)
        .map(p => p.save('graph')) as INodeConnectorSaveData[]
    );
    return deletedConnectors;
  }
  protected override async onStepUndo(restoreData: INodeConnectorSaveData[]) {
    restoreConectors(this.context, restoreData);
  }
}