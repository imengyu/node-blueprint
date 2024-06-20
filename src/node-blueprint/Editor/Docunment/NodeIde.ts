import { inject } from "vue";
import type { NodeDocunmentEditor } from "../Graph/Flow/NodeDocunmentEditor";
import type { NodeGraphEditorContext } from "../Graph/NodeGraphEditor";
import type { NodeDocunmentEditorContext } from "./NodeDocunmentEditor";
import type { NodeEditor } from "../Graph/Flow/NodeEditor";
import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";

export interface NodeIdeControlContext {
  newDocunment() : Promise<NodeDocunmentEditor>; 
  closeDocunment(uid: string): void;
  openDocunment(doc: NodeDocunmentEditor): Promise<NodeDocunmentEditor>;
  jumpToDocunment(doc: NodeDocunmentEditor, graph?: NodeGraph, node?: NodeEditor): Promise<void>; 
  focusDebuggerPanel(): void;
  getDocunmentByUid(uid: string): NodeDocunmentEditor | undefined;
  getCurrentActiveGraphEditor(): NodeGraphEditorContext | null;
  getCurrentActiveDocunmentEditor(): NodeDocunmentEditorContext | null;
  getOtherGraphEditor(): NodeGraphEditorContext[] | null;
}

export function injectNodeGraphEditorContextInEditorOrIDE() {
  const context = inject('NodeIdeControlContext', null as unknown as NodeIdeControlContext);
  const editorContext = inject('NodeGraphEditorContext', null as unknown as NodeGraphEditorContext);

  return {
    getNodeGraphEditorContext() {
      return editorContext ? editorContext : (context.getCurrentActiveGraphEditor());
    },
    getNodeDocunmentEditorContext() {
      return context.getCurrentActiveDocunmentEditor();
    },
    getNodeIdeControlContext() {
      return context
    }
  }
}