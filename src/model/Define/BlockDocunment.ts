import { Rect } from "../Rect";
import { Block } from "./Block";
import { Connector } from "./Connector";
import { BlockPortRegData } from "./BlockDef";
import { EventHandler } from "../../utils/EventHandler";
import { BlockRunContextData } from "../WorkProvider/Runner";
import { BlockParameterSetType, BlockParameterType } from "./BlockParameterType";
import CommonUtils from "../../utils/CommonUtils";
import BlockDrawer from "../../components/BlockDrawer.vue";

/**
 * 文档结构
 */
export class BlockDocunment {

  public constructor(name = '') {
    this.name = name;
    this.mainGraph = new BlockGraphDocunment(name);
    this.mainGraph.docunment = this;
    this.mainGraph.isMainGraph = true;
    this.uid = CommonUtils.genNonDuplicateIDHEX(16);
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
  /**
   * 是否是编辑器模式
   */
  isEditor = false;
  /**
   * 文件所在位置
   */
  path = '';
  /**
   * 提示文件是否在编辑器更改过但没有保存
   */
  fileChanged = false;
  /**
   * 
   */
  uid = '';
  /**
   * 当前打开的图表
   */
  currentGraph : BlockGraphDocunment = null;
  currentEditor : BlockDrawer = null;
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
  scale = 100;
  /**
   * 单元
   */
  blocks : Array<Block> = [];

  /**
   * 图表所在文档
   */
  docunment : BlockDocunment = null;

  /**
   * 根据单元GUID获取当前文档中的所有单元
   * @param guid 单元GUID
   */
  public getBlocksByGUID(guid : string) { 
    let arr = [];
    this.blocks.forEach(element => {
      if(element.guid==guid)
        arr.push(element);
    });
    return arr;
  }
  /**
   * 根据单元GUID获取当前文档中的一个单元
   * @param guid 单元GUID
   */
  public getOneBlockByGUID(guid : string) { 
    for (let index = 0; index < this.blocks.length; index++) {
      if(this.blocks[index].guid==guid)
        return this.blocks[index];
    }
    return null;
  }

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
  public setGraphVariable(runningContext : BlockRunContextData, name : string|BlockGraphVariable, newV : any) {
    if(typeof name == 'string') 
      name = this.findGraphVariable(name);
    name.set(runningContext, newV);
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

  /**
   * 是否是主图表
   */
  isMainGraph = false;
  /**
   * 是否是编辑器模式
   */
  isEditor = false;


  lastRunContext : BlockRunContextData = null;
  blockPrepared = false;
}

/**
 * 图表变量
 */
export class BlockGraphVariable {

  name = '';
  type : BlockParameterType = BlockParameterType.createTypeFromString('any');
  dictionaryKeyType = '';
  setType : BlockParameterSetType = 'variable';

  defaultValue : any = null;
  value : any = null;
  static = false;
  stack = -1;

  /**
   * 变量更改回调
   */
  changeCallbacks : EventHandler<(v : BlockGraphVariable)=>void> = new EventHandler();

  /**
   * 设置变量
   * @param runningContext 当前运行上下文 
   * @param newV 数值
   */
  set(runningContext : BlockRunContextData, newV) {
    if(this.static) {
      if(this.value != newV) {
        this.value = newV;
        this.changeCallbacks.invoke(this);
      }
    }else if(this.stack >= 0) {
      if(runningContext.graphParamStack[this.stack] != newV) {
        runningContext.graphParamStack[this.stack] = newV;
        this.changeCallbacks.invoke(this);
      }
    }
  }
  /**
   * 获取变量
   * @param runningContext 当前运行上下文 
   */
  get(runningContext : BlockRunContextData) {
    if(this.static) return this.value;
    else if(this.stack >= 0) return runningContext.graphParamStack[this.stack];
  }
}