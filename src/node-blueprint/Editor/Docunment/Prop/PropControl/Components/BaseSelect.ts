
export interface IDynamicFormItemSelectOption {
  text: string,
  value: string|number,
}

export interface BaseSelectProps {
  /**
   * 是否禁用
   */
  disabled: boolean;
  /**
   * 选项数据
   */
  options: IDynamicFormItemSelectOption[];
  /**
   * 选择值
   */
  value: unknown;
}