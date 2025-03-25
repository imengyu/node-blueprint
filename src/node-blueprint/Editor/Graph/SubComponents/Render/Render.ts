export interface INodeGraphEditorBackgroundRenderer {
  onWindowSizeChanged(x: number, y: number) : void;
}
export interface INodeGraphEditorRenderer {
  onWindowSizeChanged: (x: number, y: number) => void;
  addDebugInfoItem(v : () => string): number;
  removeDebugInfoItem(id : number): void;
}
