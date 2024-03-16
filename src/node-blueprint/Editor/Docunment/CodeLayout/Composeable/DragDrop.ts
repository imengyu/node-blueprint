import { inject, ref, type Ref } from "vue";
import type { CodeLayoutConfig, CodeLayoutDragDropReferencePosition, CodeLayoutPanelInternal } from "../CodeLayout";
import HtmlUtils from "@/node-blueprint/Base/Utils/HtmlUtils";
import { createMiniTimeOut } from "./MiniTimeout";

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

const dragPanelState = ref(false);

//拖拽开始函数封装
export function usePanelDragger() {
  const layoutConfig = inject('codeLayoutConfig') as Ref<CodeLayoutConfig>;
  const cornerSize = 40;
  const dragSelfState = ref(false);

  function draggingMouseMoveHandler(e: MouseEvent) {    
    if (e.x < cornerSize) {
      layoutConfig.value.primarySideBar = true;
    } 
    if (e.x >= window.innerWidth - cornerSize) {
      layoutConfig.value.secondarySideBar = true;
    }
    if (e.y >= window.innerHeight - cornerSize) {
      layoutConfig.value.bottomPanel = true;
    }
  }

  function handleDragStart(panel: CodeLayoutPanelInternal, ev: DragEvent) {
  
    const userCancel = layoutConfig.value.onStartDrag?.(panel) ?? false;
    if (userCancel)
      return;

    currentDragPanel = panel;
    (ev.target as HTMLElement).classList.add("dragging");
    dragSelfState.value = true;
    dragPanelState.value = true;
    document.addEventListener('dragover', draggingMouseMoveHandler);
  }
  function handleDragEnd(ev: DragEvent) {
    if (currentDragPanel) {
      layoutConfig.value.onEndDrag?.(currentDragPanel);
      currentDragPanel = null;
    }
    (ev.target as HTMLElement).classList.remove("dragging");

    dragSelfState.value = false;
    dragPanelState.value = false;
    document.removeEventListener('dragover', draggingMouseMoveHandler);
  }
  return {
    dragSelfState,
    handleDragStart,
    handleDragEnd,
  }
}

//拖拽进入和悬浮效果控制
export function usePanelDragOverDetector(
  container: Ref<HTMLElement|undefined>,
  selfPanel: Ref<CodeLayoutPanelInternal>|undefined,
  horizontal: Ref<boolean>|'four'|'center',
  focusPanel: () => void,
  dragoverChecking?: ((dragPanel: CodeLayoutPanelInternal) => boolean)|undefined,
) {
  
  const dragEnterState = ref(false);
  const dragOverState = ref<CodeLayoutDragDropReferencePosition>('');
  const focusTimer = createMiniTimeOut(600, focusPanel);
  const delayLeaveTimer = createMiniTimeOut(200, () => {
    dragOverState.value = '';
  });
  let currentDropBaseScreenPosX = 0;
  let currentDropBaseScreenPosY = 0;

  function handleDragOver(e: DragEvent) {
    if (!e.dataTransfer)
      return;

    delayLeaveTimer.stop();

      
    //检查面板，必须存在面板，并且不能是自己或者自己的父级
    const panel = getCurrentDragPanel();
    // 如果是内部拖拽数据，则不应该让浏览器处理弹出窗口
    if (panel)
      e.preventDefault();
    if (
      panel
      && selfPanel && panel !== selfPanel.value 
      && !panel.children.includes(selfPanel.value)
      && (!dragoverChecking || dragoverChecking(panel))
    ) {
      if (!container.value)
        return;

      e.stopPropagation();
      e.dataTransfer.dropEffect = 'copy';

      if (horizontal === 'four') {
        const posX = (e.x - currentDropBaseScreenPosX);
        const posY = (e.y - currentDropBaseScreenPosY);

        if (posX < container.value.offsetWidth / 4) {
          dragOverState.value = 'left';
        } else if (posX > container.value.offsetWidth - container.value.offsetWidth / 4) {
          dragOverState.value = 'right';
        } else if (posY < container.value.offsetHeight / 4) {
          dragOverState.value = 'up';
        } else if (posY > container.value.offsetHeight - container.value.offsetHeight / 4) {
          dragOverState.value = 'down';
        } else  {
          dragOverState.value = 'center';
        } 
      } else if (horizontal === 'center') {
        dragOverState.value = 'center';
      } else if (horizontal) {
        const pos = (horizontal.value ? 
          (e.x - currentDropBaseScreenPosX) : 
          (e.y - currentDropBaseScreenPosY)
        ) ;
        dragOverState.value = (pos > (horizontal.value ? 
          container.value.offsetWidth : 
          container.value.offsetHeight) / 2
        ) ? 
          (horizontal.value ? 'right' : 'down')
           : (horizontal.value ? 'left' : 'up');
      } else {
        dragOverState.value = '';
        e.stopPropagation();
        e.dataTransfer.dropEffect = 'none';
      }

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

    currentDropBaseScreenPosX = HtmlUtils.getLeft(container.value!);
    currentDropBaseScreenPosY = HtmlUtils.getTop(container.value!);
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
        dragOverState.value = '';
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
    dragPanelState,
    dragEnterState,
    dragOverState,
    handleDragOver,
    handleDragEnter,
    handleDragLeave,
    resetDragOverState,
  }
}