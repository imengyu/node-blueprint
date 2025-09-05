import type { NodePortEditor } from "@/Core/Editor/NodePortEditor";
import type { EditorHistoryNodeInfo, EditorHistoryNodePortInfo } from "../History/InfoStorage";
import type { INodePortDefine } from "@/Core/Node/NodePort";
import type { INodeConnectorSaveData } from "@/Core/Graph/NodeGraph";
import { restoreConectors } from "./Shared/Connectors";
import { EditorHistoryAction } from "../History/Action";

interface DeleteDynamicPortParam {
  nodeInfo: EditorHistoryNodeInfo,
  portInfo: INodePortDefine,
  connectorsInfo: INodeConnectorSaveData[],
}

export class DeleteDynamicPortAction extends EditorHistoryAction<EditorHistoryNodePortInfo, DeleteDynamicPortParam, void> {
  constructor(port: NodePortEditor) {
    super("删除动态端口", (actionContext) => actionContext.toNodePortInfo(port));
    if (!port.dyamicAdd)
      throw new Error('The port is not a dynamic port.');
  }
  protected override async onStepExecute(info: EditorHistoryNodePortInfo) {
    const port = info.requestInstance();
    const deletedInfo : DeleteDynamicPortParam = {
      nodeInfo: this.actionContext.toNodeInfo(port.parent),
      portInfo: port.save(),
      connectorsInfo: [],
    };

    //删除端口
    const parent = port.parent;
    parent.deletePort(port);

    //删除端口所属连接线
    for (let i = parent.connectors.length - 1; i >= 0; i--) {
      const connector = parent.connectors[i];
      if (connector.startPort === port || connector.endPort === port)
        deletedInfo.connectorsInfo.push(
          this.context.connectorManager
            .unConnectConnector(connector)
            .save('graph')
        );
    }

    return deletedInfo;
  }
  protected override async onStepUndo(restoreData: DeleteDynamicPortParam) {
    const node = restoreData.nodeInfo.requestInstance();
    node.addPort(restoreData.portInfo, true);
    restoreConectors(this.context, restoreData.connectorsInfo);
  }
}