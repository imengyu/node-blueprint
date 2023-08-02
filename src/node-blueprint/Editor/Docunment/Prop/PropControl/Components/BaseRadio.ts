export interface BaseRadioProps {
  /**
   * 是否禁用
   */
  disabled: boolean;
  /**
   * 选项数据
   */
  items: {
    label: string,
    value: string|number,
  }[];
  /**
   * 选择值
   */
  value: unknown;
}