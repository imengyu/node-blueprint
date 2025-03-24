import { NodeGraphCompiler, registerInternalCompilers } from "./Compiler/NodeGraphCompiler";
import { NodeRegistry } from "./Flow/Registry/NodeRegistry";
import { NodeParamTypeRegistry } from "./Flow/Type/NodeParamTypeRegistry";

export function initBase() {
  //Init Singleton
  if (!NodeParamTypeRegistry.getInstance()) new NodeParamTypeRegistry();
  if (!NodeRegistry.getInstance()) new NodeRegistry();
  if (!NodeGraphCompiler.getInstance()) new NodeGraphCompiler();
  
  //Register NodeGraphCompiler
  registerInternalCompilers();
}


