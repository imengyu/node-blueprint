import { Vector2 } from "@/Utils/Base/Vector2";
import { SerializableObject } from "@/Utils/Serializable/SerializableObject";
import { NodeGraph } from "../Graph/NodeGraph";
import { INodePortDefine, NodePort, NodePortDirection } from "./NodePort";
import RandomUtils from "@/Utils/RandomUtils";

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

  public define: INodeDefine;
  public uid = '';
  /**
   * 获取GUID
   */
  public get guid() : string { return this.define.guid; }
  public breakpoint : NodeBreakPoint = 'none';

  //编辑器运行数据

  public markContent = '';
  public markOpen = false;
  public position = new Vector2();
  public customSize = new Vector2();
}

export type NodeBreakPoint = 'none'|'disable'|'enable';

export type OnNodeEventCallback = (node : Node) => void;
export type OnPortEventCallback = (node : Node, port : NodePort) => void;


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
   * 样式信息
   */
  style ?: INodeStyleSettings,
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
   * 单元自定义事件设置
   */
  events ?: INodeEventSettings,
  /**
   * 单元自定义菜单
   */
  menu ?: unknown,
}
/**
 * 单元样式设置
 */
export interface INodeStyleSettings {
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
 * 单元自定义事件设置
 */
export interface INodeEventSettings {
  /**
   * 自定义检查回调，在用户添加某个单元至图表中时触发。
   * @param node 当前用户添加的某个单元
   * @param graph 添加目标图表
   * @return 返回一个字符串信息表示错误信息；返回null表示无错误，用户可以继续添加。
   */
  onAddCheck ?: (node: INodeDefine, graph: NodeGraph) => string|null;
  /**
   * 自定义检查回调，在用户删除某个单元至图表中时触发。
   * @param node 当前用户删除的某个单元
   * @param graph 删除目标图表
   * @return 返回一个字符串信息表示错误信息；返回null表示无错误，用户可以继续添加。
   */
  onDeleteCheck ?: (node: Node, graph: NodeGraph|null) => string|null;
  /**
   * 自定义检查回调，在用户连接单元两个端口时触发。
   * @param node 当前用户操作的单元
   * @param startPort 起始端口
   * @param endPort 结束端口
   * @return 返回一个字符串信息表示错误信息；返回null表示无错误，用户可以继续连接。
   */
  onPortConnectCheck ?: (node: Node, startPort: NodePort, endPort: NodePort) => string|null;
  /**
   * 弹性端口连接时触发。
   * @param node 当前用户操作的单元
   * @param thisPort 当前端口
   * @param anotherPort 另外一个端口
   */
  onFlexPortConnect ?: (node: Node, thisPort: NodePort, anotherPort: NodePort) => void;
  /**
   * 在用户连接端口时触发。
   * @param node 当前用户操作的单元
   * @param port 当前端口
   */
  onPortConnect ?: (node: Node, port: NodePort) => void;
  /**
   * 在用户断开端口的连接时触发。
   * @param node 当前用户操作的单元
   * @param port 当前端口
   */
  onPortUnConnect ?: (node: Node, port: NodePort) => void;

  /**
   * 单元初始化时的回调。
   * 通常在这个回调里面进行单元初始化的一些工作.
   */
  onCreate ?: OnNodeEventCallback,
  /**
   * 单元释放时(删除)的回调。
   */
  onDestroy ?: OnNodeEventCallback,
  /**
   * 编辑器保存时的回调。（仅编辑器模式调用）
   */
  onSave ?: OnNodeEventCallback,
  /**
   * 单元加载到编辑器中时的回调。
   */
  onAddToEditor ?: OnNodeEventCallback,
  /**
   * 单元从编辑器中卸载时的回调。（不是删除）
   */
  onRemoveFormEditor ?: OnNodeEventCallback,
  /**
   * 用户添加了一个端口时的回调。
   */
  onPortAdd ?: OnPortEventCallback,
  /**
   * 用户删除了一个端口时的回调。
   */
  onPortRemove ?: OnPortEventCallback,
  /**
   * 单元鼠标事件
   * @return 返回true则终止默认事件
   */
  onBlockMouseEvent ?: (node : Node, event : 'move'|'down'|'up'|'enter'|'leave', e : MouseEvent) => boolean,
  /**
   * 当用户点击创建端口时的回调。
   * @return  在这个回调中返回新创建端口的信息，由编辑器创建指定的端口
   */
  onUserAddPort ?: (node : Node, direction : NodePortDirection, type : 'execute'|'param') => INodePortDefine|INodePortDefine[],
}