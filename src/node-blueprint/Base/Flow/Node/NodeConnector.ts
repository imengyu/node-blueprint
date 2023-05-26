import RandomUtils from "../../Utils/RandomUtils";
import { SerializableObject } from "../../Serializable/SerializableObject";
import type { NodePort } from "./NodePort";

/**
 * 节点链接
 */
export class NodeConnector extends SerializableObject<INodeConnectorDefine> {
  constructor(define?: INodeConnectorDefine) {
    super('NodeConnector', define);
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
  }

  public uid : string;
  public startPort : NodePort|null = null;
  public endPort : NodePort|null = null;
}

export interface INodeConnectorDefine {
  uid : string;
  startPort : NodePort|null;
  endPort : NodePort|null;
}