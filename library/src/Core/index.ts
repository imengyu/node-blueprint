import { NodeGraphCompiler, registerInternalCompilers } from "./Compiler/NodeGraphCompiler";
import { NodeRegistry } from "./Registry/NodeRegistry";
import { NodeParamTypeRegistry } from "./Type/NodeParamTypeRegistry";
import './Graph/NodeDocunment';
import './Graph/NodeGraph';
import './Graph/NodeVariable';
import './Node/Node';
import './Node/NodeConnector';
import './Node/NodePort';
import './Editor/NodeConnectorEditor';
import './Editor/NodeDocunmentEditor';
import './Editor/NodeEditor';
import './Editor/NodeGraphEditorViewport';
import './Type/NodeParamType';

export function initBase() {
  //Init Singleton
  if (!NodeParamTypeRegistry.getInstance()) new NodeParamTypeRegistry();
  if (!NodeRegistry.getInstance()) new NodeRegistry();
  if (!NodeGraphCompiler.getInstance()) new NodeGraphCompiler();
  
  //Register NodeGraphCompiler
  registerInternalCompilers();
}


