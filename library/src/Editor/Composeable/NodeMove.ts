import type { Node } from "@/Core/Node/Node";
import type { Vector2 } from "@/Common/Base/Vector2";
import type { NodeGraphEditorContext } from "../GraphEditor/NodeGraphEditor";

export function moveNodeSolveSnap(context: NodeGraphEditorContext, node: Node, pos: Vector2) {
  const settings = context.getSettings();
  const snapGridSize = settings.snapGridSize || 4;
  //吸附最小刻度
  if (settings.snapGrid)
    pos.set(
      pos.x - pos.x % (snapGridSize - node.style.snapGridOffsetX), 
      pos.y - pos.y % (snapGridSize - node.style.snapGridOffsetY)
    );
  return pos;
}