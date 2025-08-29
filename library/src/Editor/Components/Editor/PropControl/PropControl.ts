
export interface PropControlItemRegistryItem {
  componentInstance: unknown;
  valueName: string;
  additionalProps: Record<string, unknown>;
}

const PropControlItemRegistryData = new Map<string, PropControlItemRegistryItem>();

/**
 * 动态表单组件注册器。
 * 
 * 您可以在这里调用 registerPropControlItemControl 注册自定义表单控件
 */
export const PropControlItemRegistry = {
  /**
   * 查找已注册的表单组件，如果未找到，则返回 null
   * @param type 唯一类型名称
   */
  findPropControlItemByType(type: string) : PropControlItemRegistryItem|null {
    return PropControlItemRegistryData.get(type) || null;
  },
  /**
   * 注册自定义表单控件
   * @param type 唯一类型名称
   * @param componentInstance 组件类
   * @param additionalProps 组件的附加属性，将会设置到渲染函数上
   * @param valueName 用于指定表单子组件的双向绑定值属性名称，默认是 value
   */
  registerPropControlItemControl(type: string, componentInstance: unknown, additionalProps: Record<string, unknown> = {}, valueName = 'modelValue') : void {
    if (PropControlItemRegistryData.has(type)) {
      console.warn('[PropControlItemRegistry] Type ' + type + ' already exists and cannot be registered twice.');
      return;
    }
    PropControlItemRegistryData.set(type, { componentInstance, additionalProps, valueName });
  },
  /**
   * 取消注册自定义表单控件
   * @param type 唯一类型名称
   */
  unregisterPropControlItemControl(type: string) : void {
    if (!PropControlItemRegistryData.has(type)) {
      console.warn('[PropControlItemRegistry] Can not unregister nonexistent type ' + type + ' .');
      return;
    }
    PropControlItemRegistryData.delete(type);
  },
};