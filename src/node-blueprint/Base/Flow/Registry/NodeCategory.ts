import type { INodeDefine } from "../Node/Node";

/**
 * 单元分类的结构
 */
export type CategoryData = {
  category: string;
  childCategories: Array<CategoryData>;
  nodes: Array<CategoryDataItem>;
  open: boolean;
  show: boolean;
  filterShow: boolean;
};
export type CategoryDataItem = {
  define: INodeDefine;
  show: boolean;
  filterShow: boolean;
  hideInAddPanel: boolean;
  grouped: boolean;
  categoryObject: CategoryData|null,
};