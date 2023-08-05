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

  /**
   * 位移ID
   */
  public uid : string;
  /**
   * 输出端口 （direction == output）
   */
  public startPort : NodePort|null = null;
  /**
   * 输入端口 （direction == input）
   */
  public endPort : NodePort|null = null;
}

export interface INodeConnectorDefine {
  uid : string;
  startPort : NodePort|null;
  endPort : NodePort|null;
}