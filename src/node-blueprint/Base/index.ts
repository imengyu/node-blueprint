import { Node, NodeEventSettings, NodeStyleSettings, type INodeDefine } from "./Flow/Node/Node";
import { NodePort, type INodePortDefine } from "./Flow/Node/NodePort";
import { NodeRegistry } from "./Flow/Registry/NodeRegistry";
import { NodeParamTypeRegistry } from "./Flow/Type/NodeParamTypeRegistry";
import { CreateObjectFactory } from "./Utils/Serializable/SerializableObject";

export function initBase() {
  
  //Init Singleton
  if (!NodeParamTypeRegistry.getInstance()) new NodeParamTypeRegistry();
  if (!NodeRegistry.getInstance()) new NodeRegistry();
       

  //Register CreateObject class
  CreateObjectFactory.addObjectFactory('NodePort', (define, parent) => new NodePort(define as INodePortDefine, parent as Node));
  CreateObjectFactory.addObjectFactory('Node', (define) => new Node(define as INodeDefine));
  CreateObjectFactory.addObjectFactory('NodeEventSettings', () => new NodeEventSettings());
  CreateObjectFactory.addObjectFactory('NodeStyleSettings', () => new NodeStyleSettings());
}


