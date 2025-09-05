import type { INodeSaveData } from "@/Core/Graph/NodeGraph";
import { EditorHistoryAction } from "../History/Action";
import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import { NodeRegistry } from "@/Core/Registry/NodeRegistry";
import { AddNodeAction } from "./AddNodeAction";
import { printWarning } from "@/Common/Logger/DevLog";

const TAG = 'DeleteSelectedNodesAction';

export class DeleteSelectedNodesAction extends EditorHistoryAction<EditorHistoryNodeInfo[], INodeSaveData[], void> {
  constructor() {
    super("删除选中节点", (actionContext) => actionContext.toNodesInfoAndCancelIfEmpty(
      actionContext.context.selectionManager.getSelectNodes()
    ));
  }
  protected override async onStepExecute(info: EditorHistoryNodeInfo[]) { 
    const nodes = this.actionContext.fromNodesInfo(info);
    const deletedNodes : INodeSaveData[] = [];
    //删除选中单元
    for (const node of nodes) {
      if (node.define.canNotDelete) 
        continue;
      if (this.context.graphManager.removeNode(node, true))
        deletedNodes.push({
          uid: node.uid,
          guid: node.guid,
          node: node.save('graph')
        });
    }
    this.context.selectionManager.unSelectAllNodes();
    return deletedNodes;
  }
  protected override async onStepUndo(restoreData: INodeSaveData[]) {
    const registry = NodeRegistry.getInstance();
    for (const node of restoreData) {
      const define = registry.getNodeByGUID(node.guid);
      if (!define) {
        printWarning(TAG, null, 'Failed to undo create node, missing node define ' + node.guid);
        continue;
      }
      await this.context.historyManager.runAction(new AddNodeAction(define, {
        noErrorAlert: true,
        intitalShadow: node.node,
        reuseUid: node.uid,
      }));
    }
  }
}