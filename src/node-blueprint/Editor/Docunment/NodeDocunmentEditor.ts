import type { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";

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
  * 关播所有打开的图表
  */
  closeAllGraph() : void;
}