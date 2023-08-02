<!-- eslint-disable @typescript-eslint/no-explicit-any -->
<!-- eslint-disable vue/no-mutating-props -->
<script lang="ts">
import { defineComponent, h, markRaw, onBeforeUnmount, onMounted, type PropType, ref, toRefs, watch } from "vue";
import BaseCheckVue from "./Components/BaseCheck.vue";
import BaseDivider from "./Components/BaseDivider.vue";
import BaseInputVue from "./Components/BaseInput.vue";
import BaseRadio from "./Components/BaseRadio.vue";
import BaseSelectVue from "./Components/BaseSelect.vue";
import BaseTextAreaVue from "./Components/BaseTextArea.vue";
import BaseText from "./Components/BaseText.vue";
import { type PropControlItem, PropControlItemRegistry, type PropControlItemRegistryItem } from "./PropControl";

let registeredInternal = false;

export interface PropControlItemRendererInterface {
  getRef: () => unknown,
}

/**
 * 动态表单条目渲染组件。
 */
export default defineComponent({
  props: {
    item: {
      type: Object as PropType<PropControlItem>,
      required: true,
    },
  },
  setup(props, context) {
    const {
      item,
    } = toRefs(props);

    const componentRef = ref();
    const componentInstance = ref(null as any);
    const componentAdditionalProps = ref(null as any);
    const componentValueName = ref(null as any);
    const componentOnUpdateValueName = ref(null as any);

    function getRef() {
      return componentRef.value;
    }
    function onUpdateValue(v: unknown) {
      //通知更新
      if (item.value?.onUpdateValue)
        item.value.onUpdateValue(v, getRef);
    }
    function registerInternalPropControlItemControls() : void {
      //注册所有内置表单组件类型
      if (!registeredInternal) {
        registeredInternal = true;
        PropControlItemRegistry.registerPropControlItemControl('text', markRaw(BaseInputVue));
        PropControlItemRegistry.registerPropControlItemControl('select', markRaw(BaseSelectVue));
        PropControlItemRegistry.registerPropControlItemControl('textarea', markRaw(BaseTextAreaVue));
        PropControlItemRegistry.registerPropControlItemControl('check', markRaw(BaseCheckVue));
        PropControlItemRegistry.registerPropControlItemControl('radio', markRaw(BaseRadio));
        PropControlItemRegistry.registerPropControlItemControl('divider', markRaw(BaseDivider));
        PropControlItemRegistry.registerPropControlItemControl('static', markRaw(BaseText));
      }
    }
    function findComponent() {
      const itemValue = (item.value as PropControlItem);

      if (!itemValue?.type) {
        componentInstance.value = null;
        return;
      }

      let type : PropControlItemRegistryItem|null = null;
      if (type === null)
        type = PropControlItemRegistry.findPropControlItemByType(itemValue.type);
      if (type === null) {
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
      registerInternalPropControlItemControls();
      findComponent();
      //通知钩子
      item.value?.mounted?.(getRef);
    });
    onBeforeUnmount(() => {
      //通知钩子
      item.value?.beforeUnmount?.(getRef());
    });

    context.expose({
      onUpdateValue,
      registerInternalPropControlItemControls,
      findComponent,
      getRef,
      componentRef,
      componentInstance,
      componentAdditionalProps,
      componentValueName,
      componentOnUpdateValueName,
    });

    return () => {
      if (componentInstance.value) {
        const renderProps = {
          ref: componentRef,
          ...(componentAdditionalProps.value as Record<string, unknown>),
          ...(item.value.additionalProps as Record<string, unknown>),
          item: item.value,
          //双向数据绑定属性
          [componentValueName.value]: item.value.getValue?.(),
          [componentOnUpdateValueName.value]: (v: unknown) => onUpdateValue(v),
        } as Record<string, unknown>;

        const additionalEvents = item.value?.additionalEvents as Record<string, unknown>;
        const additionalSlot = item.value?.additionalSlot;

        if (additionalEvents) {
          for (const key in additionalEvents) {
            //转换名称
            renderProps[`on${key.charAt(0).toLocaleUpperCase()}${key.substring(1)}`] = additionalEvents[key];
          }
        }

        return h(componentInstance.value, renderProps, additionalSlot);
        
      } else {
        return h('span', {}, `警告：未找到表单组件实例 ${(item.value as PropControlItem)?.type || '未知'}`);
      }
    }
  },
});

</script>