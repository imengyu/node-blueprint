<template>
  <!--表单-->
  <Form
    ref="formEditor"
    :style="{ 
      width: '100%',
      justifyContent: options.grid ? 'flex-end' : undefined,
    }"
    v-bind="options.formProps"
    :rules="options.formRules || {}"
    :model="options.model"
    :labelCol="options.formLabelCol || { span: 6 }"
    :wrapperCol="options.formWrapperCol || { span: 18 }" 
  >
    <!--空显示-->
    <slot name="empty" v-if="options.formItems.length == 0">
      <div class="dynamic-form-item-empty">暂无可供您编辑的数据</div>
    </slot>
    <!--行-->
    <Row
      type="flex"
      :wrap="true"
      justify="space-between"
    >
      <!--行-->
      <Col
        v-for="(item, index) in options.formItems"
        :key="index"
        :span="24"
      >
        <!--表单条目渲染核心-->
        <DynamicFormItem 
          :item="item"
          :model="options.model"
          :disabled="options.disabled"
        >
          <template #formCeil="{ item, model, rule, disabled }">
            <slot name="formCeil" :item="item" :model="model" :rule="rule" :disabled="disabled" />
          </template>
        </DynamicFormItem>
      </Col>
    </Row>
  </Form>
</template>

<script lang="ts">
import { defineComponent, provide, toRefs, ref, watch, onMounted } from 'vue';
import { IDynamicFormOptions } from './DynamicForm';
import DynamicFormItem from './DynamicFormItem.vue';
import Col from './BaseControls/Layout/Col.vue';
import Row from './BaseControls/Layout/Row.vue';
import Form from './BaseControls/Form';

/**
 * 动态表单组件。
 */
export default defineComponent({
  components: {
    DynamicFormItem,
    Col,
    Row,
    Form,
  },
  props: {
    options: {
      type: Object,
      default: null
    },
  },
  setup(props) {
    const options = toRefs(props).options.value as IDynamicFormOptions;

    provide('widgetOvrride', options.widgets || {});
    provide('formRules', options.formRules);
    provide('rawModel', options.model);

    const formEditor = ref();

    watch(formEditor, (v) => {
      if (options.formRef)
        options.formRef.value = v;
    });
    onMounted(() => {
      if (options.formRef)
        options.formRef.value = formEditor.value;
    });

    return {
      formEditor,
    };
  },
});
</script>


<style lang="scss">
@import './Scss/BaseControl.scss';
@import './Scss/Form.scss';

.dynamic-form-item-flow {
  display: none;
  position: absolute;
  top: 4px;
  left: 5px;
  bottom: 0;
  z-index: 10;
}
.dynamic-form-item-empty {
  padding: 140px 20px;
  text-align: center;
  color: #5f5f5f;
}
</style>

