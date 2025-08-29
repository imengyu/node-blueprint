import type { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import type { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import type { NodePortDirection } from '@/node-blueprint/Base/Flow/Node/NodePort';
import type { AlertProps } from '../../Nana/Modal/Alert';

export type ChooseTypePanelCallback = undefined;

export interface NodeGraphEditorBasePanelsContext {
  dialogManager: {
    /**
     * 显示添加单元菜单
     * @param screenPos 显示位置（屏幕坐标） 
     * @param filterByPortType 按单元端口的类型进行筛选 
     * @param filterByPortDirection 按单元端口的方向进行筛选
     * @param addNodePos 设置添加单元的坐标
     * @param showAddDirectly 是否显示直接添加和拖动添加两个模式，否则只有直接添加一个模式，默认为 true
     */
    showAddNodePanel: (screenPos: Vector2, filterByPortType ?: NodeParamType|undefined, filterByPortDirection ?: NodePortDirection|undefined, addNodePos ?: Vector2, showAddDirectly ?: boolean) => void;
    /**
     * 关闭添加单元菜单
     */
    closeAddNodePanel: () => void;
    /**
     * 显示鼠标悬浮信息提示
     * @param text 
     * @returns 
     */
    showEditorHoverInfoTip: (text : string, status?: 'success'|'failed'|'') => void;
    /**
     * 显示鼠标悬浮信息提示
     * @param text 
     * @returns 
     */
    closeEditorHoverInfoTip: () => void;
    /**
     * 显示选择类型菜单
     * @param canbeExecute 是否可以选择执行类型  
     * @param canbeAny 是否可以选择any类型 
     * @param screenPos 显示位置（屏幕坐标） 
     */
    showSelectTypePanel(screenPos: Vector2, canbeExecute: boolean, canbeAny: boolean, canBeArrayOrSetOrDict: boolean): Promise<NodeParamType>;
    /**
     * 关闭选择类型菜单
     */
    closeSelectTypePanel(): void;
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
    /**
     * 显示对话框
     * @returns 
     */
    showModal: (options: AlertProps) => void;
    /**
     * 显示对话框
     * @returns 
     */
    showConfirm: (options: AlertProps) => Promise<boolean>;
  },
}