import type { NodeEditor } from "@/Core/Editor/NodeEditor";
import type { EditorHistoryNodeInfo } from "../History/InfoStorage";
import type { NodeGraph } from "@/Core/Graph/NodeGraph";
import type { IGraphCallNodeOptions } from "@/Nodes/Lib/BaseNodes";
import { EditorHistoryAction } from "../History/Action";
import { printError } from "@/Common/Logger/DevLog";
import BaseNodes from "@/Nodes/Lib/BaseNodes";

interface PromoteSubgraphToFunctionRestoreData {
  graph: NodeGraph;
  graphOldParent: NodeGraph;
  mainGraph: NodeGraph;
  callGraphName: string;
}

const TAG = "PromoteSubgraphToFunctionAction";

export class PromoteSubgraphToFunctionAction extends EditorHistoryAction<EditorHistoryNodeInfo, PromoteSubgraphToFunctionRestoreData, void> {
  constructor(node: NodeEditor) {
    super("提升图表节点为函数", (actionContext) => actionContext.toNodeInfo(node));
  }

  protected override async onStepExecute(inputParams: EditorHistoryNodeInfo) {
    //将图表类型更改为函数或者静态函数
    //移动图表至文档根
    //更改调用节点设置
    const node = inputParams.requestInstance();
    const options = (node.options as unknown as IGraphCallNodeOptions);
    const callGraphName = options.callGraphName;
    const graph = this.context.graphManager.getCurrentGraph().getChildGraphByName(callGraphName);
    if (!graph) {
      printError(TAG, null, `Not found graph for node ${node.uid}`);
      return;
    }
    const doc = graph.getParentDocunment();
    if (!doc) {
      printError(TAG, null, `Not found ParentDocunment for graph ${graph.uid}`);
      return;
    }
    const mainGraph = doc.mainGraph;
    if (!mainGraph) {
      printError(TAG, null, `Not found mainGraph for doc ${doc.name}`);
      return;
    }

    const restoreData = {
      graph,
      graphOldParent: graph.parent as NodeGraph,
      mainGraph,
      callGraphName,
    };

    graph.type = mainGraph.type === 'class' ? 'function' : 'static';

    restoreData.graphOldParent.removeChildren(graph);
    mainGraph.addChildren(graph);

    this.context.graphManager.sendMessageToFilteredNodes(`GraphCall${callGraphName}`, BaseNodes.messages.GRAPH_PROMOTE, { type: 'function' });
    return restoreData;
  }
  protected override async onStepUndo(restoreData: PromoteSubgraphToFunctionRestoreData) {
    restoreData.mainGraph.removeChildren(restoreData.graph);
    restoreData.graphOldParent.addChildren(restoreData.graph);

    this.context.graphManager.sendMessageToFilteredNodes(`GraphCall${restoreData.callGraphName}`, BaseNodes.messages.GRAPH_PROMOTE, { type: 'subgraph' });
  }

}