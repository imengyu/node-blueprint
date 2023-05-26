import { CreateObjectFactory } from "../Serializable/SerializableObject";
import type { NodeDocunment } from "./Graph/NodeDocunment";
import { NodeGraph, type INodeGraphDefine } from "./Graph/NodeGraph";
import { NodeSimulateSettings, NodeStyleSettings, NodeEventSettings, Node, type INodeDefine, type INodeSimulateSettings, type INodeEventSettings, type INodeStyleSettings } from "./Node/Node";
import { NodeConnector, type INodeConnectorDefine } from "./Node/NodeConnector";
import { NodePort, type INodePortDefine } from "./Node/NodePort";

//Register CreateObject class
export function registerObjects() {
  CreateObjectFactory.addObjectFactory('Node', (define: INodeDefine) => new Node(define));
  CreateObjectFactory.addObjectFactory('NodePort', (define: INodePortDefine, parent) => new NodePort(define, parent as Node));
  CreateObjectFactory.addObjectFactory('NodeConnector', (define: INodeConnectorDefine) => new NodeConnector(define));
  CreateObjectFactory.addObjectFactory('NodeSimulateSettings', (define: INodeSimulateSettings) => new NodeSimulateSettings(define));
  CreateObjectFactory.addObjectFactory('NodeEventSettings', (define: INodeEventSettings) => new NodeEventSettings(define));
  CreateObjectFactory.addObjectFactory('NodeStyleSettings', (define: INodeStyleSettings) => new NodeStyleSettings(define));
  CreateObjectFactory.addObjectFactory('NodeGraph', (define: INodeGraphDefine, parent) => new NodeGraph(define, parent as NodeDocunment, false));
  CreateObjectFactory.addObjectFactory('NodeGraphEditor', (define: INodeGraphDefine, parent) => new NodeGraph(define, parent as NodeDocunment, true));
}