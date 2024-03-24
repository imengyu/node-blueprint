import { NodeRegistry } from "../Base/Flow/Registry/NodeRegistry";
import BaseNodes from "./Lib/BaseNodes";
import OperatorNodes from "./Lib/OperatorNodes";

export function initLib() {
  NodeRegistry.getInstance().registerNodePack(BaseNodes);
  NodeRegistry.getInstance().registerNodePack(OperatorNodes);
}