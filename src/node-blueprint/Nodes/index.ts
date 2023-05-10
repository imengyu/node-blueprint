import { NodeRegistry } from "../Base/Flow/Registry/NodeRegistry";
import BaseNodes from "./Lib/BaseNodes";

export function initLib() {
  NodeRegistry.getInstance().registerNodePack(BaseNodes);
}