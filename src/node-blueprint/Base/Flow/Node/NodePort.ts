import ArrayUtils from "../../Utils/ArrayUtils";
import { SerializableObject } from "../../Serializable/SerializableObject";
import { NodeParamType } from "../Type/NodeParamType";
import type { Node } from "./Node";
import type { NodeConnector } from "./NodeConnector";
import type { ISaveableTypes } from "../../Utils/BaseTypes";

/**
 * 节点端口
 */
export class NodePort extends SerializableObject<INodePortDefine, Node> {

  constructor(define: INodePortDefine, parent: Node) {
    super('NodePort', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
          noSerializableProperties: [ 
            'editorState',
            'connectedFromPort',
            'connectedToPort',
            'state',
            'pos',
            'parent',
          ],
          forceSerializableClassProperties: {
            style: 'NodePortStyle',
          },
          afterLoad: () => {
            if (this.paramDefaultValue !== undefined)
              this.initialValue = this.paramDefaultValue;
          },
        },
        onlyValues: {
          serializableProperties: [
            'guid',
            'name',
            'description',
            'guid',
            'dyamicAdd',
            'initialValue',
            'paramType',
          ],
        },
      },
    });
    this.parent = parent as Node;
    this.define = define;
    this.guid = define.guid;
  }

  /**
   * 定义
   */
  readonly define: INodePortDefine;
  /**
   * 获取端口GUID
   */
  readonly guid : string;
  /**
   * 名称
   */
  name = '';
  /**
   * 说明
   */
  description = '';
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
  paramDefaultValue : ISaveableTypes|undefined = undefined;
  /**
   * 端口方向
   */
  direction: NodePortDirection = 'input';
  /**
   * 是否是动态添加，否则为单元自带端口
   */
  dyamicAdd = false;
  /**
   * 被连接的端口，仅 direction == input 时有效
   */
  connectedFromPort: Array<NodeConnector> = [];
  /**
   * 连接至的端口，仅 direction == output 时有效
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
   * 指示这个端口是否是弹性的端口，默认为 false
   */
  isFlexible : NodePortFlex = false;
  /**
   * 端口样式
   */
  style = new NodePortStyle({});

  public getValue() : unknown {
    return this.initialValue;
  }
  public setValue(value: unknown) {
    this.initialValue = value;
  }

  /**
   * 获取是否连接至指定节点
   * @param node 指定节点
   * @param portGuid 指定连接对应的端口GUID
   * @returns
   */
  public isConnectToNode(node: Node, portGuid?: string): NodeConnector | null {
    for (let i = this.connectedToPort.length - 1; i >= 0; i--) {
      const port = this.connectedToPort[i].endPort;
      if (port?.parent === node && (!portGuid || portGuid === port.guid))
        return this.connectedToPort[i];
    }
    return null;
  }
  /**
   * 获取是否被指定节点连接
   * @param node 指定节点
   * @param portGuid 指定连接对应的端口GUID
   * @returns
   */
  public isConnectByNode(node: Node, portGuid?: string): NodeConnector | null {
    for (let i = this.connectedFromPort.length - 1; i >= 0; i--) {
      const port = this.connectedFromPort[i].startPort;
      if (port?.parent === node && (!portGuid || portGuid === port.guid))
        return this.connectedFromPort[i];
    }
    return null;
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
   * 检查目标端口参数类型是否与本端口匹配
   * @param targetPort 目标端口
   */
  public checkTypeAllow(targetPort : NodePort) : boolean {

    const targetType = targetPort.paramType;
    const thisType = this.paramType;

    //判断是否是执行
    if(thisType.isExecute)
      return targetType.isExecute;
    if(targetType.isExecute)
      return thisType.isExecute;

    return thisType.acceptable(targetType); 
  }

  /**
   * 获取当前端口是否连接至任意位置
   * @returns
   */
  public get isConnected() {
    if (this.direction === "input") return this.connectedFromPort.length > 0;
    else if (this.direction === "output") return this.connectedToPort.length > 0;
    return false;
  }
  /**
   * 获取是否是输入端口
   */
  public get isInput() {
    return this.direction === 'input';
  }
  /**
   * 获取是否是输入端口
   */
  public get isOutput() {
    return this.direction === 'output';
  }

  isCallingDelete = false;
}
/**
 * 端口样式
 */
export class NodePortStyle extends SerializableObject<INodePortStyleDefine, NodePort> {
  constructor(define?: INodePortStyleDefine) {
    super('NodePortStyle', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
          noSerializableProperties: [
            'parent',
          ],
        }
      }
    });
  }

  forceNoEditorControl = false;
  forceEditorControlOutput = false;
  forceNoDelete = false;
  topSpace?: number;
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
 * 状态
 */
export type NodePortFlex = 'auto'|'custom'|undefined|false;

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
   * 指示这个端口是否是弹性类型的端口，默认为 false
   * 
   * 弹性类型端口（简称弹性端口），默认类型是 Any，在其他类型的连接线连接至本
   * 端口后，可以触发本单元其他端口改变类型。
   * 
   * * false: 非弹性端口，其他弹性端口不会影响到本端口
   * * 'custom': 它在连接时会触发单元的 onPortFlexConnect 事件，可由你自定义处理。
   * * 'auto': 默认模式，在任意一个设置了auto的端口连接后，会触发其他auto端口改变类型。
   */
  isFlexible?: NodePortFlex;
  /**
   * 端口参数初始值，表示用户设置的在图表开始运行时，此端口的值，默认为null
   */
  initialValue ?: ISaveableTypes|null,
  /**
   * 端口样式
   */
  style?: INodePortStyleDefine;
}

/**
 * 端口样式定义
 */
export interface INodePortStyleDefine {
  /**
   * 端口顶部空间（格），默认为0
   */
  topSpace?: number;
  /**
   * 是否强制不显示编辑参数控件, 默认为 false
   */
  forceNoEditorControl?: boolean;
  /**
   * 是否强制在输出端口显示编辑参数控件, 默认为 false
   */
  forceEditorControlOutput?: boolean;
  /**
   * 强制禁止用户删除此端口, 默认为 false
   */
  forceNoDelete?: boolean;
}