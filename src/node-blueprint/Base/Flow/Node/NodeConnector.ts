import RandomUtils from "../../Utils/RandomUtils";
import { SerializableObject } from "../../Serializable/SerializableObject";
import type { NodePort } from "./NodePort";
import ArrayUtils from "../../Utils/ArrayUtils";

/**
 * 节点链接
 */
export class NodeConnector extends SerializableObject<INodeConnectorDefine> {
  constructor(define?: INodeConnectorDefine) {
    super('NodeConnector', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
        }
      },
    });
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

  /**
   * 设置端口后，刷新端口的连接状态
   * @returns 
   */
  public setConnectionState() {
    if (this.startPort === null || this.endPort === null)
      return;
    if (this.startPort.direction === 'input') {
      ArrayUtils.addOnce(this.startPort.connectedFromPort, this);
      ArrayUtils.addOnce(this.endPort.connectedToPort, this);
    } else {
      ArrayUtils.addOnce(this.startPort.connectedToPort, this);
      ArrayUtils.addOnce(this.endPort.connectedFromPort, this);
    }
  }
}

export interface INodeConnectorDefine {
  uid : string;
  startPort : NodePort|null;
  endPort : NodePort|null;
}