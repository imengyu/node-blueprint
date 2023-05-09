import { NodeRegistry } from "../Base/Flow/Registry/NodeRegistry";
import BaseBlocks from "./Lib/BaseBlocks";

export function initLib() {
  NodeRegistry.getInstance().registerNodePack(BaseBlocks);
}