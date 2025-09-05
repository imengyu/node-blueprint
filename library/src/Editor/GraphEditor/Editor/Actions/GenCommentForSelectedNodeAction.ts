import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import { Vector2 } from "@/Common/Base/Vector2";
import { EditorHistoryAction } from "../History/Action";
import { updateNodeForMoveEnd } from "./Shared/Nodes";
import { AddNodeAction } from "./AddNodeAction";
import BaseNodes from "@/Nodes/Lib/BaseNodes";

const TAG = 'GenCommentForSelectedNodeAction';

export class GenCommentForSelectedNodeAction extends EditorHistoryAction<EditorHistoryNodeInfo[], EditorHistoryNodeInfo, void> {
  constructor() {
    super("对齐选中节点", (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(actionContext.context.selectionManager.getSelectNodes()));
  }

  protected override async onStepExecute(info: EditorHistoryNodeInfo[]) { 
    //计算选中节点的矩形，并创建注释节点
    const selectedNodes = this.actionContext.fromNodesInfo(info);
    const rect = this.context.viewPortManager.calcNodesRegion(selectedNodes);

    this.actionContext.beginNoUndoableRegion();

    const node = await this.context.historyManager.runAction(
      new AddNodeAction(
        BaseNodes.getScriptBaseCommentNode(), {
        //设置位置
        addNodeInPos: new Vector2(rect.x - 15, rect.y - 15 - 50)
      })
    );

    this.actionContext.endNoUndoableRegion();

    if (!node)
      return;

    //调整大小为矩形大小
    node.customSize.set(rect.w + 30, rect.h + 30 + 50);
    return this.actionContext.toNodeInfo(node);
  }
  protected override async onStepUndo(restoreData: EditorHistoryNodeInfo) {
    const node = restoreData.requestInstance();
    if (node.define.canNotDelete) 
      return;
    this.context.graphManager.removeNode(node, true);
  }
}