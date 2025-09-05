import type { NodePortEditor } from "@/Core/Editor/NodePortEditor";
import type { NodeConnectorEditor } from "@/Core/Editor/NodeConnectorEditor";
import type { EditorHistoryNodePortInfo, EditorHistoryNodeConnectorInfo, EditorHistoryNodeInfo } from "../History/InfoStorage";
import { EditorHistoryAction } from "../History/Action";
import { Vector2 } from "@/Common/Base/Vector2";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import { updateNodeForMoveEnd } from "./Shared/Nodes";

export class StraightenConnectorAction extends EditorHistoryAction<
{
  refPort: EditorHistoryNodePortInfo,
  connector: EditorHistoryNodeConnectorInfo,
}, EditorHistoryNodeInfo, void> {

  constructor(refPort : NodePortEditor, connector : NodeConnectorEditor) {
    super("拉直连接", (actionContext) => ({
      refPort: actionContext.toNodePortInfo(refPort),
      connector: actionContext.toNodeConnectorInfo(connector),
    }));
  }

  protected override async onStepExecute(info: { refPort: EditorHistoryNodePortInfo, connector: EditorHistoryNodeConnectorInfo }) {  
    const refPort = info.refPort.requestInstance();
    const connector = info.connector.requestInstance();

    if (!refPort || !connector)
      return;
    if(!connector.startPort || !connector.endPort)
      return;

    //获取参考位置
    const refPos = refPort.getPortPositionViewport();
    let node : NodeEditor|null = null;
    let oldPos : Vector2|null = null;

    //获取另一端的节点
    if(connector.startPort === refPort) {
      node = connector.endPort.parent;
      oldPos = (connector.endPort as NodePortEditor).getPortPositionViewport();
    }
    else if(connector.endPort === refPort)  {
      node = connector.startPort.parent;
      oldPos = (connector.startPort as NodePortEditor).getPortPositionViewport();
    }

    if(node && oldPos) {
      //设置位置
      const offPos = oldPos.y - node.position.y;

      return this.actionContext
        .toNodeInfo(node)
        .storeChangedProperty('position', new Vector2(node.position.x, refPos.y - offPos))
        .afterChanged(() =>  updateNodeForMoveEnd(node));
    }
    return;
  }

  protected override async onStepUndo(info: EditorHistoryNodeInfo) {
    info.restoreChangedProperty('position');
  }
}