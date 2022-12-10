import { Ref } from "vue";
import { Form } from "./BaseControls/Form";
import { ColProps } from "./BaseControls/Layout";
import { DynamicFormItemRegistryItem } from "./DynamicFormItemRenderer/DynamicFormItemRegistry";

export interface DynamicFormModel { 
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [index: string]: any;
}

export interface IDynamicFormItem {
  /**
   * 当前表单类型
   */
  type: string;
  /**
   * 显示当前条目的附加条件
   */
  showCondition?: (model: DynamicFormModel, item: IDynamicFormItem) => boolean;
  /**
   * 附加组件属性
   */
  additionalProps?: unknown;
  /**
   * 附加FormItem组件属性
   */
  formProps?: Record<string, unknown>;
  /**
   * 当前表单名称
   */
  name: string;
  /**
   * 当前表单说明文字
   */
  label: string;
  /**
   * 当前表单是否必填
   */
  required?: boolean,
  /**
   * 子条目。仅在 object 或者其他容器条目中有效。
   */
  children?: IDynamicFormItem[];
  /**
   * 当子对象为数组时，需要这个，用于添加按钮新建一个对象，如果这个函数为空，则没有添加按钮。
   */
  newChildrenObject?: () => unknown;
  /**
   * 子条目的 a-col 配置属性(应用到当前条目的所有子条目上)。仅在 object 或者其他容器条目中有效。
   */
  childrenColProps?: ColProps,
  /**
   * 子条目的 a-col 配置属性(应用到当前条目上)。仅在 object 或者其他容器条目中有效。
   */
  colProps?: ColProps,
}

export interface IDynamicFormOptions {
  /**
   * 表单绑定的数据对象
   */
  model?: DynamicFormModel;
  /**
   * 表单条目数据
   */
  formItems: IDynamicFormItem[];
  /**
   * 表单的校验规则
   */
  formRules?: Record<string, unknown>;
  /**
   * 表单的其他自定义属性
   */
  formProps?: Record<string, unknown>;
  /**
   * 自定义重写表单控件。你可以重写内置控件，在这个表单中会以此重写列表为先查找表单组件。
   */
  widgets?: Record<string, DynamicFormItemRegistryItem>,
  /**
   * 表单是否禁用。默认否
   */
  disabled?: boolean,
  /**
   * 引用form实例
   */
  formRef?: Ref<Form>,
}
