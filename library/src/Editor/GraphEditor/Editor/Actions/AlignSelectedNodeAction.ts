import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import { Vector2 } from "@/Common/Base/Vector2";
import { EditorHistoryAction } from "../History/Action";
import { updateNodeForMoveEnd } from "./Shared/Nodes";

const TAG = 'AlignSelectedNodeAction';

export type AlignNodeDirection = 'left'|'top'|'right'|'bottom'|'center-x'|'center-y';

interface AlignSelectedNodeParam {
  selectedNodes: EditorHistoryNodeInfo[],
  baseNode: EditorHistoryNodeInfo,
  align: AlignNodeDirection,
}

export class AlignSelectedNodeAction extends EditorHistoryAction<AlignSelectedNodeParam, void, void> {
  constructor(baseNode : NodeEditor, align : AlignNodeDirection) {
    super("对齐选中节点", (actionContext) => ({
      selectedNodes: actionContext.toNodesInfoAndCancelIfEmpty(actionContext.context.selectionManager.getSelectNodes()),
      baseNode: actionContext.toNodeInfo(baseNode),
      align,
    }));
  }
  protected override async onStepExecute(info: AlignSelectedNodeParam) { 
    const baseNode = info.baseNode.requestInstance();
    const baseNodeSize = baseNode.getRealSize();
    switch(info.align) {
      case 'left':
        info.selectedNodes.forEach((node) => {
          node
            .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(baseNode.position.x, oldValue.y))
            .afterChanged((b) =>  updateNodeForMoveEnd(b));
        });
        break;
      case 'top':
        info.selectedNodes.forEach((node) => {
          node
            .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(oldValue.x, baseNode.position.y))
            .afterChanged((b) =>  updateNodeForMoveEnd(b));
        });
        break;
      case 'center-x': {
        const center = baseNode.position.x + baseNodeSize.x / 2;
        info.selectedNodes.forEach((node) => {
          node
            .storeChangedProperty<Vector2>('position', (oldValue, instance) => new Vector2(center + instance.getRealSize().x / 2, oldValue.y))
            .afterChanged((b) =>  updateNodeForMoveEnd(b));
        });
        break;
      }
      case 'center-y': {
        const center = baseNode.position.y + baseNodeSize.y / 2;
        info.selectedNodes.forEach((node) => {
          node
            .storeChangedProperty<Vector2>('position', (oldValue, instance) => new Vector2(oldValue.x, center + instance.getRealSize().y / 2))
            .afterChanged((b) =>  updateNodeForMoveEnd(b));
        });
        break;
      }
      case 'right': {
        const right = baseNode.position.x + baseNodeSize.x;
        info.selectedNodes.forEach((node) => {
          node
            .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(right - baseNodeSize.x, oldValue.y))
            .afterChanged((b) =>  updateNodeForMoveEnd(b));
        });
        break;
      }
      case 'bottom': {
        const bottom = baseNode.position.y + baseNodeSize.y;
        info.selectedNodes.forEach((node) => {
          node
            .storeChangedProperty<Vector2>('position', (oldValue) => new Vector2(oldValue.x, bottom - baseNodeSize.y))
            .afterChanged((b) =>  updateNodeForMoveEnd(b));
        });
        break;
      }
    }
  }
  protected override async onStepUndo(_: void, info: AlignSelectedNodeParam) {
    info.selectedNodes.forEach((node) => node.restoreChangedProperty('position'));
  }
}