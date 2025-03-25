import { NodeGraphCompiler, registerInternalCompilers } from "./Compiler/NodeGraphCompiler";
import { NodeRegistry } from "./Flow/Registry/NodeRegistry";
import { NodeParamTypeRegistry } from "./Flow/Type/NodeParamTypeRegistry";
import './Flow/Graph/NodeDocunment';
import './Flow/Graph/NodeGraph';
import './Flow/Graph/NodeVariable';
import './Flow/Node/Node';
import './Flow/Node/NodeConnector';
import './Flow/Node/NodePort';
import './Flow/Type/NodeParamType';
import './Utils/Base/Rect';
import './Utils/Base/Vector2';

export function initBase() {
  //Init Singleton
  if (!NodeParamTypeRegistry.getInstance()) new NodeParamTypeRegistry();
  if (!NodeRegistry.getInstance()) new NodeRegistry();
  if (!NodeGraphCompiler.getInstance()) new NodeGraphCompiler();
  
  //Register NodeGraphCompiler
  registerInternalCompilers();
}


