import { NodeGraphCompiler } from "../Base/Compiler/NodeGraphCompiler";
import { NodeRegistry } from "../Base/Flow/Registry/NodeRegistry";
import { LibJsCompilerData } from "./Compiler/LibJs/LibJs";
import BaseNodes from "./Lib/BaseNodes";
import ControlNodees from "./Lib/ControlNodes";
import LogicNodes from "./Lib/LogicNodes";
import OperatorNodes from "./Lib/OperatorNodes";
import PreprocessorNodees from "./Lib/PreprocessorNodes";

export function initLib() {
  NodeRegistry.getInstance().registerNodePack(BaseNodes);
  NodeRegistry.getInstance().registerNodePack(OperatorNodes);
  NodeRegistry.getInstance().registerNodePack(PreprocessorNodees);
  NodeRegistry.getInstance().registerNodePack(ControlNodees);
  NodeRegistry.getInstance().registerNodePack(LogicNodes);
  NodeGraphCompiler.getInstance().registerCompilePackage(LibJsCompilerData);
}