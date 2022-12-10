import { defineComponent, PropType, ref, inject, toRefs, provide, defineExpose, onBeforeUnmount } from 'vue';
import { FormContext, FormItemContextContextKey, FormItemInternalContext, ValidTrigger } from './FormContext';
import Col from './Layout/Col.vue';
import Row from './Layout/Row.vue';

export interface FormItemProps {
  /**
   * 输入框左侧文本
   */
  label?: string;
  /**
   * 名称，作为提交表单时的标识符
   */
  name?: string;
  /**
   * 是否禁用输入框
   */
  disabled?: boolean;
  /**
   * 是否内容垂直居中
   */
  center?: boolean;
  /**
   * 是否在 label 后面添加冒号
   */
  colon?: boolean;
  /**
   * 是否必填
   */
  required?: boolean;
  /**
   * 是否显示表单必填星号
   */
  showRequiredBadge?: boolean;
  /**
   * 左侧文本对其
   */
  labelAlign?: 'left'|'center'|'right';
  /**
   * 左侧文本的flex占比，默认是2
   */
  labelCol?: number;
  /**
   * 输入框的flex占比
   */
  wrapperCol?: number;
  /**
   * 左侧文本的样式
   */
  labelStyle?: unknown;
  /**
   * 左侧文本的颜色
   */
  labelColor?: string;
  /**
   * 左侧文本的禁用颜色
   */
  labelDisableColor?: string;
  /**
   * 设置字段校验的时机
   * * onBlur 文本框失去焦点时校验
   * * onValueChange 数值更改时校验
   * * onSubmit 提交时校验(默认)
   */
  validateTrigger?: ValidTrigger;
  /**
   * 是否显左边标题，默认是
   */
  showLabel?: boolean;
}

/**
 * 表单条目组件。
 */
export default defineComponent({
  props: {
    label: {
      type: String,
      default: "",
    },
    name: {
      type: String,
      default: "",
    },
    disabled: {
      type: Boolean,
      default: false,
    },
    center: {
      type: Boolean,
      default: false,
    },
    colon: {
      type: Boolean,
      default: true,
    },
    required: {
      type: Boolean,
      default: false,
    },
    showRequiredBadge: {
      type: Boolean,
      default: true,
    },
    labelAlign: {
      type: String as PropType<'start' | 'end' | 'left' | 'right' | 'center' | 'justify' | 'match-parent'>,
      default: "",
    },
    labelCol: {
      type: Object,
      default: null
    },
    wrapperCol: {
      type: Object,
      default: null
    },
    labelStyle: {
      type: Object,
      default: null
    },
    labelColor: {
      type: String,
      default: "",
    },
    labelDisableColor: {
      type: String,
      default: "",
    },
    validateTrigger: {
      type: String as PropType<ValidTrigger>,
      default: 'onSubmit',
    },
    showLabel: {
      type: Boolean,
      default: true,
    },
  },
  components: { 
    Col, 
    Row,
  },
  setup(props, ctx) {
    const formContextProps = inject<FormContext>('formContext');
    const { slots } = ctx;
    const { 
      name,
      showLabel, label, labelCol, wrapperCol, disabled, required, colon, center,
      labelDisableColor, labelColor, labelAlign, labelStyle, showRequiredBadge, 
      validateTrigger,
    } = toRefs(props);

    const error = ref<string|null>(null);

    //Context for parent
    const formItemInternalContext = {
      getValidateTrigger: () => validateTrigger.value || formContextProps?.validateTrigger.value || 'submit',
      getFieldName: () => name.value,
      setErrorState(errorMessage) { error.value = errorMessage; },
      getUniqueId,
    } as FormItemInternalContext;

    //Context for custom children
    provide(FormItemContextContextKey, {
      getFieldName: () => name.value,
      onFieldBlur: () => {  formContextProps?.onFieldBlur(formItemInternalContext); },
      onFieldChange: (newValue: unknown) => { formContextProps?.onFieldChange(formItemInternalContext, newValue); },
      clearValidate: () => { formContextProps?.clearValidate(formItemInternalContext); },
    });

    //Add ref in form
    const addNumber = formContextProps?.addFormItemField(formItemInternalContext);
    const uniqueId = (formContextProps?.name || 'form') + 'Item' + (name.value || `unknowProperity${addNumber}`);
    
    onBeforeUnmount(() => {
      formContextProps?.removeFormItemField(formItemInternalContext);
    })

    defineExpose({
      error,
    });

    function getUniqueId() {
      return uniqueId;
    }

    return () => {
      
      const defaultVnode = slots.default?.();
      if (defaultVnode && defaultVnode.length > 0) {
        if (!defaultVnode[0].props) 
          defaultVnode[0].props = {};

        //Default value
        defaultVnode[0].props.value = formContextProps?.getItemValue(formItemInternalContext);

        //hijack change and blur
        defaultVnode[0].props.onChange = function (val: unknown) {
          formContextProps?.onFieldChange(formItemInternalContext, this.value || val);
        };
        defaultVnode[0].props.onBlur = function() {
          formContextProps?.onFieldBlur(formItemInternalContext);
        };
      }

      return (
        <Row
          class="dynamic-form-control-item"
          align={center.value ? 'center' : 'flex-start'}
        >
          { 
            (showLabel && formContextProps?.showLabel.value && label) ? 
              <Col
                span={labelCol.value?.span || formContextProps?.labelCol.value?.span}
                offset={labelCol.value?.offset || formContextProps?.labelCol.value?.offset}
              >
                <label style={{
                  color: disabled.value ? labelDisableColor.value : labelColor.value,
                  textAlign: labelAlign.value || formContextProps?.labelAlign.value,
                  ...labelStyle.value,
                }}>
                  { (showRequiredBadge.value && required.value && formContextProps?.hideRequiredMark.value !== true) ? <span class="required">*</span> : <></> }
                  { label.value }
                  { colon.value || formContextProps?.colon.value ? <span class="colon">:</span> : <></> }
                </label>
              </Col> : <></> 
          }
          <Col 
            span={wrapperCol.value?.span || formContextProps?.wrapperCol.value?.span}
            offset={wrapperCol.value?.offset || formContextProps?.wrapperCol.value?.offset}
          >
            <div id={uniqueId}>
              { defaultVnode }
              { 
                error.value ? 
                  <div class="error-message">{ error.value }</div>
                  : <></>
              }
            </div>
          </Col>
        </Row>
      );
    };
  },
});