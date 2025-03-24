import RandomUtils from "../../Utils/RandomUtils";
import { SerializableObject } from "../../Serializable/SerializableObject";
import type { NodePort } from "./NodePort";
import ArrayUtils from "../../Utils/ArrayUtils";
import { CreateObjectFactory, SerializableFactory } from "../../Serializable/SerializableFactory";

/**
 * 节点链接
 */
export class NodeConnector extends SerializableObject<INodeConnectorDefine> {

  static TAG = 'NodeConnector';

  static() {
    CreateObjectFactory.addObjectFactory(NodeConnector.TAG, (define: INodeConnectorDefine) => new NodeConnector(define));
    SerializableFactory.addSerializableObjectConfig(NodeConnector.TAG, {
      serializeSchemes: {
        default: {
          serializeAll: true,
        },
        graph: {
          serializeAll: false,
          serializableProperties: [
            "uid", "startPort", "endPort",
          ],
          saveProp(key, parentKey, source) {
            if (key === "startPort" || key === "endPort") {
              const port = source as NodePort;
              return {
                parsed: true,
                return: {
                  nodeUid: port?.parent?.uid,
                  portUid: port?.guid,
                }
              }
            }
            return undefined;
          },
        },
      },
    })
  }

  constructor(define?: INodeConnectorDefine) {
    super(NodeConnector.TAG, define, NodeConnector.TAG);
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