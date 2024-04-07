import { NodeRegistry } from "../Base/Flow/Registry/NodeRegistry";
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
}