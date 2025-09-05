import type { INodeConnectorSaveData } from "@/Core/Graph/NodeGraph";
import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import { EditorHistoryAction } from "../History/Action";
import { restoreConectors } from "./Shared/Connectors";

export class UnConnectSelectedNodeConnectorsAction extends EditorHistoryAction<EditorHistoryNodeInfo[], INodeConnectorSaveData[], void> {
  constructor() {
    super("删除选中的连接线", 
      (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(
        actionContext.context.selectionManager.getSelectNodes()
      )
    );
  }
  protected override async onStepExecute(info: EditorHistoryNodeInfo[]) { 
    const nodes = this.actionContext.fromNodesInfo(info);
    const deletedConnectors : INodeConnectorSaveData[] = [];

    //取消选中单元的所有连接线
    nodes.forEach((node) => 
      deletedConnectors.push(
        ...this.context.connectorManager
          .unConnectNodeConnectors(node)
          .map(p => p.save('graph')) as INodeConnectorSaveData[]
      )
    );
    return deletedConnectors;
  }
  protected override async onStepUndo(restoreData: INodeConnectorSaveData[]) {
    restoreConectors(this.context, restoreData);
  }
}