import { CreateObjectFactory } from "../Utils/Serializable/SerializableObject";
import { NodeSimulateSettings, NodeStyleSettings, NodeEventSettings, Node, type INodeDefine } from "./Node/Node";
import { NodePort, type INodePortDefine } from "./Node/NodePort";

//Register CreateObject class
export function registerObjects() {
  CreateObjectFactory.addObjectFactory('NodePort', (define, parent) => new NodePort(define as INodePortDefine, parent as Node));
  CreateObjectFactory.addObjectFactory('Node', (define) => new Node(define as INodeDefine));
  CreateObjectFactory.addObjectFactory('NodeSimulateSettings', () => new NodeSimulateSettings());
  CreateObjectFactory.addObjectFactory('NodeEventSettings', () => new NodeEventSettings());
  CreateObjectFactory.addObjectFactory('NodeStyleSettings', () => new NodeStyleSettings());
}