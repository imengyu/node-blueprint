
export interface RowProps {
  /**
   * 列元素之间的间距（单位为 dp）
   */
  gutter?: number;
  /**
   * 主轴对齐方式，可选值为
   */
  justify?: 'flex-start' | 'flex-end' | 'center' | 'space-between' | 'space-around' | 'space-evenly' | undefined;
  /**
   * 交叉轴对齐方式
   */
  align?: "center" | "flex-start" | "flex-end" | "stretch" | "baseline" | undefined;
  /**
   * 是否自动换行，默认 true
   */
  wrap?: boolean;
}
export interface ColProps {
  /**
   * 列元素偏移距离
   */
  offset?: number;
  /**
   * 列元素宽度
   */
  span?: number;
}

/**
 * 栅格数量
 */
export const GRID_SIZE = 24;