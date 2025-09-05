import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import type { NodeGraphEditorContext } from "@/Editor/GraphEditor/NodeGraphEditor";
import { AddNodeAction } from "../AddNodeAction";
import BaseNodes from "@/Nodes/Lib/BaseNodes";
import type { Vector2 } from "@/Common/Base/Vector2";

export function updateNodeForMoveEnd(node: NodeEditor) {
  node.editorHooks.callbackUpdateNodeForMoveEnd?.();
}
export async function addVariableNode(context: NodeGraphEditorContext, uid: string, name: string, type: 'get'|'set', pos?: Vector2) {
  const currentGraph = context.graphManager.getCurrentGraph();
  if (currentGraph.uid !== uid)
    return null;

  const variable = currentGraph.variables.find(v => v.name === name);
  if (!variable)
    throw new Error(`Not found variable ${name}`);

  if (type === 'get') {
    return await context.runAction<NodeEditor>(new AddNodeAction(BaseNodes.getScriptBaseVariableGet(), {
      addNodeInPos: pos ?? context.mouseManager.getMouseInfo().mouseCurrentPosViewPort,
      intitalOptions: { variable: variable.name },
    }));
  } else {
    return await context.runAction<NodeEditor>(new AddNodeAction(BaseNodes.getScriptBaseVariableSet(), {
      addNodeInPos: pos ?? context.mouseManager.getMouseInfo().mouseCurrentPosViewPort,
      intitalOptions: { variable: variable.name },
    }));
  }
}