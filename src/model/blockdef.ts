import { BlockParameteType, BlockPortDirection, BlockParameterPort } from "./Port";
import { OnPortActiveCallback, OnParameterUpdateCallback, OnBlockCreateCallback, OnPortCallback, OnUserAddParamCallback, OnUserAddPortCallback } from "./Block";
import { BlockEditor } from "./BlockEditor";

/**
 * 单元信息结构
 */
export class BlockRegData {

  public constructor(guid : string, name : string) {
    this.guid = guid;
    this.baseInfo.name = name;
  }

  /**
   * 单元 唯一 GUID ，不能重复
   */
  public guid = "";

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
   * 单元的行为节点
   */
  public ports : Array<BlockPortRegData> = [];
  /**
   * 单元的参数节点
   */
  public parameters : Array<BlockParameterPortRegData> = [];

  public hasOnePortByDirection(direction : BlockPortDirection) {
    for(let i = 0, c = this.ports.length; i < c;i++)
      if(this.ports[i].direction == direction) 
        return true;
    return false;
  }
  public hasOneParamPortByDirectionAndType(direction : BlockPortDirection, type : BlockParameteType, customType = '') {
    for(let i = 0, c = this.parameters.length; i < c;i++)
      if(this.parameters[i].direction == direction
        && this.parameters[i].paramType == type
        && this.parameters[i].paramCustomType == customType) 
        return true;
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
    onCreate : OnBlockCreateCallback,
    onPortActive : OnPortActiveCallback,
    onPortAdd : OnPortCallback,
    onPortRemove : OnPortCallback,
    onParameterUpdate : OnParameterUpdateCallback,
    onParameterAdd : OnParameterUpdateCallback,
    onParameterRemove : OnParameterUpdateCallback,
    onCreateCustomEditor : BlockEditorComponentCreateFn,
    onUserAddPort: OnUserAddPortCallback,
    onUserAddParam: OnUserAddParamCallback,
  } = {

    /**
     * 单元初始化时的回调。
     * 通常在这个回调里面进行单元初始化的一些工作，请不要在这里调用行为节点（因为节点未初始化完成）。
     */
    onCreate : (block) => {},
    /**
     * 单元工作处理函数。行为节点激活时的回调。
     * 通常在这个回调里面进行本单元的运算，然后调用下一个单元。
     */
    onPortActive : null,
    onPortAdd : null,
    onPortRemove : null,
    /**
     * 单元工作处理函数。参数更新时的回调。
     * 通常在这个回调里面进行参数更新，请不要在这里调用行为节点。
     */
    onParameterUpdate : null,
    /**
     * 用户添加了一个参数时的回调。
     */
    onParameterAdd : null,
    /**
     * 用户删除了一个参数时的回调。
     */
    onParameterRemove : null,
    /**
     * 创建单元自定义编辑器的回调（仅编辑器模式调用）
     */
    onCreateCustomEditor : null,
    /**
     * 用户创建行为端口时的回调（仅编辑器模式调用）
     */
    onUserAddPort: null,
    /**
     * 用户创建参数端口时的回调（仅编辑器模式调用）
     */
    onUserAddParam: null,
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
}

export type BlockEditorComponentCreateFn = (parentEle : HTMLElement, block : BlockEditor, 
  regData : BlockRegData) => void;



/**
 * 行为节点信息结构
 */
export class BlockPortRegData {
  /**
   * 节点 唯一 GUID (8位数字或字符串)，一个单元内不能重复
   */
  public guid = "";
  /**
   * 名称
   */
  public name = "";
  /**
   * 说明
   */
  public description = "This is a block port. Useage: unknow.";
  /**
   * 节点的方向
   */
  public direction : BlockPortDirection = null;
  /**
   * 设置是否默认连接至此节点。最好只有一个设置为true，如果有多个，先添加的为默认连接。
   */
  public defaultConnectPort = false;
}

/**
 * 参数节点信息结构
 */
export class BlockParameterPortRegData extends BlockPortRegData {
  /**
   * 参数的类型，如果设置为 custom 你可以设置 paramCustomType 来设置参数为自己的类型
   */
  public paramType : BlockParameteType = 'any';
  /**
   * 自定义参数类型
   */
  public paramCustomType = '';
  /**
   * 参数的默认值
   */
  public paramDefaultValue = null;
}

export type BlockParameterEditorComponentCreateFn = (parentEle : HTMLElement, 
  port : BlockParameterPort, 
  regData : BlockParameterTypeRegData) => HTMLElement;
export type BlockParameterEditorValueChangedFn = (port : BlockParameterPort, editorEle : HTMLElement) => void;

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

  public constructor(name : string, prototypeName : string, editor ?: BlockParameterEditorRegData) {
    this.name = name;
    this.prototypeName = prototypeName;
    if(typeof editor != 'undefined') this.editor = editor;
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

  public constructor(name : string, allowTypes ?: Array<{ value: string, description: string }> | Array<string>, editor ?: BlockParameterEditorRegData) {
    super(name, 'enum', editor);

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