import { Vector2 } from "../../Utils/Base/Vector2";
import { SerializableObject } from "../../Utils/Serializable/SerializableObject";
import type { NodeGraph } from "../Graph/NodeGraph";
import type { INodePortDefine, NodePort, NodePortDirection } from "./NodePort";
import RandomUtils from "../../Utils/RandomUtils";

/**
 * 节点
 */
export class Node extends SerializableObject<INodeDefine> {

  constructor(define: INodeDefine) {
    super('Node', define);
    this.define = define;
    this.serializableProperties = [ 'all' ];
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
  }

  //基础数据
  //=====================

  public define: INodeDefine;
  public uid = '';
  /**
   * 获取GUID
   */
  public get guid() : string { return this.define.guid; }
  public breakpoint : NodeBreakPoint = 'none';

  //编辑器运行数据
  //=====================

  public markContent = '';
  public markOpen = false;
  public position = new Vector2();
  public customSize = new Vector2();
}

export type NodeBreakPoint = 'none'|'disable'|'enable';

/**
 * 节点定义
 */
export interface INodeDefine {
  /**
   * 唯一ID
   */
  guid : string,
  /**
   * 版本号
   */
  version : number,
  /**
   * 名称
   */
  name : string,
  /**
   * 说明文字
   */
  description ?: string,
  /**
   * 单元分组路径，使用 / 分隔一级，例如 基础/定时器
   */
  category ?: string,
  /**
   * 单元的预定义端口
   */
  ports ?: Array<INodePortDefine>,
}