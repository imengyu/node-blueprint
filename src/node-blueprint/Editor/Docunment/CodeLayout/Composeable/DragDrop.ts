import { inject, ref, type Ref } from "vue";
import type { CodeLayoutConfig, CodeLayoutContext, CodeLayoutDragDropReferencePosition, CodeLayoutPanelInternal } from "../CodeLayout";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";
import { createMiniTimeOut } from "./MiniTimeout";

export function getDropPanel(event: DragEvent, context: CodeLayoutContext) {
  const data = event.dataTransfer?.getData('text/plain');
  if (data && data.startsWith('CodeLayoutPanel:'))
    return context.instance.getPanelByName(data.substring(16));
  return undefined;
}

export function checkDropPanelDefault(
  dragPanel: CodeLayoutPanelInternal,
  referencePanel: CodeLayoutPanelInternal,
  dragOverState: Ref<CodeLayoutDragDropReferencePosition>,
) {
  return (
    dragPanel !== referencePanel
    && (!dragPanel.accept || dragPanel.accept.includes(referencePanel.parentGrid))
    && (!dragPanel.preDropCheck || dragPanel.preDropCheck(dragPanel, referencePanel.parentGrid, referencePanel, dragOverState.value))
  );
}

let currentDragPanel : null|CodeLayoutPanelInternal = null;

//获取当前的拖拽面板
export function getCurrentDragPanel() {
  return currentDragPanel;
}

//拖拽开始函数封装
export function usePanelDragger() {
  const layoutConfig = inject('codeLayoutConfig') as Ref<CodeLayoutConfig>;

  function handleDragStart(panel: CodeLayoutPanelInternal, ev: DragEvent) {
  
    const userCancel = layoutConfig.value.onStartDrag?.(panel) ?? false;
    if (userCancel)
      return;

    currentDragPanel = panel;
    (ev.target as HTMLElement).classList.add("dragging");
    if (ev.dataTransfer)
      ev.dataTransfer.setData("text/plain", `CodeLayoutPanel:${panel.name}`);
  }
  function handleDragEnd(ev: DragEvent) {
    if (currentDragPanel) {
      layoutConfig.value.onEndDrag?.(currentDragPanel);
      currentDragPanel = null;
    }
    (ev.target as HTMLElement).classList.remove("dragging");
  }
  return {
    handleDragStart,
    handleDragEnd,
  }
}

//拖拽进入和悬浮效果控制
export function usePanelDragOverDetector(
  container: Ref<HTMLElement|undefined>,
  selfPanel: Ref<CodeLayoutPanelInternal>|undefined,
  horizontal: Ref<boolean>|undefined,
  context: CodeLayoutContext,
  focusPanel: () => void,
  dragoverChecking?: ((dragPanel: CodeLayoutPanelInternal) => boolean)|undefined,
) {
  
  const dragEnterState = ref(false);
  const dragOverState = ref<CodeLayoutDragDropReferencePosition>('');
  const focusTimer = createMiniTimeOut(600, focusPanel);
  const delayLeaveTimer = createMiniTimeOut(200, () => {
    dragOverState.value = '';
  });
  let currentDropBaseScreenPos = 0;

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer)
      return;

    delayLeaveTimer.stop();
      

    //检查面板，必须存在面板，并且不能是自己或者自己的父级
    const panel = getCurrentDragPanel();
    if (
      panel
      && horizontal
      && selfPanel && panel !== selfPanel.value 
      && !panel.children.includes(selfPanel.value)
      && (!dragoverChecking || dragoverChecking(panel))
    ) {
      e.preventDefault();
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';
  
      const pos = (horizontal.value ? e.x : e.y) - currentDropBaseScreenPos;
      dragOverState.value = (pos > (horizontal.value ? 
        container.value!.offsetWidth : 
        container.value!.offsetHeight) / 2
      ) ? 'drag-over-next' : 'drag-over-prev';
    } else {
      dragOverState.value = '';
      e.stopPropagation();
      e.dataTransfer.dropEffect = 'none';
    }
  }
  function handleDragEnter(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    
    focusTimer.start();
    delayLeaveTimer.stop();

    if (horizontal)
      currentDropBaseScreenPos = horizontal.value ? 
          HtmlUtils.getLeft(container.value!) : 
          HtmlUtils.getTop(container.value!);
    dragEnterState.value = true;

    handleDragOver(e);
  }
  function handleDragLeave(e: DragEvent) {
    e.preventDefault();
    e.stopPropagation();
  
    let node = e.target;
    while(node) {
      if (node === container.value) {
        dragEnterState.value = false;
        focusTimer.stop();
        delayLeaveTimer.start();
        return;
      }
      node = (node as HTMLElement).parentNode;
    }
  }
  function resetDragOverState() {
    focusTimer.stop();
    dragEnterState.value = false;
    dragOverState.value = '';
  }

  return {
    dragEnterState,
    dragOverState,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    resetDragOverState,
  }
}