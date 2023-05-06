import type { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';

export type ChooseTypePanelCallback = undefined;

export interface NodeGraphEditorBasePanelsContext {
  /**
   * 显示选择类型菜单
   * @param screenPos 显示位置（屏幕坐标） 
   * @param canbeExecute 是否可以选择执行类型  
   * @param canbeAny 是否可以选择any类型 
   * @param callback 用户选择完成后的回调
   */
  showChooseTypePanel: (screenPos: Vector2, canbeExecute: boolean, canbeAny: boolean, callback: ChooseTypePanelCallback) => void;
  /**
   * 关闭选择类型菜单
   */
  closeChooseTypePanel: () => void;
  /**
   * 显示添加单元菜单
   * @param screenPos 显示位置（屏幕坐标） 
   * @param filterByPortType 按单元端口的类型进行筛选 
   * @param filterByPortDirection 按单元端口的方向进行筛选
   * @param addBlockPos 设置添加单元的坐标
   * @param showAddDirectly 是否显示直接添加和拖动添加两个模式，否则只有直接添加一个模式，默认为 true
   */
  showAddBlockPanel: (screenPos: Vector2, filterByPortType ?: NodeParamType|null, filterByPortDirection ?: NodePortDirection|null, addBlockPos ?: Vector2, showAddDirectly ?: boolean) => void;
  /**
   * 关闭添加单元菜单
   */
  closeAddBlockPanel: () => void;
  /**
   * 显示小信息提示
   * @param text 显示文字 
   * @param time 显示时长（毫秒），默认1300 
   */
  showSmallTip: (text : string, time ?: number) => void;
  /**
   * 关闭小信息提示
   */
  closeSmallTip: () => void;
}