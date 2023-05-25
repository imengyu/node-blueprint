
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { onBeforeUnmount, onMounted, type Ref, ref } from "vue";
import type { INodeGraphEditorBackgroundRenderer, INodeGraphEditorRenderer } from "../Render/Render";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";

/**
 * 当前全局索引编辑器信息
 * @returns 
 */
export function useEditorSizeChecker(editorHost : Ref<HTMLElement|undefined>, viewPort : Ref<NodeGraphEditorViewport>) {

  const backgroundRenderer = ref<INodeGraphEditorBackgroundRenderer>();
  const foregroundRenderer = ref<INodeGraphEditorRenderer>();

  const lastViewSize = new Vector2();
  let tickCheckTimer = 0;

  function onWindowSizeChanged() {
    const ele = editorHost.value;
    if(ele) {
      const x = ele.offsetWidth, y = ele.offsetHeight;
      if(backgroundRenderer.value)
        backgroundRenderer.value.onWindowSizeChanged(x, y);
      if(foregroundRenderer.value)
        foregroundRenderer.value.onWindowSizeChanged(x, y);
      viewPort.value.size.set(ele.offsetWidth, ele.offsetHeight);
    }
  }

  //每个tick运行的检查函数
  function onEditorCheckTick() {
    const ele = editorHost.value;
    if(ele) {
      const x = ele.offsetWidth, y = ele.offsetHeight;
      if(x !== lastViewSize.x || y !== lastViewSize.y) {
        lastViewSize.set(x, y);
        onWindowSizeChanged();
      }
      //更新绝对坐标
      updateEditorAbsolutePos();
    }
  }
  function updateEditorAbsolutePos() {
    const ele = editorHost.value;
    if(ele) {
      //更新绝对坐标
      viewPort.value.editorAbsolutePos.set(HtmlUtils.getLeft(ele), HtmlUtils.getTop(ele));
    }
    return viewPort.value.editorAbsolutePos;
  }

  onMounted(() => {
    tickCheckTimer = setInterval(onEditorCheckTick) as unknown as number;
    window.addEventListener('resize', onWindowSizeChanged);
  })
  onBeforeUnmount(() => {
    clearInterval(tickCheckTimer);
    window.removeEventListener('resize', onWindowSizeChanged);
  });

  return {
    backgroundRenderer,
    foregroundRenderer,
    onWindowSizeChanged,
  }
}