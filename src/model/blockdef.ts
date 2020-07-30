import { BlockParameteType, BlockPortDirection } from "./port";
import { OnPortActiveCallback, OnParameterUpdateCallback } from "./block";

/**
 * 节点信息结构
 */
export class BlockRegData {
  /**
   * 节点 唯一 GUID ，不能重复
   */
  public guid = "";
  /**
   * 节点名称
   */
  public name = "Single";
  /**
   * 节点简单说明
   */
  public description = "This is a single block. Useage: unknow.";
  /**
   * 节点图标 20x20 
   */
  public logo = "";
  /**
   * 节点右上角的大图标 32x32
   */
  public logoRight = "";
  /**
   * 节点左下角的小图标 16x15
   */
  public logoBottom = "";

  /**
   * 节点所属类别。可以用 / 来归到子类里面
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
   * 节点的行为端口
   */
  public ports : Array<BlockPortRegData> = [];
  /**
   * 节点的参数端口
   */
  public parameters : Array<BlockParameterPortRegData> = [];

  /**
   * 节点工作处理函数。行为端口激活时的回调。
   * 通常在这个回调里面进行本节点的运算，然后调用下一个节点。
   */
  public onPortActive : OnPortActiveCallback = null;
  /**
   * 节点工作处理函数。参数更新时的回调。
   * 通常在这个回调里面进行参数更新，请不要在这里调用行为端口。
   */
  public onParameterUpdate : OnParameterUpdateCallback = null;
}

/**
 * 行为端口信息结构
 */
export class BlockPortRegData {
  /**
   * 名称
   */
  public name = "";
  /**
   * 说明
   */
  public description = "This is a block port. Useage: unknow.";
  /**
   * 端口的方向
   */
  public direction : BlockPortDirection = null;
}

/**
 * 参数端口信息结构
 */
export class BlockParameterPortRegData {
  /**
   * 名称
   */
  public name = "";
  /**
   * 说明
   */
  public description = "This is a block port. Useage: unknow.";
  /**
   * 参数的类型，如果设置为 custom 你可以设置 paramCustomType 来设置参数为自己的类型
   */
  public paramType : BlockParameteType = 'any';
  /**
   * 自定义参数类型
   */
  public paramCustomType = '';
  /**
   * 端口的方向
   */
  public direction : BlockPortDirection = null;
}