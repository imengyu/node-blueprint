import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import type { NodeGraphEditorContext } from "../Graph/NodeGraphEditor";

export interface NodeDocunmentEditorContext {
  /**
   * 打开图表
   * @param graph 
   */
  openGraph(graph: NodeGraph) : void;
  /**
   * 关播指定的图表
   * @param graph 
   */
  closeGraph(graph: NodeGraph) : void;
  /**
    * 切换图表至当前激活的图表
    * @param graph 
    */
  switchActiveGraph(graph: NodeGraph) : void;
  /**
    * 获取当前激活的图表
    * @param graph 
    */
  getActiveGraph() : NodeGraph|undefined;
  /**
   * 获取当前激活的图表上下文
   */
  getActiveGraphEditor(): NodeGraphEditorContext | undefined;
  /**
  * 关播所有打开的图表
  */
  closeAllGraph() : void;
}