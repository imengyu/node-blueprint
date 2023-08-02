import type { Slot } from "vue";

/**
 * 属性栏条目定义
 */
export interface PropControlItem {
  /**
   * 组件名称，与 registerPropControlItemControl 提供名称一致
   */
  type: string,
  /**
   * 属性栏标题
   */
  title: string,
  /**
   * 子组件，仅 group 组件有效
   */
  children?: PropControlItem[],
  /**
   * 附加传递到组件上的属性
   */
  additionalProps?: unknown,
  /**
   * 附加传递到组件上的事件
   */
  additionalEvents?: Record<string, Function>,  
  /**
  * 附加组件插槽。
  */
  additionalSlot?: Record<string, Slot>;
  /**
   * 加载时的钩子函数
   * @param nowValue 当前组件的实例
   * @param getComponentRef 当前组件的实例
   * @returns 
   */
  mounted?: (getComponentRef: () => unknown) => void;
  /**
  * 当前表单组件卸载之前的钩子函数
  * @param componentRef 当前组件的实例
  * @returns 
  */
  beforeUnmount?: (componentRef: () => unknown) => void;
  /**
   * 获取当前条目是否应该显示，如果不提供此函数，则默认显示。
   * @returns 
   */
  getVisible?: () => boolean,
  /**
   * 获取参数回调
   * @returns 
   */
  getValue?: () => unknown,
  /**
   * 用户更新参数回调
   * @param newValue 
   * @returns 
   */
  onUpdateValue?: (newValue: unknown, componentRef: () => unknown) => void,
}