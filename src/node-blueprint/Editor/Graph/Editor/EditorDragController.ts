import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { NodeRegistry } from "@/node-blueprint/Base/Flow/Registry/NodeRegistry";

/**
 * 流程图用户拖拽管理器
 * @param options 
 * @returns 
 */
export function useEditorDragController(context: NodeGraphEditorInternalContext) {

  //拖放处理
  function onDrop(e: DragEvent) {
    context.updateMousePos(e);

    const data = e.dataTransfer?.getData('text/plain') || '';
    if(data && data.startsWith('drag:')) {
      const datav = data.split(':');
      switch(datav[1]) {
        //TODO: case 'graph-variable': this.showAddVariableMenu(datav[3]); break;
        // case 'graph': {
        //   let block = new BlockEditor(BaseBlocks.getScriptBaseGraphCall());
        //   block.options['graph'] = datav[2];
        //    let pos = this.editorWorker.getMouseCurrentPosInViewPort();
        //   let zoom = this.viewZoom;
        //   this.editorWorker.addBlock(block, new Vector2(pos.x / zoom, pos.y / zoom));
        //   break;
        // }
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
  }
}