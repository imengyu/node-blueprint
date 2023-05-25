export interface NodeGraphEditorZoomToolContext {
  /**
   * 执行缩小操作
   */
  zoomOut(): void;
  /**
   * 执行放大操作
   */
  zoomIn(): void;
  /**
   * 设置缩放大小
   * @param zoom 大小，为 50-200
   */
  zoomSet(zoom: number): void;
}