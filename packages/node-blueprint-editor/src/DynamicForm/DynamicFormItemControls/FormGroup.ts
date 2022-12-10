export interface FormGroupProps {
  /**
   * 标题
   */
  title: string
  /**
   * 栅格间隔，可以写成像素值或支持响应式的对象写法来设置水平间隔 { xs: 8, sm: 16, md: 24}。或者使用数组形式同时设置 [水平间距, 垂直间距]
   */
  gutter: unknown,
  /**
   * flex 布局下的水平排列方式：
   */
  justify: 'start'|'end'|'center'|'space-around'|'space-between';
}