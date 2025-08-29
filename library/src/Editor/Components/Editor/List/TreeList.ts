export const TreeListContextKey = Symbol("TreeListContext");
export interface TreeListContext {
  itemOpen(row: ITreeListItem): void;
  itemClose(row: ITreeListItem): void;
  itemClick(row: ITreeListItem): void;
  itemContextMenu(row: ITreeListItem, e: MouseEvent): void;
}

export const TreeListDefaultDesc : ITreeListDescItem = {
  childrenKey: 'children',
}

export interface ITreeListItem {
  key: string;
  [index: string]: any;
}

export interface ITreeListDescItem {
  openKey?: string,
  childrenKey: string;
}