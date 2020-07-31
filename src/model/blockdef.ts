import { BlockParameteType, BlockPortDirection } from "./port";
import { OnPortActiveCallback, OnParameterUpdateCallback, OnBlockCallback } from "./block";

/**
 * 单元信息结构
 */
export class BlockRegData {
  /**
   * 单元 唯一 GUID ，不能重复
   */
  public guid = "";
  /**
   * 单元名称
   */
  public name = "Single";
  /**
   * 单元简单说明
   */
  public description = "This is a single block. Useage: unknow.";
  /**
   * 单元图标 20x20 
   */
  public logo = "";
  /**
   * 单元右上角的大图标 32x32
   */
  public logoRight = "";
  /**
   * 单元左下角的小图标 16x15
   */
  public logoBottom = "";

  /**
   * 单元所属类别。可以用 / 来归到子类里面
   */
  public category = "";
  /**
   * 作者
   */
  public author = "";
  /**
   * 版本
   */
  public version = "";

  /**
   * 单元的行为节点
   */
  public ports : Array<BlockPortRegData> = [];
  /**
   * 单元的参数节点
   */
  public parameters : Array<BlockParameterPortRegData> = [];

  /**
   * 单元初始化时的回调。
   * 通常在这个回调里面进行单元初始化的一些工作，请不要在这里调用行为节点（因为节点未初始化完成）。
   */
  public onCreate : OnBlockCallback = (block) => {};
  /**
   * 单元工作处理函数。行为节点激活时的回调。
   * 通常在这个回调里面进行本单元的运算，然后调用下一个单元。
   */
  public onPortActive : OnPortActiveCallback = null;
  /**
   * 单元工作处理函数。参数更新时的回调。
   * 通常在这个回调里面进行参数更新，请不要在这里调用行为节点。
   */
  public onParameterUpdate : OnParameterUpdateCallback = null;
}

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
}

/**
 * 数据类型信息结构。
 * 此信息用来定义自己的参数类型
 */
export class BlockParameterTypeRegData {

  /**
   * 类型名称
   */
  public name = "";
  /**
   * 自定义 object 的 prototype 名称
   */
  public prototypeName = "";

}

/**
 * 枚举类型信息结构。
 * 此信息用来定义自己的枚举类型
 */
export class BlockParameterEnumRegData {

  /**
   * 类型名称
   */
  public name = "";
  /**
   * 枚举项
   */
  public allowTypes : Array<string> = [];

}