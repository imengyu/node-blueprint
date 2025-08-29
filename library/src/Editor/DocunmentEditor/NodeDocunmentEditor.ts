import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeGraphEditorContext } from "../Graph/NodeGraphEditor";

export interface NodeDocunmentEditorContext {
  /**
   * 打开图表
   * @param graph 
   * @param noStackHistory 是否不保存导航栏历史记录，默认：false 
   */
  openGraph(graph: NodeGraph, noStackHistory?: boolean) : Promise<void>;
  /**
   * 关播指定的图表
   * @param graph 
   */
  closeGraph(graph: NodeGraph) : void;
  /**
    * 切换图表至当前激活的图表
    * @param graph 
    * @param noStackHistory 是否不保存导航栏历史记录，默认：false 
    */
  switchActiveGraph(graph: NodeGraph, noStackHistory?: boolean) : Promise<void>;
  /**
    * 获取当前激活的图表
    * @param graph 
    */
  getActiveGraph() : NodeGraph|undefined;
  /**
    * 获取其他已打开的图表
    * @param graph 
    */
  getOtherGraphs() : NodeGraph[]|undefined;
  /**
    * 获取已打开的图表
    * @param graph 
    */
  getOpenedGraphs() : NodeGraph[]|undefined;
  /**
   * 获取当前激活的图表上下文
   */
  getActiveGraphEditor(): NodeGraphEditorContext | undefined;
  /**
  * 关播所有打开的图表
  */
  closeAllGraph() : void;
  /**
   * 向打开的编辑器分发消息
   * @param message 消息
   * @param data 消息数据
   */
  dispstchMessage(message: string, data: any) : void;
}