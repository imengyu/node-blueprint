import type { INodeConnectorSaveData } from "@/Core/Graph/NodeGraph";
import type { EditorHistoryNodeConnectorInfo } from "../History/InfoStorage";
import { EditorHistoryAction } from "../History/Action";
import { restoreConectors } from "./Shared/Connectors";

export class DeleteSelectedConnectorsAction extends EditorHistoryAction<EditorHistoryNodeConnectorInfo[], INodeConnectorSaveData[], void> {
  constructor() {
    super("删除选中的连接线", (actionContext) => actionContext.toNodeConnectorsInfoAndCancelIfEmpty(
      actionContext.context.selectionManager.getSelectConnectors()
    ));
  }
  protected override async onStepExecute(info: EditorHistoryNodeConnectorInfo[]) { 
    const connectors = this.actionContext.fromNodeConnectorsInfo(info);
    connectors.forEach((c) => this.context.connectorManager.unConnectConnector(c));
    return connectors.map(p => p.save('graph')) as INodeConnectorSaveData[];
  }
  protected override async onStepUndo(restoreData: INodeConnectorSaveData[]) {
    restoreConectors(this.context, restoreData);
  }
}