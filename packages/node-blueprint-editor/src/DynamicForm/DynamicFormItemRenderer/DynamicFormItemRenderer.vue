<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts">
import { defineComponent, h, inject, markRaw, onMounted, PropType, ref, toRefs, watch } from "vue";
import { IDynamicFormItem } from "../DynamicForm";
import BaseCheckVue from "../DynamicFormItemControls/BaseCheck.vue";
import BaseInputVue from "../DynamicFormItemControls/BaseInput.vue";
import BaseSelectVue from "../DynamicFormItemControls/BaseSelect.vue";
import BaseTextAreaVue from "../DynamicFormItemControls/BaseTextArea.vue";
import { DynamicFormItemRegistry, DynamicFormItemRegistryItem } from "./DynamicFormItemRegistry";

let registeredInternal = false;

/**
 * 动态表单条目渲染组件。
 */
export default defineComponent({
  props: {
    item: {
      type: Object as PropType<IDynamicFormItem>,
    },
    disabled: {
      type: Boolean
    },
    value: {
    },
    additionalProps: {
      type: Object as PropType<Record<string, unknown>>,
    },
  },
  emits: [ 
    'update:value'
  ],
  setup(props, context) {
    const { item } = toRefs(props);

    const componentInstance = ref(null as any);
    const componentAdditionalProps = ref(null as any);
    const componentValueName = ref(null as any);
    const componentOnUpdateValueName = ref(null as any);

    function onUpdateValue(v: unknown) {
      context.emit('update:value', v);
    }
    function registerInternalDynamicFormItemControls() : void {
      //注册所有内置表单组件类型
      if (!registeredInternal) {
        registeredInternal = true;
        DynamicFormItemRegistry.registerDynamicFormItemControl('text', markRaw(BaseInputVue));
        DynamicFormItemRegistry.registerDynamicFormItemControl('select', markRaw(BaseSelectVue));
        DynamicFormItemRegistry.registerDynamicFormItemControl('textarea', markRaw(BaseTextAreaVue));
        DynamicFormItemRegistry.registerDynamicFormItemControl('check', markRaw(BaseCheckVue));
      }
    }
    function findComponent() {
      const itemValue = (item.value as IDynamicFormItem);

      if (!itemValue?.type) {
        componentInstance.value = null;
        return;
      }

      let type : DynamicFormItemRegistryItem|null = null;
      if (widgetOvrride)
        type = (widgetOvrride as Record<string, DynamicFormItemRegistryItem>)[itemValue.type];

      if (type == null)
        type = DynamicFormItemRegistry.findDynamicFormItemByType(itemValue.type);

      if (type == null) {
        componentInstance.value = null;
        return;
      }
      
      componentInstance.value = type.componentInstance;
      componentAdditionalProps.value = type.additionalProps;
      componentValueName.value = type.valueName;
      componentOnUpdateValueName.value = 'onUpdate:'+ type.valueName;
    }

    watch(item, () => {
      findComponent();
    });
    onMounted(() => {
      registerInternalDynamicFormItemControls();
      findComponent();
    });

    const rawModel = inject<Record<string, unknown>>('rawModel'); 
    const widgetOvrride = inject<Record<string, DynamicFormItemRegistryItem>>('widgetOvrride'); 

    return {
      onUpdateValue,
      registerInternalDynamicFormItemControls,
      findComponent,
      rawModel,
      widgetOvrride,
      componentInstance,
      componentAdditionalProps,
      componentValueName,
      componentOnUpdateValueName,
    }
  },
  render() {
    if (this.componentInstance) {
      return h(this.componentInstance, {
        ...(this.componentAdditionalProps as Record<string, unknown>),
        ...(this.additionalProps as Record<string, unknown>),
        disabled: this.disabled,
        item: this.item,
        rawModel: this.rawModel,
        //双向数据绑定属性
        [this.componentValueName]: this.value,
        [this.componentOnUpdateValueName]: (v: unknown) => this.onUpdateValue(v),
      });
      
    } else {
      return h('span', {
        style: { color: '#f00' },
      }, `警告：未找到表单组件实例 ${(this.item as IDynamicFormItem)?.type || '未知'} ${JSON.stringify(this.widgetOvrride)}`);
    }
  },
});

</script>