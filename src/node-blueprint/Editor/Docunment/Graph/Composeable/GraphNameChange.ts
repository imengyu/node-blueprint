import { NodeGraph } from "@/node-blueprint/Base/Flow/Graph/NodeGraph";
import { injectNodeGraphEditorContextInEditorOrIDE } from "../../NodeIde";
import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";

export function useGraphNameChangeHandler() {
  const { getNodeGraphEditorContext, getNodeDocunmentEditorContext } = injectNodeGraphEditorContextInEditorOrIDE();

  function onGraphNameUpdate(graph: NodeGraph, newName: string) {
    const context = getNodeDocunmentEditorContext();
    //检查是否有其他图表也使用了这个名称，如果有则不允许更改
    const oldName = graph.name;
    const parent = graph.parent;
    if (newName !== oldName) {
      if (parent instanceof NodeGraph && parent.children.find(k => k.name === newName)) {
        getNodeGraphEditorContext()?.userActionAlert('warning', `已有一个名为 ${newName} 的图表，请换一个名称`);
        return;
      }
      graph.name = newName;
    }
    //进行图表中所有调用节点的更新
    context?.dispstchMessage('sendMessageToFilteredNodes', { tag: `GraphCall${newName}`, message: BaseNodes.messages.GRAPH_ONLINE, data: {}});
    context?.dispstchMessage('sendMessageToFilteredNodes', { tag: `GraphCall${oldName}`, message: BaseNodes.messages.GRAPH_NAME_CHANGE, data: { name: newName }});
    context?.dispstchMessage('emitEvent', { message: 'GraphNameChangedForUIUpdate', data: undefined });

  }
  
  return {
    onGraphNameUpdate
  }
}