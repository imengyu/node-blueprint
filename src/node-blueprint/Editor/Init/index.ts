import { initBase } from "@/node-blueprint/Base";
import { initLib } from "@/node-blueprint/Nodes";
import '../Graph/Editor/Flow/NodeConnectorEditor';
import '../Graph/Editor/Flow/NodeDocunmentEditor';
import '../Graph/Editor/Flow/NodeEditor';
import '../Graph/Editor/Flow/NodePortEditor';
import '../Graph/Editor/Viewport';

export function initEditor() {
  initBase();
  initLib();  
}