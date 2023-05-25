import type { NodeDocunmentEditor } from "../Graph/Flow/NodeDocunmentEditor";
import type { NodeGraphEditorContext } from "../Graph/NodeGraphEditor";

export interface NodeIdeControlContext {
  newDocunment() : NodeDocunmentEditor; 
  closeDocunment(uid: string): void;
  openDocunment(doc: NodeDocunmentEditor): void;
  getDocunmentByUid(uid: string): NodeDocunmentEditor | undefined;
  getCurrentActiveGraphEditor(): NodeGraphEditorContext | null;
}