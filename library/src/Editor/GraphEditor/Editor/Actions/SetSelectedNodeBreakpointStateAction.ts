import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import { EditorHistoryAction } from "../History/Action";
import type { NodeBreakPoint } from "@/Core/Node/Node";
import { NodeGraphEditorInternalMessages } from "../Messages/EditorInternalMessages";

const TAG = 'SetSelectedNodeBreakpointStateAction';

interface SetSelectedNodeBreakpointStateParam {
  state: NodeBreakPoint,
  nodes: EditorHistoryNodeInfo[],
}

export class SetSelectedNodeBreakpointStateAction extends EditorHistoryAction<SetSelectedNodeBreakpointStateParam, void, void> {
  constructor(state : NodeBreakPoint) {
    super("设置选中节点的断点状态", (actionContext) => ({
      state,
      nodes: actionContext.toNodesInfoAndCancelIfEmpty(
        actionContext.context.selectionManager.getSelectNodes()
      )
    }));
  }
  protected override async onStepExecute(info: SetSelectedNodeBreakpointStateParam) { 
    info.nodes.forEach((n) => n
      .storeChangedProperty('breakpoint', info.state)
      .afterChanged((node) => this.context.postUpMessage(NodeGraphEditorInternalMessages.NodeBreakpointStateChanged, { node }))
    );
  }
  protected override async onStepUndo(_: void, info: SetSelectedNodeBreakpointStateParam) {
    info.nodes.forEach((node) => node
      .restoreChangedProperty('breakpoint')
      .afterChanged((node) => this.context.postUpMessage(NodeGraphEditorInternalMessages.NodeBreakpointStateChanged, { node }))
    );
  }
}