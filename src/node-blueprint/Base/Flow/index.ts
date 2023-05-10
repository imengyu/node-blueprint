import { CreateObjectFactory } from "../Utils/Serializable/SerializableObject";
import { NodeSimulateSettings, NodeStyleSettings, NodeEventSettings, Node, type INodeDefine, type INodeSimulateSettings, type INodeEventSettings, type INodeStyleSettings } from "./Node/Node";
import { NodePort, type INodePortDefine } from "./Node/NodePort";

//Register CreateObject class
export function registerObjects() {
  CreateObjectFactory.addObjectFactory('NodePort', (define, parent) => new NodePort(define as INodePortDefine, parent as Node));
  CreateObjectFactory.addObjectFactory('Node', (define) => new Node(define as INodeDefine));
  CreateObjectFactory.addObjectFactory('NodeSimulateSettings', (define) => new NodeSimulateSettings(define as INodeSimulateSettings));
  CreateObjectFactory.addObjectFactory('NodeEventSettings', (define) => new NodeEventSettings(define as INodeEventSettings));
  CreateObjectFactory.addObjectFactory('NodeStyleSettings', (define) => new NodeStyleSettings(define as INodeStyleSettings));
}