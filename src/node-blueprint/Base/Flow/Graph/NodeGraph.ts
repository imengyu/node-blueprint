import RandomUtils from "../../Utils/RandomUtils";
import { SerializableObject, SerializableObjectPureObjName } from "../../Serializable/SerializableObject";
import type { Node, INodeDefine } from "../Node/Node";
import type { NodeConnector } from "../Node/NodeConnector";
import type { NodeVariable } from "./NodeVariable";
import type { INodePortDefine } from "../Node/NodePort";
import type { NodeDocunment } from "./NodeDocunment";
import type { NodeGraphEditorContext } from "@/node-blueprint/Editor/Graph/NodeGraphEditor";
import { NodeRegistry } from "../Registry/NodeRegistry";
import { printWarning } from "../../Logger/DevLog";
import { CreateObjectFactory } from "../../Serializable/SerializableObject";
import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";
import { Vector2 } from "../../Utils/Base/Vector2";
import type { IObjectSharedData } from "../../Utils/Interface/IObjectSharedData";
import { ReadyDispatcher } from "@/node-blueprint/Editor/Docunment/Tools/ReadyDispatcher";
import type { IWaitReady } from "@/node-blueprint/Editor/Docunment/Tools/IWaitReady";

/**
 * 流图类型
 * 
 * 基础
 * * none 未知
 * * main 静态主入口（单文档只有一个）
 * * class 类
 * * subgraph 子程序块（一个图表只有一个，只能被自己或者父级范围）
 * 类
 * * static 静态函数
 * * constructor 类构造函数
 * * function 类实例函数
 * * macro 宏
 */
export type NodeGraphType = 'main' | 'class' | 'subgraph' | 'none' | 'static' | 'constructor' | 'function' | 'macro';

/**
 * 图表数据
 */
export class NodeGraph extends SerializableObject<INodeGraphDefine, NodeDocunment|NodeGraph> implements IObjectSharedData, IWaitReady {
  type = 'none' as NodeGraphType;
  name = '';
  uid = RandomUtils.genNonDuplicateIDHEX(32);
  version = '';
  description = '';
  author = '';
  isEditor : boolean;

  get TAG() {
    return 'NodeGraph:' + this.name + ':' + this.uid;
  }

  constructor(define: INodeGraphDefine, parent: NodeDocunment|NodeGraph, isEditor: boolean) {
    super('NodeGraph', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
          serializableProperties: [],
          serializePropertyOrder: {
            'nodes': 1,
            'connectors': 3,
          },
          noSerializableProperties: [
            'docunment',
            'fileChanged',
            'activeEditor',
            'isEditor',
            'parent',
          ],     
          forceSerializableClassProperties: {
            children: isEditor === true ? 'NodeGraphEditor' : 'NodeGraph',
            inputPorts: SerializableObjectPureObjName,
            outputPorts: SerializableObjectPureObjName,
          },
          //加载与保存
          loadProp: (key, parentKey, source) => {
            switch (parentKey) {
              case 'nodes': {
                const { 
                  uid, 
                  guid, 
                  node
                } = source as INodeSaveData;
                const nodeDefine = NodeRegistry.getInstance().getNodeByGUID(guid);
                if (!nodeDefine) {
                  printWarning(this.TAG, `Failed to load node guid: ${guid} uid:${uid}, maybe not register.`);
                  return { parsed: true, ignore: true };
                }
              
                const nodeInstance = this.createNode(nodeDefine);
                const shadowSettings = nodeInstance.loadShadow(node, 'graph');
                nodeInstance.mergeShadow(shadowSettings);
                nodeInstance.isLoad = true;
                nodeInstance.parent = this;
                nodeInstance.events.onCreate?.(nodeInstance);

                return {
                  parsed: true,
                  return: nodeInstance
                };
              }
              case 'connectors': {
                const { uid, startPort, endPort } = source as INodeConnectorSaveData;
                const startNode = this.nodes.get(startPort.nodeUid);
                const endNode = this.nodes.get(endPort.nodeUid);
                if (!startNode) {
                  printWarning(this.TAG, `Failed to load connector uid:${uid}, node uid: ${startPort.nodeUid} not found.`);
                  return { parsed: true, ignore: true };
                }
                if (!endNode) {
                  printWarning(this.TAG, `Failed to load connector uid:${uid}, node uid: ${endPort.nodeUid} not found.`);
                  return { parsed: true, ignore: true };
                }
                
                const startPortInstance = startNode.getPortByGUID(startPort.portUid);
                const endPortInstance = endNode.getPortByGUID(endPort.portUid);
                if (!startPortInstance) {
                  printWarning(this.TAG, `Failed to load connector uid:${uid}, port guid: ${startPort.portUid} not found.`);
                  return { parsed: true, ignore: true };
                }
                if (!endPortInstance) {
                  printWarning(this.TAG, `Failed to load connector uid:${uid}, port guid: ${endPort.portUid} not found.`);
                  return { parsed: true, ignore: true };
                }
    
                const connector = (isEditor ? 
                  CreateObjectFactory.createSerializableObject('NodeConnectorEditor', this, { uid }) :
                  CreateObjectFactory.createSerializableObject('NodeConnector', this, { uid })) as unknown as NodeConnector;
                
                connector.startPort = startPortInstance;
                connector.endPort = endPortInstance;
                connector.setConnectionState();
                connector.parent = this;
                
                return {
                  parsed: true,
                  return: connector
                };
              }
            }
            return { parsed: false };
          },
          saveProp: (key, parentKey, source) => {
            switch (parentKey) {
              case 'nodes': {
                const node = source as Node;
                return {
                  parsed: true,
                  return: {
                    guid: node.guid,
                    uid: node.uid,
                    node: node.save<INodeDefine>('graph'),
                  } as INodeSaveData,
                };
              }
              case 'connectors': {
                const connector = source as NodeConnector;
                return {
                  parsed: true,
                  return: {
                    uid: connector.uid,
                    startPort: {
                      nodeUid: connector.startPort?.parent?.uid,
                      portUid: connector.startPort?.guid,
                    },
                    endPort: {
                      nodeUid: connector.endPort?.parent?.uid,
                      portUid: connector.endPort?.guid,
                    },
                  } as INodeConnectorSaveData
                };
              }
            }
            return { parsed: false };
          },
        },
      },
    });
    this.parent = parent;
    this.isEditor = isEditor;
  }

  private createNode(finalNodeDefine: INodeDefine) {
    return (this.isEditor ? 
      CreateObjectFactory.createSerializableObject('NodeEditor', this, finalNodeDefine) :
      CreateObjectFactory.createSerializableObject('Node', this, finalNodeDefine)) as unknown as Node;
  }


  readyDispatcher = new ReadyDispatcher();

  waitReady(): Promise<void> {
    return this.readyDispatcher.waitReadyState();
  }

  /**
   * 子流图
   */
  children: NodeGraph[] = [];

  /**
   * 单元
   */
  nodes = new Map<string, Node>();

  /**
   * 根据单元GUID获取当前文档中的所有单元
   * @param guid 单元GUID
   */
  public getNodesByGUID(guid: string): Node[] {
    const arr: Node[] = [];
    this.nodes.forEach(element => {
      if (element.guid === guid)
        arr.push(element);
    });
    return arr;
  }
  /**
   * 根据单元UID获取当前文档单元
   * @param guid 单元UID
   */
  public getOneNodeByUID(uid: string): Node | null {
    return this.nodes.get(uid) || null;
  }
  /**
   * 根据单元GUID获取当前文档单元
   * @param guid 单元GUID
   */
  public getOneNodeByGUID(guid: string): Node | null {
    return this.getNodesByGUID(guid)[0] || null;
  }
  /**
   * 根据名称获取子图表
   * @param name 名称
   */
  public getChildGraphByName(name: string): NodeGraph | null {
    return this.children.find(g => g.name === name) || null;
  }

  /**
   * 新图表初始化
   */
  public initNew(): void {
    switch (this.type) {
      case 'main': {
        const startNode = this.createNode({
          ...BaseNodes.getScriptBaseNodeIn(),
          position: new Vector2(250, 100),
          markOpen: true,
          markContent: '这是入口节点，程序从这里开始运行',
        });
        const endNode = this.createNode({
          ...BaseNodes.getScriptBaseNodeOut(),
          position: new Vector2(650, 100),
          markOpen: true,
          markContent: '这是程序结束节点，运行到这里后程序结束',
        });
        this.nodes.set(startNode.uid, startNode);
        this.nodes.set(endNode.uid, endNode);
        break;
      }
      case 'macro':
      case 'static':
      case 'function':
      case 'subgraph': {
        const startNode = this.createNode({
          ...BaseNodes.getScriptBaseGraphIn(),
          position: new Vector2(250, 100),
        });
        const endNode = this.createNode({
          ...BaseNodes.getScriptBaseGraphOut(),
          position: new Vector2(650, 100),
        });
        this.nodes.set(startNode.uid, startNode);
        this.nodes.set(endNode.uid, endNode);
        break;
      }
      case 'constructor': {
        const startNode = this.createNode({
          ...BaseNodes.getScriptBaseGraphIn(),
          position: new Vector2(250, 100),
        });
        this.nodes.set(startNode.uid, startNode);
        break;
      }
      default:
        //TODO: 其他类型初始化
        break;
    }
  }

  parent: NodeDocunment|NodeGraph;

  /**
   * 获取当前图表的顶级父级文档
   * @returns 
   */
  public getParentDocunment() {
    let p = this.parent;
    while(p) {
      if (p instanceof NodeGraph)
        p = p.parent;
      else
        return p;
    }
    return null;
  }

  /**
   * 连接
   */
  connectors: Array<NodeConnector> = [];
  /**
   * 变量
   */
  variables: Array<NodeVariable> = [];
  /**
   * 指示当前函数是否是静态
   */
  static = false;

  
  /**
   * 通过名称获取参数
   * @param name 参数名
   * @returns 
   */
  getVariableByName(name: string): NodeVariable | null {
    for (let i = this.variables.length - 1; i >= 0; i--) {
      if (this.variables[i].name === name) return this.variables[i];
    }
    return null;
  }

  public inputPorts = new Array<INodePortDefine>();
  public outputPorts = new Array<INodePortDefine>();

  //编辑器
  //==========================

  /**
   * 指定当前文件是否已经更改
   */
  fileChanged = false;
  /**
   * 当前激活的编辑器实例
   */
  activeEditor: NodeGraphEditorContext | null = null;

  /**
   * 获取一个可用的图表变量名称
   * @param baseName 基础名称
   * @returns 
   */
  getUseableVariableName(baseName: string): string {
    for (let i = this.variables.length, c = this.variables.length + 10; i < c; i++) {
      const name = baseName + i;
      if (this.getVariableByName(name) === null)
        return name;
    }
    return baseName + Math.floor(Math.random() * 100);
  }
  /**
   * 获取一个可用的图表变量名称
   * @param baseName 基础名称
   * @returns 
   */
  getUseablePortName(input: boolean): string {
    const array = input ? this.inputPorts : this.outputPorts;
    const baseName = input ? 'INPUT' : 'OUTPUT';
    for (let i = array.length, c = array.length + 10; i < c; i++) {
      const name = baseName + i;
      if (!array.find(p => p.name === name))
        return name;
    }
    return baseName + Math.floor(Math.random() * 100);
  }
  /**
   * 获取一个可用的图表名称
   * @param baseName 基础名称
   * @returns 
   */
  getUseableGraphName(baseName: string): string {
    const array = this.children;
    for (let i = array.length, c = array.length + 10; i < c; i++) {
      const name = baseName + i;
      if (!array.find(p => p.name === name))
        return name;
    }
    return baseName + Math.floor(Math.random() * 100);
  }


}

/**
 * 端口定义
 */
export interface INodeGraphDefine {
  type : NodeGraphType;
  name ?: string;
  uid ?: string;
  version ?: string;
  description ?: string;
  author ?: string;
  outputPorts ?: INodePortDefine[];
  inputPorts ?: INodePortDefine[];
  static ?: boolean;
  connectors ?: INodeConnectorSaveData[];
  nodes ?: INodeSaveData[];
  variables ?: NodeVariable[];
}

/**
 * 节点保存定义
 */
export interface INodeSaveData {
  uid: string;
  guid: string;
  node: INodeDefine,
}
/**
 * 连接线保存定义
 */
export interface INodeConnectorSaveData {
  uid: string;
  startPort: {
    nodeUid: string,
    portUid: string,
  };
  endPort: {
    nodeUid: string,
    portUid: string,
  };
}