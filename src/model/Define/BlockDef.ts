import { BlockParameterType, BlockPortDirection } from "./Port";
import { OnUserAddPortCallback, BlockType, OnPortEventCallback, OnBlockEventCallback, OnBlockEditorEventCallback } from "./Block";
import { BlockEditor } from "../Editor/BlockEditor";

/**
 * 单元信息结构
 */
export class BlockRegData {

  public constructor(guid : string, name : string, description?:string) {
    this.guid = guid;
    this.baseInfo.name = name;
    if(description) this.baseInfo.description = description;
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
    logo : "",
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

  public hasOnePortByDirectionAndType(direction : BlockPortDirection, type : BlockParameterType, customType = '', includeAny = false) {
    if(type == 'execute') {
      for(let i = 0, c = this.ports.length; i < c;i++)
        if(this.ports[i].direction == direction && this.ports[i].paramType == 'execute')
          return true;
    }else {
      for(let i = 0, c = this.ports.length; i < c;i++)
        if(this.ports[i].direction == direction
          && (
            (type == 'any' && includeAny)
            || (this.ports[i].paramType == type && this.ports[i].paramCustomType == customType)
            || (this.ports[i].paramType == 'any' && includeAny))) 
          return true;
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
     * 单元工作处理函数。行为节点激活时的回调。
     * 通常在这个回调里面进行本单元的运算，然后调用下一个单元。
     */
    onPortActive : OnPortEventCallback,
    /**
     * 用户添加了一个端口时的回调。
     */
    onPortAdd : OnPortEventCallback,
    /**
     * 用户删除了一个端口时的回调。
     */
    onPortRemove : OnPortEventCallback,
    /**
     * 单元工作处理函数。参数更新时的回调。
     * 通常在这个回调里面进行参数更新，请不要在这里调用行为节点。
     */
    onPortUpdate : OnPortEventCallback,
    /**
     * 创建单元自定义编辑器的回调（仅编辑器模式调用）
     */
    onCreateCustomEditor : BlockEditorComponentCreateFn,
    /**
     * 用户创建端口时的回调（仅编辑器模式调用）
     */
    onUserAddPort: OnUserAddPortCallback,
  } = {
    onCreate: null,
    onDestroy: null,
    onEditorCreate: null,
    onStartRun : null,
    onPortActive : null,
    onPortAdd : null,
    onPortRemove : null,
    onPortUpdate : null,
    onCreateCustomEditor : null,
    onUserAddPort: null,
  }

  /**
   * 单元的自定义样式
   */
  public blockStyle = new BlockStyleSettings();

  show = true;
  filterShow = true;
}

export type BlockParametersChangeSettings = {
  userCanAddInputParameter: boolean,
  userCanAddOutputParameter: boolean
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
   * 单元标题背景颜色
   */
  public titleBakgroundColor = '';
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
   * 端口的类型，execute为执行端口，如果设置为 custom 你可以设置 paramCustomType 来设置参数为自己的类型
   */
  paramType : BlockParameterType;
  /**
   * 自定义参数类型
   */
  paramCustomType ?: string;
  /**
   * 参数的默认值
   */
  paramDefaultValue ?: any;

  /**
   * 是否强制不显示编辑参数控件
   */
  forceNoEditorControl ?: boolean;
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
export type BlockEditorComponentCreateFn = (parentEle : HTMLElement, block : BlockEditor, 
  regData : BlockRegData) => void;

