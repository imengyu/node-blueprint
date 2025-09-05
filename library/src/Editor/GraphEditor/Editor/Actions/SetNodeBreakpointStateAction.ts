import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import type { NodeBreakPoint } from "@/Core/Node/Node";
import { EditorHistoryAction } from "../History/Action";
import { NodeGraphEditorInternalMessages } from "../Messages/EditorInternalMessages";

const TAG = 'SetNodeBreakpointStateAction';

interface SetSelectedNodeBreakpointStateParam {
  state: NodeBreakPoint,
  node: EditorHistoryNodeInfo,
}

export class SetNodeBreakpointStateAction extends EditorHistoryAction<SetSelectedNodeBreakpointStateParam, void, void> {
  constructor(node: NodeEditor, state : NodeBreakPoint) {
    super("设置节点的断点状态", (actionContext) => ({
      state,
      node: actionContext.toNodeInfo(node)
    }));
  }
  protected override async onStepExecute(info: SetSelectedNodeBreakpointStateParam) { 
    info.node
      .storeChangedProperty('breakpoint', info.state)
      .afterChanged((node) => this.context.postUpMessage(NodeGraphEditorInternalMessages.NodeBreakpointStateChanged, { node }));
  }
  protected override async onStepUndo(_: void, info: SetSelectedNodeBreakpointStateParam) {
    info.node
      .restoreChangedProperty('breakpoint')
      .afterChanged((node) => this.context.postUpMessage(NodeGraphEditorInternalMessages.NodeBreakpointStateChanged, { node }));
  }
}