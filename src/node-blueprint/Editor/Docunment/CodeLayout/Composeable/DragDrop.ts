import type { CodeLayoutContext, CodeLayoutPanelInternal } from "../CodeLayout";

export function getDropPanel(event: DragEvent, context: CodeLayoutContext) {
  const data = event.dataTransfer?.getData('text/plain');
  if (data && data.startsWith('CodeLayoutPanel:')) {

  }
}

export function usePanelDragger() {
  function handleDragStart(panel: CodeLayoutPanelInternal, ev: DragEvent) {
    (ev.target as HTMLElement).classList.add("dragging");
    if (ev.dataTransfer)
      ev.dataTransfer.setData("text/plain", `CodeLayoutPanel:${panel.name}`);
  }
  function handleDragEnd(ev: DragEvent) {
    (ev.target as HTMLElement).classList.remove("dragging");
  }
  return {
    handleDragStart,
    handleDragEnd,
  }
}