import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { NodeRegistry } from "@/node-blueprint/Base/Flow/Registry/NodeRegistry";

let editorDragData : any = null;

/**
 * 设置编辑器内部拖拽数据
 * @param data 
 */
export function startInternalDataDragging(data: unknown) {
  editorDragData = data;
}
/**
 * 获取编辑器内部拖拽数据
 * @returns 
 */
export function getInternalDraggingData<T>() : T {
  return editorDragData as T;
}

/**
 * 流程图用户拖拽管理器
 * @param options 
 * @returns 
 */
export function useEditorDragController(context: NodeGraphEditorInternalContext) {


  function onDragOver(e: DragEvent) {
    if (getInternalDraggingData()) 
    {
      e.preventDefault();
      e.stopPropagation();
      context.updateMousePos(e);
    }
  }
  //拖放处理
  function onDrop(e: DragEvent) {
    context.updateMousePos(e);

    const data = getInternalDraggingData<string>() || '';
    if(data && data.startsWith('drag:')) {
      const datav = data.split(':');
      switch(datav[1]) {
        //拖拽变量
        case 'graph-variable': 
          context.showAddVariableMenu(datav[3], (action) => 
            context.userAddVariableNode(datav[2], datav[3], action)
          ); 
          break;
        //拖拽子图表
        case 'graph': {
          const pos = context.getMouseInfo().mouseCurrentPosViewPort;
          const nodeDefine = BaseNodes.getScriptBaseGraphCall();
          context.userAddNode(nodeDefine, pos, {
            callGraphName: datav[3]
          });
          break;
        }
        //拖拽节点
        case 'node': {
          const pos = context.getMouseInfo().mouseCurrentPosViewPort;
          const node = NodeRegistry.getInstance().getNodeByGUID(datav[2]);
          if (node)
            context.userAddNode(node, pos);
          else
            context.userActionAlert('error', '无法找到对应节点GUID：' + datav[2]);
          context.closeAddNodePanel();
          break;
        }
      }
    }
  }

  return {
    onDrop,
    onDragOver,
    startInternalDataDragging,
    getInternalDraggingData,
  }
}