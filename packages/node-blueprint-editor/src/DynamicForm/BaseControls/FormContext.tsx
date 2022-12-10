import { InjectionKey, inject, provide, Ref } from "vue";

export type ValidTrigger = "blur" | "change" | "submit";

export type FormItemContext = {
  getFieldName: () => string,
  onFieldBlur: () => void;
  onFieldChange: (newValue: unknown) => void;
  clearValidate: () => void;
};
export type FormItemInternalContext = {
  getFieldName: () => string,
  getValidateTrigger: () => ValidTrigger;
  getUniqueId: () => string,
  setErrorState: (errorMessage: string|null) => void;
};

export type FormContext = {
  onFieldBlur: (item: FormItemInternalContext) => void;
  onFieldChange: (item: FormItemInternalContext, newValue: unknown) => void;
  clearValidate: (item: FormItemInternalContext) => void;
  addFormItemField: (item: FormItemInternalContext) => number;
  removeFormItemField: (item: FormItemInternalContext) => void;
  //form props
  validateTrigger: Ref<ValidTrigger>;
  hideRequiredMark: Ref<boolean>;
  colon: Ref<boolean>;
  labelAlign: Ref<string>;
  labelCol: Ref<Record<string, unknown>>;
  wrapperCol: Ref<Record<string, unknown>>;
  showLabel: Ref<boolean>;
  name: Ref<string>;
  getItemValue: (item: FormItemInternalContext) => unknown;
};

export const FormItemContextContextKey: InjectionKey<FormItemContext> = Symbol('ContextProps');

export function useInjectFormItemContext() : FormItemContext {
  const context = inject<FormItemContext>(FormItemContextContextKey);
  provide(FormItemContextContextKey, {} as FormItemContext);
  return context as FormItemContext;
}
