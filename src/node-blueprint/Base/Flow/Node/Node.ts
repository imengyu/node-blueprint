import { Vector2 } from "../../Utils/Base/Vector2";
import { SerializableObject } from "../../Utils/Serializable/SerializableObject";
import { printError } from "../../Utils/Logger/DevLog";
import type { INodePortDefine } from "./NodePort";
import type { NodePort } from "./NodePort";
import RandomUtils from "../../Utils/RandomUtils";
import type { IKeyValueObject } from "../../Utils/BaseTypes";

const TAG = 'Node';

/**
 * 节点
 */
export class Node extends SerializableObject<INodeDefine> {

  constructor(define: INodeDefine) {
    super('Node', define, false);
    this.define = define;
    this.serializableProperties = [ 'all' ];
    this.noSerializableProperties.push(
      'editorState',
      'inputPorts',
      'outputPorts',
      'guid',
    );
    this.forceSerializableClassProperties = {
      ports: 'NodePort'
    };
    this.uid = RandomUtils.genNonDuplicateIDHEX(32);
    this.load(define);
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
  public ports : NodePort[] = [];
  public inputPorts = new Map<string, NodePort>();
  public outputPorts = new Map<string, NodePort>();
  public get inputPortCount() { return this.inputPorts.size; }
  public get outputPortCount() { return this.outputPorts.size; }


  //编辑器运行数据
  //=====================

  public options = {} as IKeyValueObject;
  public markContent = '';
  public markOpen = false;
  public position = new Vector2();
  public customSize = new Vector2();
  public editorState = {
    selected: false,
    breakpointTriggered: false,
  };
  public style = new NodeStyleSettings();

  public load(data : INodeDefine) {
    const ret = super.load(data);

    this.inputPorts.clear();
    this.outputPorts.clear();

    //加载端口
    this.ports.forEach((port) => {
      if (port.direction === 'input') {
        this.inputPorts.set(port.guid, port);
      } else if (port.direction === 'output') {
        this.outputPorts.set(port.guid, port);
      } else {
        printError(TAG, `Node ${this.define.name} ${this.uid} port: ${port.guid} has bad direction.`);
      }
    });

    return ret;
  }
}

export type NodeBreakPoint = 'none'|'disable'|'enable';

/**
 * 节点样式结构
 */
export class NodeStyleSettings extends SerializableObject<INodekStyleSettings> {
  constructor(define?: INodekStyleSettings) {
    super('NodeStyleSettings', define);
    this.serializableProperties = [ 'all' ];
  }

  public logo = '';
  public logoRight = "";
  public logoBottom = "";
  public logoBackground = "";
  public titleBakgroundColor = 'rgba(255,255,255,0.3)';
  public titleColor = '#fff';
  public titleState : 'normal'|'small'|'hide'|false = 'normal';
  public userResize : 'width'|'height'|'all'|false = false;
  public noTooltip = false;
  public noComment = false;
  public noLogo = false;
  public minWidth = 0;
  public minHeight = 0;
  public maxWidth = 0;
  public maxHeight = 0;
  public inputPortMinWidth = '40px';
  public outputPortMinWidth = '';
  public layer : 'normal'|'background' = 'normal';
  public customClassNames = "";
}

/**
 * 单元样式设置
 */
export interface INodekStyleSettings {
  /**
   * 单元主图标 16x16
   */
  logo ?: string;
  /**
   * 单元右上角的大图标 32x32
   */
  logoRight ?: string;
  /**
   * 单元左下角的小图标 16x16
   */
  logoBottom ?: string;
  /**
   * 单元背景的图标 16x16
   * * 如果设置为 “title:xxxxx” 那么将会显示为文字 xxxxx
   * * 如果设置为 “icon:xxxxx” 那么将会显示为文字 xxxxx
   */
  logoBackground ?: string;
  /**
   * 单元标题背景颜色
   */
  titleBakgroundColor ?: string;
  /**
   * 单元标题颜色
   */
  titleColor ?: string;
  /**
   * 标题栏状态
   * * normal 正常标题栏
   * * small 小号标题栏
   * * false 隐藏标题栏
   */
  titleState ?: 'normal'|'small'|'hide'|false,
  /**
   * 指示用户是否可以调整该单元大小的类型
   * * width 用户可以调整这个单元的宽度
   * * height 用户可以调整这个单元的高度
   * * all 用户可以调整这个单元的大小
   * * false 用户不能调整这个单元的大小
   */
  userResize ?: 'width'|'height'|'all'|false,
  /**
   * 是否不显示鼠标悬停提示
   */
  noTooltip?: boolean;
  /**
   * 是否不显示注释菜单
   */
  noComment?: boolean;
  /**
   * 是否隐logo
   */
  noLogo ?: boolean;
  /**
   * 单元最小宽度(px)
   */
  minWidth ?: number,
  /**
   * 单元最小高度(px)
   */
  minHeight ?: number,
  /**
   * 单元最小宽度(px)
   */
  maxWidth ?: number,
  /**
  * 单元最小高度(px)
  */
  maxHeight ?: number,
  /**
   * 指定单元渲染所在层
   */
  layer ?: 'normal'|'background',
  /**
   * 单元的自定义类名
   */
  customClassNames?: string,
  /**
   * 入端口的文字最窄宽度。规定此宽度用于美观
   */
  inputPortMinWidth ?: number|string,
  /**
   * 出端口的文字最窄宽度。规定此宽度用于美观
   */
  outputPortMinWidth ?: number|string,
}

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
  /**
   * 指定这个单元是不是在用户添加菜单中隐藏。默认为 false
   */
  hideInAddPanel ?: boolean;
  /**
   * 指定这个单元在每个图表中是否只能出现一次。默认为 false
   */
  oneBlockOnly ?: boolean;
  /**
   * 指定这个单元是基础单元，不能被用户移除。默认为 false
   */
  canNotDelete ?: boolean;
  /**
   * 指示用户是否可以手动添加入执行端口。默认为 false
   */
  userCanAddInputExecute ?: boolean;
  /**
   * 指示用户是否可以手动添加出执行端口。默认为 false
   */
  userCanAddOutputExecute ?: boolean;
  /**
   * 指示用户是否可以手动添加入参数端口。默认为 false
   */
  userCanAddInputParam ?: boolean;
  /**
   * 指示用户是否可以手动添加出参数端口。默认为 false
   */
  userCanAddOutputParam ?: boolean;
  /**
   * 单元的自定义样式设置
   */
  style ?: INodekStyleSettings;
}
