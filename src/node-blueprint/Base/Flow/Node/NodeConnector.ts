import RandomUtils from "../../Utils/RandomUtils";
import type { NodePort } from "./NodePort";

/**
 * 节点链接
 */
export class NodeConnector {
  constructor() {
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
  }

  public uid : string;
  public startPort : NodePort|null = null;
  public endPort : NodePort|null = null;
}