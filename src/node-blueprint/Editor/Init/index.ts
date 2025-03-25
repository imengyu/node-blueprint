import { initBase } from "@/node-blueprint/Base";
import { initLib } from "@/node-blueprint/Nodes";
import '../Graph/Node/Flow/NodeConnectorEditor';
import '../Graph/Node/Flow/NodeDocunmentEditor';
import '../Graph/Node/Flow/NodeEditor';
import '../Graph/Node/Flow/NodePortEditor';
import '../Graph/Editor/Viewport';

export function initEditor() {
  initBase();
  initLib();  
}