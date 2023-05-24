import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";

export interface NodeDocunmentEditorContext {
  openGraph(graph: NodeGraph) : void;
  closeGraph(graph: NodeGraph) : void;
  closeAllGraph() : void;
}