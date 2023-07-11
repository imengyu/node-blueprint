import { onMounted, ref } from "vue";
import { NodeGraphEditorViewport, type NodeGraphEditorInternalContext } from "../NodeGraphEditor";
import { ChunkedPanel } from "../Cast/ChunkedPanel";

/**
 * 编辑器的视图功能控制器
 * @param options 
 * @returns 
 */
export function useEditorViewPortController(context: NodeGraphEditorInternalContext) {
  
  const chunkedPanel = new ChunkedPanel()
  const cursor = ref('default');
  const viewPort = ref<NodeGraphEditorViewport>(new NodeGraphEditorViewport());

  //缩放功能
  function mouseWhellEvent(e: WheelEvent) {
    const mouseInfo = context.getMouseInfo();
    if (e.deltaY !== 0) {
      if (e.deltaY < 0) {
        //放大
        if (Math.abs(viewPort.value.scale - 1) <= 0.01) {
          //参考ue，放大到100后停止，需要按住ctrl才能继续放大
          if (context.isKeyControlDown()) 
            viewPort.value.scaleAndCenter(Math.min(2, viewPort.value.scale + 0.05), mouseInfo.mouseCurrentPosScreen);
           else
            viewPort.value.scaleAndCenter(1, mouseInfo.mouseCurrentPosScreen);
        } else {
          viewPort.value.scaleAndCenter(Math.min(2, viewPort.value.scale + 0.05), mouseInfo.mouseCurrentPosScreen);
        }
      } else {
        //缩小
        viewPort.value.scaleAndCenter(Math.max(0.5, viewPort.value.scale - 0.05), mouseInfo.mouseCurrentPosScreen);
      }
    }
  }

  //基础控制
  context.getBaseChunkedPanel = () => chunkedPanel;
  context.getViewPort = () => viewPort.value as NodeGraphEditorViewport;
  context.setCursor = (v: string) => { cursor.value = v };
  context.resetCursor = () => { cursor.value = 'default' };

  onMounted(() => {
    context.getMouseHandler().pushMouseWhellHandlers(mouseWhellEvent);
  });

  return {
    chunkedPanel,
    cursor,
    viewPort,
  }
}