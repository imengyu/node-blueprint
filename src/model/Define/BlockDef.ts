import { BlockParameterType, BlockPortDirection, BlockPort, BlockParameterSetType } from "./Port";
import { OnUserAddPortCallback, BlockType, OnPortEventCallback, OnBlockEventCallback, OnBlockEditorEventCallback, OnAddBlockCheckCallback, OnPortUpdateCallback, OnPortRequestCallback } from "./Block";
import { BlockEditor } from "../Editor/BlockEditor";
import { MenuItem } from "../Menu";

/**
 * 单元信息结构
 */
export class BlockRegData {

  public constructor(guid : string, name : string, description?:string, author?:string, category?:string) {
    this.guid = guid;
    this.baseInfo.name = name;
    if(description) this.baseInfo.description = description;
    if(author) this.baseInfo.author = author;
    if(category) this.baseInfo.category = category;
  }

  /**
   * 单元 唯一 GUID ，不能重复
   */
  public guid = "";

  /**
   * 单元类型
   */
  public type : BlockType = 'normal';

  /**
   * 基础信息
   */
  public baseInfo = {
    /**
     * 单元名称
     */
    name: "Single",
    /**
     * 单元简单说明
     */
    description : "This is a single block. Useage: unknow.",
    /**
     * 单元图标 20x20 
     */
    logo : require('../../assets/images/BlockIcon/function.svg'),
    /**
     * 单元所属类别。可以用 / 来归到子类里面
     */
    category : "",
    /**
     * 作者
     */
    author : "",
    /**
     * 版本
     */
    version : ""
  }

  /**
   * 单元的端口
   */
  public ports : Array<BlockPortRegData> = [];

  public hasOnePortByDirectionAndType(direction : BlockPortDirection, type : BlockParameterType, setType : BlockParameterSetType = 'variable', includeAny = false) {
    if(type.isExecute()) {
      for(let i = 0, c = this.ports.length; i < c;i++)
        if(this.ports[i].direction == direction){ 
          if(typeof this.ports[i].paramType == 'string' && this.ports[i].paramType == 'execute')
            return true;
          else if(typeof this.ports[i].paramType != 'string' && (<BlockParameterType>this.ports[i].paramType).isExecute())
            return true;
        }
    }else {
      for(let i = 0, c = this.ports.length; i < c;i++)
        if(this.ports[i].direction == direction) {
          if(type.baseType == 'any' && includeAny && this.ports[i].paramSetType == setType) return true;
          if(
            (
              (typeof this.ports[i].paramType == 'string' && this.ports[i].paramType == type.baseType) 
              || (typeof this.ports[i].paramType != 'string' && (<BlockParameterType>this.ports[i].paramType).equals(type)))
            
            && this.ports[i].paramSetType == setType) return true;
          
            if(includeAny && 
              (
                (typeof this.ports[i].paramType == 'string' && this.ports[i].paramType == 'any') 
               || (typeof this.ports[i].paramType != 'string' && (<BlockParameterType>this.ports[i].paramType).equals(type))) 
              && this.ports[i].paramSetType == setType) return true;
        }
    }
    return false;
  }

  /**
   * 单元的配置
   */
  public settings : {
    portsChangeSettings : {
      userCanAddInputPort: boolean,
      userCanAddOutputPort: boolean,
    },  
    parametersChangeSettings : BlockParametersChangeSettings,
    oneBlockOnly: boolean,
    data: any,
    hideInAddPanel: boolean,
  } = {
    /**
     * 端口动态配置
     */
    portsChangeSettings : {
      userCanAddInputPort: false,
      userCanAddOutputPort: false,
    },  
     /**
     * 端口动态配置
     */
    parametersChangeSettings : {
      userCanAddInputParameter: false,
      userCanAddOutputParameter: false,

    },
    /**
     * 获取或者设置当前单元是否只能在一个图表中出现一次
     */
    oneBlockOnly: false,
    data: {},
    /**
     * 是否在添加单元菜单中隐藏
     */
    hideInAddPanel: false,
  }

  /**
   * 单元定义回调
   */
  public callbacks : {
    /**
     * 单元初始化时的回调。
     * 通常在这个回调里面进行单元初始化的一些工作，请不要在这里调用行为节点（因为节点未初始化完成）。
     */
    onCreate : OnBlockEventCallback,
    /**
     * 单元在编辑器模式中初始化时的回调。
     */
    onEditorCreate : OnBlockEditorEventCallback,
    /**
     * 单元释放时的回调。
     */
    onDestroy : OnBlockEventCallback,
    /**
     * 当图表开始运行
     */
    onStartRun : OnBlockEventCallback,
    /**
     * 单元工作处理函数。入方向的执行端口激活时的回调。
     * 通常在这个回调里面进行本单元的运算，然后调用下一个单元。
     */
    onPortExecuteIn : OnPortEventCallback,
    /**
     * 单元端口更新处理函数。
     * 下一级单元请求本单元输出参数时发生的回调。
     */
    onPortParamRequest : OnPortRequestCallback,

    /**
     * 用户添加了一个端口时的回调。
     */
    onPortAdd : OnPortEventCallback,
    /**
     * 用户删除了一个端口时的回调。
     */
    onPortRemove : OnPortEventCallback,
    /**
     * 创建单元自定义编辑器的回调（仅编辑器模式调用）
     */
    onCreateCustomEditor : BlockEditorComponentCreateFn,
    /**
     * 创建单元自定义编辑器的回调（仅编辑器模式调用）
     */
    onCreatePortCustomEditor : BlockPortEditorComponentCreateFn,
    /**
     * 用户创建端口时的回调（仅编辑器模式调用）
     */
    onUserAddPort: OnUserAddPortCallback,
    /**
     * 添加单元时的回调，在这个回调中检查能否添加单元，
     * 返回null可以添加，返回一个字符串表示不能添加，字符串会显示给用户。（仅编辑器模式调用）
     */
    onAddCheck: OnAddBlockCheckCallback,
  } = {
    onCreate: null,
    onDestroy: null,
    onEditorCreate: null,
    onStartRun : null,
    onPortExecuteIn : null,
    onPortParamRequest : null,
    onPortAdd : null,
    onPortRemove : null,
    onCreateCustomEditor : null,
    onCreatePortCustomEditor: null,
    onUserAddPort: null,
    onAddCheck: null,
  }

  /**
   * 单元的自定义样式
   */
  public blockStyle = new BlockStyleSettings();

  /**
   * 单元的自定义菜单
   */
  public blockMenu = new BlockMenuSettings();

  show = true;
  filterShow = true;
}

export type BlockParametersChangeSettings = {
  userCanAddInputParameter: boolean,
  userCanAddOutputParameter: boolean
}
export class BlockMenuSettings  {
  public items : Array<MenuItem> = [];
}
export class BlockStyleSettings  {
  /**
   * 单元右上角的大图标 32x32
   */
  public logoRight = "";
  /**
   * 单元左下角的小图标 16x16
   */
  public logoBottom = "";
  /**
   * 单元左下角的小图标 16x16
   */
  public logoBackground = "";
  /**
   * 单元标题背景颜色
   */
  public titleBakgroundColor = 'rgba(255,255,255,0.3)';
  /**
   * 单元标题颜色
   */
  public titleColor = '';
  /**
   * 是否使用短标题栏
   */
  public smallTitle = false;
  /**
   * 是否隐藏题栏
   */
  public noTitle = false;
  /**
   * 单元最小宽度
   */
  public minWidth = '';
  /**
   * 是否隐logo
   */
  public hideLogo = false;
}

/**
 * 行为节点信息结构
 */
export interface BlockPortRegData {
  /**
   * 节点 的唯一ID (数字或字符串，可以随便写)，一个单元内不能重复
   */
  guid: string,
  /**
   * 名称
   */
  name?: string,
  /**
   * 说明
   */
  description?: string,
  /**
   * 节点的方向
   */
  direction : BlockPortDirection,
  /**
   * 设置是否默认连接至此节点。最好只有一个设置为true，如果有多个，先添加的为默认连接。
   */
  defaultConnectPort?: boolean,

  /**
   * 对于这个执行端口，是否在新上下文执行端口。
   * 只有新上下文执行才能延迟执行或在回调中执行。
   * 默认为 false。
   */
  executeInNewContext?: boolean,

  /**
   * 端口的类型
   */
  paramType : BlockParameterType|string;
  /**
   * 端口的集合类型
   */
  paramSetType ?: BlockParameterSetType;
  /**
   * 参数的默认值
   */
  paramDefaultValue ?: any;
  /**
   * 当端口为Dictionary时的键类型
   */
  paramDictionaryKeyType ?: BlockParameterType|string;

  /**
   * 是否引用传递参数值，默认为 false
   */
  paramRefPassing ?: boolean;
  /**
   * 参数值是否为全局变量，默认为 false
   */
  paramStatic ?: boolean;

  /**
   * 是否强制不显示编辑参数控件
   */
  forceNoEditorControl ?: boolean;
  /**
   * 是否强制在输出端口显示编辑参数控件
   */
  forceEditorControlOutput ?: boolean;

  data ?: any;
}


export class BlockParameterEditorRegData {
  /**
   * 一个函数回调，在这里创建数据类型的对应编辑器，用来编辑此种类型的数据。
   */
  public editorCreate : BlockParameterEditorComponentCreateFn  = null;

  public forceUpdateValue : BlockParameterEditorValueChangedFn  = null;
}

/**
 * 数据类型信息结构。
 * 此信息用来定义自己的参数类型
 */
export class BlockParameterTypeRegData {

  public constructor(name : string, prototypeName : string, color?: string, editor ?: BlockParameterEditorRegData) {
    this.name = name;
    this.prototypeName = prototypeName;
    if(typeof editor != 'undefined') this.editor = editor;
    if(typeof color != 'undefined') this.color = color;
  }

  /**
   * 类型名称
   */
  public name = "";
  /**
   * 自定义 object 的 prototype 名称
   */
  public prototypeName = "";
  /** 
   * 编辑器创建
   */
  public editor : BlockParameterEditorRegData = null;
  /**
   * 类型的颜色
   */
  public color : string = 'rgb(253,253,253)';

  /**
   * 显示给用户的名称
   */
  public nameForUser = "";
}

/**
 * 枚举类型信息结构。
 * 此信息用来定义自己的枚举类型
 */
export class BlockParameterEnumRegData extends BlockParameterTypeRegData {

  public constructor(name : string, allowTypes ?: Array<{ value: string, description: string }> | Array<string>, color?: string, 
    editor ?: BlockParameterEditorRegData) {
    super(name, 'enum', color, editor);

    if(typeof allowTypes != 'undefined' && allowTypes.length > 0) {
      if(typeof allowTypes[0] == 'string'){
        allowTypes.forEach(element => {
          this.allowTypes.push({
            value: element,
            description: ''
          })
        });
      } else this.allowTypes = this.allowTypes.concat(<Array<{ value: string, description: string }>>allowTypes);
    }
  }

  /**
   * 枚举项
   */
  public allowTypes : Array<{
    value: string,
    description: string
  }> = [];

}


export type BlockParameterEditorComponentCreateFn = (parentEle : HTMLElement, changeCallback : (newVal) => any, nowVal : any, defaultVal : any, customType : BlockParameterTypeRegData) => HTMLElement;
export type BlockParameterEditorValueChangedFn = (newVal : any, editorEle : HTMLElement) => void;
export type BlockEditorComponentCreateFn = (parentEle : HTMLElement, block : BlockEditor, regData : BlockRegData) => void;
export type BlockPortEditorComponentCreateFn = (parentEle : HTMLElement, block : BlockEditor, port : BlockPort) => HTMLElement;
  

