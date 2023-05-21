import type { NodeGraphEditorBaseContext, NodeGraphEditorContext } from "@/node-blueprint/Editor/Graph/NodeGraphEditor";
import RandomUtils from "../../Utils/RandomUtils";
import { SerializableObject } from "../../Utils/Serializable/SerializableObject";
import type { Node } from "../Node/Node";
import type { NodeConnector } from "../Node/NodeConnector";
import type { NodeVariable } from "./NodeVariable";
import type { INodePortDefine } from "../Node/NodePort";
import type { NodeDocunment } from "./NodeDocunment";

/**
 * 流图类型
 */
export type NodeGraphType = 'none' | 'static' | 'constructor' | 'function' | 'macro';

/**
 * 图表数据
 */
export class NodeGraph extends SerializableObject<INodeGraphDefine> {
  type = 'none' as NodeGraphType;
  name = '';
  uid: string;
  version = '';
  description = '';
  author = '';
  loadStatus: 'notload' | 'loaded' | 'error' | 'loading' = 'notload';

  constructor(define: INodeGraphDefine) {
    super('NodeGraph', define, false);
    this.serializableProperties = [ 'all' ];
    this.load(define);
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
  }

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
      if (element.guid == guid)
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
   * 新图表初始化
   */
  public initNew(): void {
    //TODO: 新图表初始化
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
      if (this.variables[i].name == name) return this.variables[i];
    }
    return null;
  }

  public inputPorts = new Array<INodePortDefine>();
  public outputPorts = new Array<INodePortDefine>();

  //编辑器
  //==========================

  /**
   * 图表所在文档
   */
  docunment: NodeDocunment | null = null;
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
      if (this.getVariableByName(name) == null)
        return name;
    }
    return baseName;
  }
}

/**
 * 端口定义
 */
export interface INodeGraphDefine {
  //
}