import BaseNodes from "@/node-blueprint/Nodes/Lib/BaseNodes";
import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { NodeRegistry } from "@/node-blueprint/Base/Flow/Registry/NodeRegistry";
import { useDragEnterLeaveFilter } from "../../Composeable/DragEnterLeaveFilter";

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

  //预检测拖放数据是否允许拖放
  function preCheckDragData() : { message: string, canDrop: boolean } {
    const data = getInternalDraggingData<string>() || '';
    console.log('preCheckDragData', data);
    
    if(data && data.startsWith('drag:')) {
      const datav = data.split(':');
      switch(datav[1]) {
        case 'node':
          return { canDrop: true, message: '' };
        case 'graph-variable': 
          return { canDrop: true, message: '创建变量引用' }
        case 'graph': {
          const callGraphType = datav[2] as string;
          const callGraphName = datav[3] as string;

          if (callGraphType === 'function')
            return { canDrop: true, message: '创建函数调用' }
          if (callGraphType === 'subgraph') {
            const graph = context.getCurrentGraph();
            if (callGraphName ? graph.children.find(v => v.name === callGraphName) : undefined)
              return { canDrop: true, message: '创建子图表调用' }
            else
              return { canDrop: false, message: '仅可以调用当前层的级下一级子图表，如果需要递归，请包装为函数' }
          }
          break;
        }
      }
    }
    return { canDrop: false, message: '不能拖放至这里' }
  }

  const {
    onDragEnter,
    onDragLeave,
    reset,
  } = useDragEnterLeaveFilter(
    (e) => {
      //预检测拖放数据是否允许拖放，给用户提示
      const { canDrop, message } = preCheckDragData();
      if (canDrop) {
        if (message)
          context.showEditorHoverInfoTip(message, 'success');
        else
          context.closeEditorHoverInfoTip();
        e.dataTransfer!.dropEffect = 'copy';
      } else {
        context.showEditorHoverInfoTip(message, 'failed');
        e.dataTransfer!.dropEffect = 'none';
      }
    },
    () => {
      context.closeEditorHoverInfoTip();
    },
  );
  function onDragOver(e: DragEvent) {
    if (getInternalDraggingData()) {
      e.preventDefault();
      e.stopPropagation();
      context.updateMousePos(e);
    }
  }

  //拖放处理
  function onDrop(e: DragEvent) {
    context.updateMousePos(e);
    context.closeEditorHoverInfoTip();
    reset();

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
          context.userAddNode(nodeDefine, {  
            addNodeInPos: pos, 
            intitalOptions: {
              callGraphType: datav[2],
              callGraphName: datav[3]
            }
          });
          break;
        }
        //拖拽节点
        case 'node': {
          const pos = context.getMouseInfo().mouseCurrentPosViewPort;
          const node = NodeRegistry.getInstance().getNodeByGUID(datav[2]);
          if (node)
            context.userAddNode(node, { addNodeInPos: pos });
          else
            context.userActionAlert('error', '无法找到对应节点GUID：' + datav[2]);
          context.closeAddNodePanel();
          break;
        }
      }
    }
  }

  return {
    onDragEnter,
    onDragLeave,
    onDrop,
    onDragOver,
    startInternalDataDragging,
    getInternalDraggingData,
  }
}