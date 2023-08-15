import { inject } from "vue";
import type { NodeDocunmentEditor } from "../Graph/Flow/NodeDocunmentEditor";
import type { NodeGraphEditorContext } from "../Graph/NodeGraphEditor";
import type { NodeDocunmentEditorContext } from "./NodeDocunmentEditor";

export interface NodeIdeControlContext {
  newDocunment() : NodeDocunmentEditor; 
  closeDocunment(uid: string): void;
  openDocunment(doc: NodeDocunmentEditor): void;
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
    getNodeIdeControlContext() {
      return context
    }
  }
}