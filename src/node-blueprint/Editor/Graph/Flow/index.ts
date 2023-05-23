import type { Node, INodeDefine } from "@/node-blueprint/Base/Flow/Node/Node";
import type { INodePortDefine } from "@/node-blueprint/Base/Flow/Node/NodePort";
import type { INodeConnectorDefine } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import { CreateObjectFactory } from "@/node-blueprint/Base/Utils/Serializable/SerializableObject";
import { NodeEditor } from "./NodeEditor";
import { NodePortEditor } from "./NodePortEditor";
import { NodeConnectorEditor } from "./NodeConnectorEditor";

export function initEditorBase() {
  CreateObjectFactory.addObjectFactory('NodePortEditor', (define: INodePortDefine, parent) => new NodePortEditor(define, parent as Node));
  CreateObjectFactory.addObjectFactory('NodeEditor', (define: INodeDefine) => new NodeEditor(define));
  CreateObjectFactory.addObjectFactory('NodeConnectorEditor', (define: INodeConnectorDefine) => new NodeConnectorEditor(define));
}