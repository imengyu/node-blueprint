<template>
  <!--类型选择器-->
  <div ref="selectBox" class="node-param-type-picker">
    <NodeParamTypeRender :type="modelValue" @click="onPickMainType">
      <template v-if="canChangeSetType" #icon>
        <!--用于修改容器类型-->
        <NodeParamSetTypeChoose 
          :type="modelValue"
          @update:type="(t) => $emit('update:modelValue', t)"
        >
          <NodeParamIconRender :type="modelValue" />
        </NodeParamSetTypeChoose>
      </template>
      <template v-if="canChangeSetType && modelValue && modelValue.isGeneric" #name>
        <NodeParamTypePicker
          v-for="(gtype, i) in modelValue.genericTypes"
          :key="i"
          :canChangeSetType="true"
          :type="gtype"
          @update:type="(t) => onChangeGenericType(i, t)"
          @click.stop="onPickDictionaryKeyType"
        />
      </template>
    </NodeParamTypeRender>
  </div>
</template>

<script setup lang="ts">
import { inject, ref, type PropType } from 'vue';
import NodeParamTypeRender from '../../Small/NodeParamTypeRender.vue';
import NodeParamIconRender from '../../Small/NodeParamIconRender.vue';
import NodeParamSetTypeChoose from '../../Small/NodeParamSetTypeChoose.vue';
import type { NodeParamType, NodeParamTypeDefine } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';
import type { NodeIdeControlContext } from '@/node-blueprint/Editor/Docunment/NodeIde';
import { NodeParamTypeRegistry } from '@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry';

const emit = defineEmits([ 'update:modelValue' ])
const prop = defineProps({
  modelValue: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
  canBeAny: {
    type: Boolean,
    default: false
  },
  canBeExecute: {
    type: Boolean,
    default: false
  },
  canBeArrayOrSetOrDict: {
    type: Boolean,
    default: true
  },
  canChangeSetType: {
    type: Boolean,
    default: false
  },
});

const selectBox = ref<HTMLElement>();
const context = inject('NodeIdeControlContext') as NodeIdeControlContext;

function onPickMainType() {
  if (selectBox.value) {
    context.getCurrentActiveGraphEditor()?.showSelectTypePanel(
      new Vector2(HtmlUtils.getLeft(selectBox.value), HtmlUtils.getTop(selectBox.value)),
      prop.canBeExecute,
      prop.canBeAny,
      prop.canBeArrayOrSetOrDict
    ).then((type) => {
      const oldType = prop.modelValue;
      if (!oldType)
        emit('update:modelValue', type);
      else if (oldType.isArray || oldType.isSet) {
        oldType.genericTypes[0] = type;
        emit('update:modelValue', oldType);
      } else if (oldType.isDictionary) {
        oldType.genericTypes[1] = type;
        emit('update:modelValue', oldType);
      } else
        emit('update:modelValue', type);
    });
  }
}
function onPickDictionaryKeyType() {
  if (selectBox.value) {
    context.getCurrentActiveGraphEditor()?.showSelectTypePanel(
      new Vector2(HtmlUtils.getLeft(selectBox.value), HtmlUtils.getTop(selectBox.value)),
      prop.canBeExecute,
      prop.canBeAny,
      prop.canBeArrayOrSetOrDict
    ).then((type) => {
      const oldType = prop.modelValue;
      if (oldType) {
        const genericType = `<${type.toString()},${oldType.genericTypes[1].toString()}>`
        const define = NodeParamTypeRegistry.getInstance().getTypeByString(oldType.name);
        const newType = NodeParamTypeRegistry.getInstance().registerType(oldType.name + genericType, {
          ...define?.define as NodeParamTypeDefine,
          hiddenInChoosePanel: true,
        });
        emit('update:modelValue', newType);
      }
    });
  }
}
function onChangeGenericType(index: number, type: NodeParamType) {
  const genericTypes = prop.modelValue.genericTypes;
  genericTypes[index] = type;
}

</script>

<style lang="scss">
.node-param-type-picker {
  display: inline-flex ;
  padding: 1px 3px;
  border-radius: 5px;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  background-color: var(--mx-editor-clickable-background-color);
  color: var(--mx-editor-text-color);

  &:hover {
    border-color: var(--mx-editor-border-color);
    background-color: var(--mx-editor-hover-text-color);
    color: var(--mx-editor-text-color);
  }
}
</style>