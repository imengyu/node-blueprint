
<template>
  <div v-if="model && (!item.showCondition || item.showCondition(model, item))">
    <!--对象组-->
    <template v-if="item.type === 'object'">
      <!--循环子条目-->
      <DynamicFormItem 
        v-for="(child, k) in item.children"
        :key="k"
        :item="child"
        :model="((model[item.name] as Record<string, unknown>)[child.name] as Record<string, unknown>)"
        :disabled="disabled"
      />
    </template>
    <!--对象组-->
    <FormGroup v-else-if="item.type === 'group-object'" :title="item.label" v-bind="item.additionalProps">
      <Col
        v-for="(child, k) in item.children" 
        v-bind="{ ...item.childrenColProps, ...child.colProps }"
        :key="k"
      >
        <!--循环子条目-->
        <DynamicFormItem 
          :item="child"
          :model="((model[item.name] as Record<string, unknown>)[child.name] as Record<string, unknown>)"
          :disabled="disabled"
        />
      </Col>
    </FormGroup>
    <!--扁平组-->
    <FormGroup v-else-if="item.type === 'group-flat'" :title="item.label" v-bind="item.additionalProps">
      <Col
        v-for="(child, k) in item.children" 
        v-bind="{ ...item.childrenColProps, ...child.colProps }"
        :key="k"
      >
        <!--循环子条目-->
        <DynamicFormItem 
          :item="child"
          :model="model"
          :disabled="disabled"
        />
      </Col>
    </FormGroup>
    <!--数组对象组-->
    <FormGroup v-else-if="item.type === 'array-object'" v-bind="(item.additionalProps as Record<string, unknown>)">
      todo!!
    </FormGroup>
    <!--正常条目-->
    <FormItem
      v-else
      :label="item.label"
      :name="item.name"
      v-bind="item.formProps"
    >
      <!--自定义-->
      <template v-if="item.type === 'custom'">
        <slot 
          name="formCeil"
          :item="item"
          :model="model[item.name] || model"
          :disabled="disabled"
        />
      </template>
      <!--静态文字-->
      <template v-else-if="item.type === 'static-text'">
        <span>{{model[item.name]}}</span>
      </template>
      <!--库组件-->
      <template v-else>
        <DynamicFormItemRenderer
          :value="model[item.name]"
          @update:value="(v: unknown) => onModelUpdate(item.name, v)"
          :item="item"
          :disabled="disabled"
          :additionalProps="(item.additionalProps as Record<string, unknown>)"
        />
      </template>
    </FormItem>
  </div>
</template>

<script lang="ts">
import { defineComponent, PropType, toRefs } from 'vue';
import { IDynamicFormItem } from './DynamicForm';
import DynamicFormItemRenderer from './DynamicFormItemRenderer/DynamicFormItemRenderer.vue';
import FormGroup from './DynamicFormItemControls/FormGroup.vue';
import Col from './BaseControls/Layout/Col.vue';
import FormItem from './BaseControls/FormItem';

/**
 * 动态表单条目渲染组件。
 */
export default defineComponent({
  name: 'DynamicFormItem',
  props: {
    item: {
      type: Object as PropType<IDynamicFormItem>,
      required: true,
    },
    disabled: {
      type: Boolean
    },
    model: {
      type: Object as PropType<Record<string, unknown>>,
    },
  },
  setup(props) {
    const {model } = toRefs(props);

    function onModelUpdate(key: string, newVal: unknown) {
      // eslint-disable-next-line vue/no-mutating-props
      (model.value as Record<string, unknown>)[key] = newVal;
    }

    return {
      onModelUpdate,
    }
  },
  components: { DynamicFormItemRenderer, FormGroup, Col, FormItem }
});

</script>