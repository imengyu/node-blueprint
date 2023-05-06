import type { Node, INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import type { INodePortDefine } from "@/node-blueprint/Base/Flow/Node/NodePort";
import { CreateObjectFactory } from "@/node-blueprint/Base/Utils/Serializable/SerializableObject";
import { NodeEditor } from "./NodeEditor";
import { NodePortEditor } from "./NodePortEditor";

export function initEditorBase() {
  CreateObjectFactory.addObjectFactory('NodePortEditor', (define, parent) => new NodePortEditor(define as INodePortDefine, parent as Node));
  CreateObjectFactory.addObjectFactory('NodeEditor', (define) => new NodeEditor(define as INodeDefine));
}