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
  public editorState = {
    selected: false,
    breakpointTriggered: false,
  };
  public style = new NodeStyleSettings();
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
   * 如果设置为 “title:xxxxx” 那么将会显示为文字 xxxxx
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
}