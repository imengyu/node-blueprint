import { initBase } from "@/node-blueprint/Base";
import { initEditorBase } from "../Graph/Flow";
import { initLib } from "@/node-blueprint/Nodes";

export function initEditor() {
  initBase();
  initEditorBase();
  initLib();  
}