import ArrayUtils from "../../Utils/ArrayUtils";
import { SerializableObject } from "../../Serializable/SerializableObject";
import { NodeParamType } from "../Type/NodeParamType";
import type { Node } from "./Node";
import type { NodeConnector } from "./NodeConnector";
import type { ISaveableTypes } from "../../Utils/BaseTypes";

/**
 * 节点端口
 */
export class NodePort extends SerializableObject<INodePortDefine> {

  constructor(define: INodePortDefine, parent: Node) {
    super('NodePort', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
          noSerializableProperties: [
            'guid',
            'editorState',
            'connectedFromPort',
            'connectedToPort',
            'state',
            'pos',
            'parent',
          ],
          afterLoad: () => {
            if (this.paramDefaultValue !== undefined)
              this.initialValue = this.paramDefaultValue;
          },
        },
        onlyValues: {
          serializableProperties: [
            'guid',
            'dyamicAdd',
            'initialValue'
          ],
        },
      },
    });
    this.parent = parent as Node;
    this.define = define;
  }

  /**
   * 定义
   */
  define: INodePortDefine;
  /**
   * 获取端口GUID
   */
  get guid() : string { return this.define.guid; }
  /**
   * 端口所属节点
   */
  parent: Node;
  /**
   * 端口类型
   */
  paramType: NodeParamType = NodeParamType.Any;
  /**
   * 参数默认值，在创建节点时使用
   */
  paramDefaultValue = undefined;
  /**
   * 端口方向
   */
  direction: NodePortDirection = 'input';
  /**
   * 是否是动态添加，否则为单元自带端口
   */
  dyamicAdd = false;
  /**
   * 被连接的端口
   */
  connectedFromPort: Array<NodeConnector> = [];
  /**
   * 连接至的端口
   */
  connectedToPort: Array<NodeConnector> = [];
  /**
   * 端口参数初始值，表示用户设置的在图表开始运行时，此端口的值
   */
  initialValue : unknown = null;
  /**
   * 设置是否默认连接至此节点。最好只有一个设置为true，如果有多个，先添加的为默认连接。
   */
  defaultConnectPort = false;
  /**
   * 是否引用传递参数值，默认为 false
   */
  isRefPassing = false;
  /**
   * 参数值是否为全局变量，默认为 false
   */
  isStatic = false;
  /**
   * 表名该端口是否是异步的
   */
  isAsync = false;
  /**
   * 指示这个端口是否是弹性的端口，它在连接时会触发单元的 onFlexPortConnect 事件，默认为 false
   */
  isFlexible = false;
  /**
   * 是否强制不显示编辑参数控件
   */
  forceNoEditorControl = false;
  /**
   * 是否强制在输出端口显示编辑参数控件
   */
  forceEditorControlOutput = false;
  /**
   * 强制不检查循环调用
   */
  forceNoCycleDetection = false;

  public getValue() : unknown {
    return this.initialValue;
  }
  public setValue(value: unknown) {
    //TODO: setValue
    this.initialValue = value;
  }

  /**
   * 获取是否连接至指定端口
   * @param port 指定端口
   * @returns
   */
  public isConnectToPort(port: NodePort): NodeConnector | null {
    for (let i = this.connectedToPort.length - 1; i >= 0; i--) {
      if (this.connectedToPort[i].endPort === port)
        return this.connectedToPort[i];
    }
    return null;
  }
  /**
   * 获取是否被指定端口连接
   * @param port 指定端口
   * @returns
   */
  public isConnectByPort(port: NodePort): NodeConnector | null {
    for (let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if (this.connectedFromPort[i].startPort === port)
        return this.connectedFromPort[i];
    }
    return null;
  }
  /**
   * 删除已连接至的指定端口
   * @param port 指定端口
   */
  public removeConnectToPort(port: NodePort): void {
    for (let i = this.connectedToPort.length - 1; i >= 0; i--) {
      if (this.connectedToPort[i].endPort === port) {
        ArrayUtils.remove(this.connectedToPort, this.connectedToPort[i]);
      }
    }
  }
  /**
   * 删除被指定端口连接的连接
   * @param port 指定端口
   */
  public removeConnectByPort(port: NodePort): void {
    for (let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      if (this.connectedFromPort[i].startPort === port) {
        ArrayUtils.remove(this.connectedFromPort, this.connectedFromPort[i]);
      }
    }
  }
  /**
   * 获取当前端口是否连接至任意位置
   * @returns
   */
  public isConnected(): boolean {
    if (this.direction === "input") return this.connectedFromPort.length > 0;
    else if (this.direction === "output") return this.connectedToPort.length > 0;
    return false;
  }
  /**
   * 检查目标端口参数类型是否与本端口匹配
   * @param targetPort 目标端口
   */
  public checkTypeAllow(targetPort : NodePort) : boolean {

    const targetType = targetPort.define.paramType;
    const thisType = this.paramType;

    //判断是否是执行
    if(thisType.isExecute)
      return targetType.isExecute;
    if(targetType.isExecute)
      return thisType.isExecute;

    return thisType.acceptable(targetType); 
  }
}

/**
 * 端口的方向
 *
 * * input：入端口，
 * * output：出端口
 */
export type NodePortDirection = "input" | "output";
/**
 * 状态
 */
export type NodePortState = "normal" | "active" | "error" | "success";


/**
 * 端口定义
 */
export interface INodePortDefine {
  /**
   * 端口参数类型
   */
  paramType: NodeParamType;
  /**
   * 端口参数默认值，在创建节点时使用
   */
  paramDefaultValue?: unknown,
  /**
   * 节点 的唯一ID (不能为空，数字或字符串，可以随便写，在16个字符之内)，只要保证一个单元内不能重复即可
   */
  guid: string;
  /**
   * 名称
   */
  name?: string;
  /**
   * 说明
   */
  description?: string;
  /**
   * 节点的方向
   */
  direction: NodePortDirection;
  /**
   * 设置是否默认连接至此节点。最好只有一个设置为true，如果有多个，先添加的为默认连接。
   */
  defaultConnectPort?: boolean;
  /**
   * 表名该端口是否是异步的
   */
  isAsync?: boolean;
  /**
   * 是否引用传递参数值，默认为 false
   */
  isRefPassing?: boolean;
  /**
   * 参数值是否为全局变量，默认为 false
   */
  isStatic?: boolean;
  /**
   * 指示这个端口是否是弹性的端口，它在连接时会触发单元的 onFlexPortConnect 事件，默认为 false
   */
  isFlexible?: boolean;
  /**
   * 端口参数初始值，表示用户设置的在图表开始运行时，此端口的值，默认为null
   */
  initialValue ?: ISaveableTypes|null,
  /**
   * 是否强制不显示编辑参数控件
   */
  forceNoEditorControl?: boolean;
  /**
   * 是否强制在输出端口显示编辑参数控件
   */
  forceEditorControlOutput?: boolean;
  /**
   * 强制不检查循环调用
   */
  forceNoCycleDetection?: boolean;
}
