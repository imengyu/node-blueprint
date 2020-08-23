import { Rect } from "../Rect";
import { Block } from "./Block";
import { Connector } from "./Connector";
import { BlockPortRegData } from "./BlockDef";
import { EventHandler } from "../../utils/EventHandler";

/**
 * 文档结构
 */
export class BlockDocunment {

  public constructor(name = '') {
    this.name = name;
    this.mainGraph = new BlockGraphDocunment(name);
    this.mainGraph.isMainGraph = true;
  }

  /**
   * 文档名称
   */
  name : string = '';
  /**
   * 主流图
   */
  mainGraph : BlockGraphDocunment = null;
  /**
   * 库版本
   */
  libVersion : number = 0
  /**
   * 编辑器版本
   */
  openEditorVersion : number = 0

  isEditor = false;
}

/**
 * 流图文档结构
 */
export class BlockGraphDocunment {

  public constructor(name = '') {
    this.name = name;
  }

  /**
   * 名称
   */
  name : string = '';
  /**
   * 注释
   */
  comment : string = '';

  /**
   * 当前图的视口
   */
  viewPort = new Rect(2048, 2048, 0, 0);
  /**
   * 当前图的缩放比例
   */
  scale: number = 100;
  /**
   * 单元
   */
  blocks : Array<Block> = [];
  /**
   * 连接
   */
  connectors : Array<Connector> = [];
  /**
   * 子流图
   */
  children: Array<BlockGraphDocunment> = [];
  /**
   * 注释
   */
  comments: Array<any> = [];

  inputPorts: Array<BlockPortRegData> = [];
  outputPorts: Array<BlockPortRegData> = [];

  /**
   * 图表变量
   */
  variables: Array<BlockGraphVariable> = [];

  public findGraphVariable(name : string) {
    for (let index = 0; index < this.variables.length; index++) {
      if(this.variables[index].name == name)
        return this.variables[index];
    }
    return null;
  }
  public setGraphVariable(name : string|BlockGraphVariable, newV : any) {
    if(typeof name == 'string') 
      name = this.findGraphVariable(name);
    name.set(newV);
  }
  public findChildGraph(name : string) {
    for (let index = 0; index < this.children.length; index++) {
      if(this.children[index].name == name)
        return this.children[index];
    }
    return null;
  }

  /**
   * 父图表
   */
  parent : BlockGraphDocunment = null;


  isMainGraph = false;

  isEditor = false;
}

/**
 * 图表变量
 */
export class BlockGraphVariable {

  name = '';
  type = '';
  defaultValue = null;
  value = null;

  changeCallbacks : EventHandler<(v : BlockGraphVariable)=>void> = new EventHandler();

  set(newV) {
    if(this.value != newV) {
      this.value = newV;
      this.changeCallbacks.invoke(this);
    }
  }
}