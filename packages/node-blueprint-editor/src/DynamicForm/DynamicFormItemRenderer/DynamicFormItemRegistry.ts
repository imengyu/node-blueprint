
export interface DynamicFormItemRegistryItem {
  componentInstance: unknown;
  valueName: string;
  additionalProps: Record<string, unknown>;
}

const DynamicFormItemRegistryData = new Map<string, DynamicFormItemRegistryItem>();

/**
 * 动态表单组件注册器。
 * 
 * 您可以在这里调用 registerDynamicFormItemControl 注册自定义表单控件
 */
export const DynamicFormItemRegistry = {
  /**
   * 查找已注册的表单组件，如果未找到，则返回 null
   * @param type 唯一类型名称
   */
  findDynamicFormItemByType(type: string) : DynamicFormItemRegistryItem|null {
    return DynamicFormItemRegistryData.get(type) || null;
  },
  /**
   * 注册自定义表单控件
   * @param type 唯一类型名称
   * @param componentInstance 组件类
   * @param additionalProps 组件的附加属性，将会设置到渲染函数上
   * @param valueName 用于指定表单子组件的双向绑定值属性名称，默认是 value
   */
  registerDynamicFormItemControl(type: string, componentInstance: unknown, additionalProps: Record<string, unknown> = {}, valueName = 'value') : void {
    if (DynamicFormItemRegistryData.has(type)) {
      console.warn('[DynamicFormItemRegistry] Type ' + type + ' already exists and cannot be registered twice.');
      return;
    }
    DynamicFormItemRegistryData.set(type, { componentInstance, additionalProps, valueName });
  },
  /**
   * 取消注册自定义表单控件
   * @param type 唯一类型名称
   */
  unregisterDynamicFormItemControl(type: string) : void {
    if (!DynamicFormItemRegistryData.has(type)) {
      console.warn('[DynamicFormItemRegistry] Can not unregister nonexistent type ' + type + ' .');
      return;
    }
    DynamicFormItemRegistryData.delete(type);
  },
};