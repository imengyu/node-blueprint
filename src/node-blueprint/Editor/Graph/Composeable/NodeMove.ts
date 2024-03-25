import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import type { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import type { NodeGraphEditorContext } from "../NodeGraphEditor";

const snapGridSize = 10;

export function moveNodeSolveSnap(context: NodeGraphEditorContext, node: Node, pos: Vector2) {
  //吸附最小刻度
  if (context.getSettings().snapGrid)
    pos.set(
      pos.x - pos.x % (snapGridSize - node.style.snapGridOffsetX), 
      pos.y - pos.y % (snapGridSize - node.style.snapGridOffsetY)
    );
  return pos;
}