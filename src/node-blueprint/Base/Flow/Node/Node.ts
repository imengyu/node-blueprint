import RandomUtils from "../../Utils/RandomUtils";
import ArrayUtils from "../../Utils/ArrayUtils";
import { Vector2 } from "../../Utils/Base/Vector2";
import { SerializableObject, type SerializableConfig, mergeSerializableConfig } from "../../Serializable/SerializableObject";
import { printError, printWarning } from "../../Logger/DevLog";
import { NodeParamType } from "../Type/NodeParamType";
import type { NodePort } from "./NodePort";
import type { INodePortDefine, NodePortDirection } from "./NodePort";
import type { IKeyValueObject, ISaveableTypes } from "../../Utils/BaseTypes";
import type { NodeGraph } from "../Graph/NodeGraph";
import type { NodeContextMenuItem } from "@/node-blueprint/Editor/Graph/Editor/EditorContextMenuHandler";
import type { VNode } from "vue";
import type { NodeGraphEditorContext } from "@/node-blueprint/Editor/Graph/NodeGraphEditor";
import type { NodeEditor } from "@/node-blueprint/Editor/Graph/Flow/NodeEditor";
import type { PropControlItem } from "../../Editor/PropDefine";
import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";

const TAG = 'Node';

/**
 * 节点
 */
export class Node extends SerializableObject<INodeDefine> {

  constructor(define: INodeDefine, config?: SerializableConfig<INodeDefine>) {
    super('Node', define, mergeSerializableConfig({    
      mergeOverride(keyName, thisData, fromData) {
        if (keyName === 'ports') {
          const thisArray = thisData as NodePort[];
          const fromArray = fromData as NodePort[];
          for (const port of fromArray) {
            if (port.dyamicAdd)
              thisArray.push(port)
            else {
              const targetPort = thisArray.find(p => p.guid === port.guid);
              if (targetPort) {
                targetPort.initialValue = port.initialValue;
                targetPort.paramType = port.paramType;
              } else {
                thisArray.push(port)
              }
            }
          }
          return { parsed: true };
        }
      },
      afterLoadOrMerge: () => {
        ArrayUtils.clear(this.inputPorts);
        ArrayUtils.clear(this.outputPorts);
        this.mapPorts.clear();
        //加载端口
        this.ports.forEach((port) => {
          if (port.direction === 'input') {
            this.mapPorts.set(port.guid, port);
            this.inputPorts.push(port);
          } else if (port.direction === 'output') {
            this.mapPorts.set(port.guid, port);
            this.outputPorts.push(port);
          } else {
            printError(TAG, `Node ${this.define.name} ${this.uid} port: ${port.guid} has bad direction.`);
          }
        });
      },
      serializeSchemes: {
        default: {
          serializeAll: true,
          serializableProperties: [],
          noSerializableProperties: [
            'define',
            'editorState',
            'editorHooks',
            'inputPorts',
            'outputPorts',
            'guid',
            'data',
            'parent',
          ],
          forceSerializableClassProperties: {
            ports: 'NodePort',
            style: 'NodeStyleSettings',
            events: 'NodeEventSettings',
            compile: 'NodeCompileSettings',
          },
        },
        graph: {
          inhertForm: 'default',
          serializeAll: false,
          serializableProperties: [
            'uid',
            'guid',
            'ports',
            'options',
            'tags',
            'markContent',
            'markOpen',
            'position',
            'customSize',
          ],
          saveProp(key, parentKey, source) {
            if (key === 'ports') {
              const ports = source as NodePort[];
              const portSaveArr : INodePortDefine[] = [];
              ports.forEach((port) => {
                if (port.dyamicAdd)
                  portSaveArr.push(port.save<INodePortDefine>());
                else
                  portSaveArr.push(port.save<INodePortDefine>('onlyValues'));
              });
              return  { parsed: true, return: portSaveArr };
            }
            return { parsed: false }
          },
        }
      },
    }, config));
    this.define = define;
  }

  //基础数据
  //=====================

  public define: INodeDefine;
  /**
   * 唯一ID
   */
  public uid = RandomUtils.genNonDuplicateIDHEX(32);
  /**
   * 名称。此数据会被保存至单元
   */
  public name = '';
  /**
   * 说明。此数据会被保存至单元
   */
  public description = '';
  /**
   * 获取GUID（只读）
   */
  public get guid() : string { return this.define.guid; }
  /**
   * 断点状态
   */
  public breakpoint : NodeBreakPoint = 'none';
  /**
   * 端口
   */
  public ports : NodePort[] = [];
  /**
   * 端口（影子）（只读）
   */
  public readonly mapPorts = new Map<string, NodePort>();
  /**
   * 入端口（影子）（只读）
   */
  public readonly inputPorts : NodePort[] = [];
  /**
   * 出端口（影子）（只读）
   */
  public readonly outputPorts : NodePort[] = [];
  /**
   * 入端口数量（只读）
   */
  public get inputPortCount() { return this.inputPorts.length; }
  /**
   * 出端口数量（只读）
   */
  public get outputPortCount() { return this.outputPorts.length; }
  /**
   * 自定义单元数据供代码使用（全局）（不会保存至文件中）
   */
  public data = {} as Record<string, any>;
  /**
   * 自定义单元属性供代码使用（全局）（会保存至文件中）
   */
  public options = {} as CustomStorageObject;

  //编辑器运行数据
  //=====================

  /**
   * 注释气泡内容
   */
  public markContent = '';
  /**
   * 注释气泡打开状态
   */
  public markOpen = false;
  /**
   * 节点位置（图表坐标）
   */
  public position = new Vector2();
  /**
   * 节点自定义大小
   */
  public customSize = new Vector2();
  /**
   * 自定义标签
   */
  public tags : string[] = [];

  //非序列化

  /**
   * 单元样式设置
   */
  public style = new NodeStyleSettings();
  /**
   * 单元事件设置
   */
  public events = new NodeEventSettings();
  /**
   * 指示当前节点是否是由加载而来。
   * 如果为true：表示这是由加载器从文件中加载而来节点
   * 如果为false：表示这是用户手动新添加的节点
   */
  public isLoad = false;

  //通用函数
  //=====================

  /**
   * 添加端口
   * @param data 端口数据
   * @param isDyamicAdd 是否是动态添加。动态添加的端口会被保存至文件中。
   */
  public addPort(data : INodePortDefine, isDyamicAdd = true, initialValue : ISaveableTypes|null = null, forceChangeDirection ?: NodePortDirection) : NodePort {
    const oldData = this.getPort(data.guid, data.direction);
    if(oldData !== null && oldData !== undefined) {
      printWarning(this.name + ".addPort", data.direction + " port " + data.name + " (" + data.guid + ") alreday exist !", {
        srcNode: this
      });
      return oldData;
    }

    const newPort = this.createSerializeObjectByScheme(data, 'ports') as NodePort;
    newPort.load();
    newPort.direction = forceChangeDirection || data.direction;
    newPort.dyamicAdd = isDyamicAdd;
    newPort.initialValue = initialValue;

    if(newPort.direction === 'input')
      this.inputPorts.push(newPort);
    else if(newPort.direction === 'output')
      this.outputPorts.push(newPort);
    
    if (data.defaultConnectPort)
      this.ports.unshift(newPort);
    else
      this.ports.push(newPort);
    this.mapPorts.set(newPort.guid, newPort);

    this.events.onPortAdd?.(this, newPort);
    return newPort;
  }
  /**
   * 删除端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public deletePort(guid : string|NodePort, direction ?: NodePortDirection) : void {
    const oldData = typeof guid === 'string' ? this.getPort(guid, direction) : guid;
    if(oldData === null || oldData === undefined) {
      printWarning(this.name + ".deletePort", guid + " port not exist !", {
        srcNode: this,
      });
      return;
    }

    this.mapPorts.delete(oldData.guid);
    this.events.onPortRemove?.(this, oldData);

    const deleteGuid = typeof guid === 'string' ? guid : guid.guid;
    
    ArrayUtils.removeBy(this.ports, (p) => p.guid === deleteGuid, true);
    if(direction === 'input')
      ArrayUtils.removeBy(this.inputPorts, (p) => p.guid === deleteGuid, true);
    else if(direction === 'output')
      ArrayUtils.removeBy(this.outputPorts, (p) => p.guid === deleteGuid, true);
  }
  /**
   * 根据方向获取某个端口
   * @param guid 端口GUID
   * @param direction 端口方向
   */
  public getPort(guid : string, direction ?: NodePortDirection) : NodePort|null {
    if(direction === 'input')
      return this.inputPorts.find(p => p.guid === guid) || null;
    else if(direction === 'output')
      return this.outputPorts.find(p => p.guid === guid) || null;
    else
      return this.getPortByGUID(guid);
  }
  /**
   * 获取第一个执行端口
   * @param direction 方向，默认是：input
   */
  public getOneExecutePort(direction: NodePortDirection = 'input') {
    return this.getPortByTypeAndDirection(NodeParamType.Execute, direction);
  }
  /**
   * 查询当前节点是否有执行端口
   */
  public hasExecutePort() {
    return this.ports.find(p => p.paramType.isExecute) !== undefined;
  }
  /**
   * 查询当前节点是否有执行端口
   */
  public hasAnyPortConnected() {
    for (const port of this.ports) {
      if (port.isConnected())
        return true;
    }
    return false;
  }
  /**
   * 根据GUID获取某个端口
   * @param guid 
   */
  public getPortByGUID(guid : string) : NodePort|null {
    if(this.mapPorts.has(guid))
      return this.mapPorts.get(guid) || null;
    return null;
  }
  /**
   * 获取当前单元中与指定方向和类型匹配的第一个端口
   * @param type 匹配类型
   * @param direction 匹配方向
   * @param includeAny 指定是否包括any类型的端口
   * @returns 返回端口，如果没有匹配则返回null
   */
  public getPortByTypeAndDirection(type: NodeParamType, direction: NodePortDirection, includeAny = true) : NodePort|null  {
    if(type.isExecute) 
      return (direction === 'input' ? this.inputPorts : this.outputPorts).find(p => p.paramType.isExecute) || null;
    else 
      return (direction === 'input' ? this.inputPorts : this.outputPorts).find(p => type.acceptable(p.paramType), includeAny) || null;
  }
  /**
   * 更改参数端口的数据类型
   * @param port 参数端口
   * @param newType 新的数据类型
   * @param changeIntitalValue 是否更改端口的设置默认值
   */
  public changePortParamType(port: NodePort|string, newType: NodeParamType, changeIntitalValue = true) {
    if(!port) {
      printError(this.name, 'changePortParamType: Must provide port');
      return;
    }
    if (typeof port === 'string')
      port = this.getPortByGUID(port) as NodePort;
    if (!port) {
      printError(this.name, `changePortParamType: Port ${port} not found`);
      return;
    }

    if(port.parent !== this) {
      printError(this.name, `changePortParamType: Port ${port.guid} is not this node children `);
      return;
    }
      
    port.paramType = newType;
    if (changeIntitalValue) {
      port.paramDefaultValue = newType.define?.defaultValue() as ISaveableTypes;
      port.initialValue = port.paramDefaultValue;
    }
  }

  /**
   * 获取是不是图表输入输出节点
   */
  public get isGraphInOutNode() {
    return this.guid === BaseNodes.getScriptBaseGraphIn().guid || this.guid === BaseNodes.getScriptBaseGraphOut().guid
  }
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
   * 作者
   */
  author ?: string;
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
   * [仅编辑器可用] 指定这个单元是不是在用户添加菜单中隐藏。默认为 false
   */
  hideInAddPanel ?: boolean;
  /**
   * 单元编译设置
   */
  compile ?: INodeCompileSettings;
  /**
   * 单元筛选标签
   */
  tags ?: string[],

  /**
   * [仅编辑器可用] 指定这个单元在每个图表中是否只能出现一次。默认为 false
   */
  oneNodeOnly ?: boolean;
  /**
   * [仅编辑器可用] 指定这个单元是基础单元，不能被用户移除。默认为 false
   */
  canNotDelete ?: boolean;
  /**
   * [仅编辑器可用] 指示用户是否可以手动添加入执行端口。默认为 false
   */
  userCanAddInputExecute ?: boolean;
  /**
   * [仅编辑器可用] 指示用户是否可以手动添加出执行端口。默认为 false
   */
  userCanAddOutputExecute ?: boolean;
  /**
   * [仅编辑器可用] 指示用户是否可以手动添加入参数端口。默认为 false
   */
  userCanAddInputParam ?: boolean;
  /**
   * [仅编辑器可用] 指示用户是否可以手动添加出参数端口。默认为 false
   */
  userCanAddOutputParam ?: boolean;
  /**
   * [仅编辑器可用] 单元的自定义样式设置
   */
  style ?: INodeStyleSettings;
  /**
   * [仅编辑器可用] 单元的自定义事件控制
   */
  events ?: INodeEventSettings;

  options?: CustomStorageObject;
  markContent?: string;
  markOpen?: boolean;
  position?: Vector2;
  customSize?: Vector2;
}

export type NodeEventCallback<R = void, T = undefined> = (srcNode : Node, data?: T) => R;
export type NodeEditorEventCallback<R = void, T = undefined> = (srcNode : NodeEditor, data?: T) => R;
export type NodeEditorContextEventCallback<R = void, T = undefined> = (srcNode : NodeEditor, context: NodeGraphEditorContext, data?: T) => R;
export type NodePortEventCallback = (srcNode : Node, srcPort : NodePort) => void;
export type NodePortRequestCallback = (srcNode : Node, srcPort : NodePort, context: unknown) => any;
export type NodeCreateEditorFunction = (parentEle: HTMLElement|undefined, node: NodeEditor, context: NodeGraphEditorContext) => VNode|VNode[]|undefined;
export type NodeEditorMoseEventFunction = (node: NodeEditor, context: NodeGraphEditorContext, event: "move" | "down" | "up" | "leave" | "enter", e: MouseEvent) => boolean;
export type NodeEditorMoseClickEventFunction = (node: NodeEditor, context: NodeGraphEditorContext, event: "click" | "dblclick", e: MouseEvent) => void;
export type NodeEditorEventFunction = (node: NodeEditor, context: NodeGraphEditorContext, event: "select" | "unselect") => void;

export interface NodeEditorMessageData {
  message: string|number,
  data: { [index: string]: any; }
}
export interface NodeEditorCreateReturnData {
  /**
   * [仅编辑器可用] 指定这个单元在属性栏中附加的属性
   */
  editorProp ?: PropControlItem[],
  /**
   * [仅编辑器可用] 指定这个单元在单元顶部/底部区域中附加的属性
   */
  nodeProp ?: { 
    before?: PropControlItem[],
    after?: PropControlItem[],
  },
  /**
   * [仅编辑器可用] 单元的右键菜单操作
   */
  menu ?: { items: NodeContextMenuItem[] },
}

/**
 * 单元自定义事件设置
 */
export interface INodeEventSettings {
  /**
   * 单元初始化时的回调。
   * 通常在这个回调里面进行单元初始化的一些工作.
   */
  onCreate ?: NodeEventCallback,
  /**
   * 单元释放时(删除)的回调。
   */
  onDestroy ?: NodeEventCallback,
  /**
   * 单元保存自定义数据时的回调。
   */
  onSave ?: NodeEventCallback,
  /**
   * 单元创建自定义编辑器区域时的回调。
   * 
   * (parentEle: HTMLElement|undefined, node: Node) => VNode|VNode[]|undefined
   * 
   * 注意：
   * * 在parentEle为空时，此时是vue的渲染函数调用的，可以使用vue的渲染函数相关，并返回vnode。
   * * 在parentEle不为空时，此时此函数为原生dom创建回调，此时返回vnode无效。
   */
  onCreateCustomEditor ?: NodeCreateEditorFunction,
  /**
   * 单元鼠标事件回调。
   */
  onEditorMoseEvent ?: NodeEditorMoseEventFunction,
  /**
   * 单元鼠标点击事件回调。
   */
  onEditorClickEvent ?: NodeEditorMoseClickEventFunction,
  /**
   * 单元编辑器事件回调。
   */
  onEditorEvent ?: NodeEditorEventFunction,
  /**
   * 单元加载到编辑器中时的回调。
   */
  onAddToEditor ?: NodeEventCallback,
  /**
   * 单元从编辑器中卸载时的回调。（不是删除）
   */
  onRemoveFormEditor ?: NodeEventCallback,
  /**
   * 编辑器创建回调
   */
  onEditorCreate ?: NodeEditorContextEventCallback<NodeEditorCreateReturnData|undefined|void, HTMLDivElement>,
  /**
   * 编辑器中的消息回调
   */
  onEditorMessage ?: NodeEditorContextEventCallback<void, NodeEditorMessageData>,
  /**
   * 用户添加了一个端口时的回调。
   */
  onPortAdd ?: NodePortEventCallback,
  /**
   * 用户删除了一个端口时的回调。
   */
  onPortRemove ?: NodePortEventCallback,
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
   * @returns 返回你修改过类型的其他弹性端口，将会递归触发其他节点的弹性端口事件。
   */
  onFlexPortConnect ?: (node: Node, thisPort: NodePort, anotherPort: NodePort) => void;
  /**
   * 在用户连接端口时触发。
   * @param node 当前用户操作的单元
   * @param port 当前端口
   */
  onPortConnect ?: NodePortEventCallback;
  /**
   * 在用户断开端口的连接时触发。
   * @param node 当前用户操作的单元
   * @param port 当前端口
   */
  onPortUnConnect ?: NodePortEventCallback;
}
/**
 * 单元自定义事件设置
 */
export class NodeEventSettings extends SerializableObject<INodeEventSettings> {
  constructor(define?: INodeEventSettings) {
    super('NodeEventSettings', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
          noSerializableProperties: [
            'parent',
          ]
        }
      }
    });
  }

  onCreate ?: NodeEventCallback;
  onDestroy ?: NodeEventCallback;
  onSave ?: NodeEventCallback;
  onAddToEditor ?: NodeEventCallback;
  onCreateCustomEditor ?: NodeCreateEditorFunction;
  onEditorMoseEvent ?: NodeEditorMoseEventFunction;
  onEditorClickEvent ?: NodeEditorMoseClickEventFunction;
  onEditorMessage ?: NodeEditorContextEventCallback<void, NodeEditorMessageData>;
  onEditorEvent?: NodeEditorEventFunction;
  onUserAddPort ?: NodeEventCallback<Promise<INodePortDefine|null>, {
    direction : NodePortDirection,
    type : 'execute'|'param',
  }>;
  onRemoveFormEditor ?: NodeEventCallback;
  onEditorCreate ?: NodeEditorContextEventCallback<NodeEditorCreateReturnData|undefined|void, HTMLDivElement>;
  onPortAdd ?: NodePortEventCallback;
  onPortRemove ?: NodePortEventCallback;
  onAddCheck ?: (node: INodeDefine, graph: NodeGraph) => string|null;
  onDeleteCheck ?: (node: Node, graph: NodeGraph|null) => string|null;
  onPortConnectCheck ?: (node: Node, startPort: NodePort, endPort: NodePort) => string|null;
  onFlexPortConnect ?: (node: Node, thisPort: NodePort, anotherPort: NodePort) => NodePort[];
  onPortConnect ?: NodePortEventCallback;
  onPortUnConnect ?: NodePortEventCallback;
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
   * 是否隐藏logo
   */
  noLogo ?: boolean;
  /**
   * 是否永远保持常亮，没有孤立节点暗色显示，默认：false
   */
  noIsolate ?: boolean;
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
 * 节点样式结构
 */
export class NodeStyleSettings extends SerializableObject<INodeStyleSettings> {
  constructor(define?: INodeStyleSettings) {
    super('NodeStyleSettings', define, {
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
  public noIsolate = false;
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
 * 单元编译设置
 */
export interface INodeCompileSettings {
  
}
/**
 * 单元编译设置
 */
export class NodeCompileSettings extends SerializableObject<INodeCompileSettings> {
  constructor(define?: INodeCompileSettings) {
    super('NodeCompile', define, {
      serializeSchemes: {
        default: {
          serializeAll: true,
          noSerializableProperties: [
            'parent',
          ],
        },
      }
    });
  }
}

export class CustomStorageObject implements IKeyValueObject {
  [index: string]: ISaveableTypes | null | undefined;
}