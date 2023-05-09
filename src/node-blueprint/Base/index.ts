import { registerObjects } from "./Flow";
import { NodeRegistry } from "./Flow/Registry/NodeRegistry";
import { NodeParamTypeRegistry } from "./Flow/Type/NodeParamTypeRegistry";

export function initBase() {
  //Init Singleton
  if (!NodeParamTypeRegistry.getInstance()) new NodeParamTypeRegistry();
  if (!NodeRegistry.getInstance()) new NodeRegistry();
  
  //Register CreateObject class
  registerObjects();
}


