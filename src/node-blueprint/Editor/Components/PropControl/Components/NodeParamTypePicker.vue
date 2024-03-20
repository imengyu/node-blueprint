<template>
  <!--类型选择器-->
  <div ref="selectBox" class="node-param-type-picker">
    <template v-if="canChangeSetType">
      <!--用于修改容器类型-->
      <NodeParamSetTypeChoose 
        :type="modelValue"
        @update:type="(t) => $emit('update:modelValue', t)"
      >
        <NodeParamIconRender :type="modelValue" />
      </NodeParamSetTypeChoose>
      <template v-if="modelValue && modelValue.isGeneric">
        <!--用于嵌套容器类型-->
        <NodeParamTypePicker
          v-for="(gtype, i) in modelValue.genericTypes"
          :key="i"
          :canChangeSetType="modelValue.define?.typeGenericPickerOption?.(i)?.canBeContainer ?? true"
          :canBeArrayOrSetOrDict="modelValue.define?.typeGenericPickerOption?.(i)?.canBeContainer ?? true"
          :canBeAny="modelValue.define?.typeGenericPickerOption?.(i)?.canBeAny ?? canBeAny"
          :canBeExecute="modelValue.define?.typeGenericPickerOption?.(i)?.canBeExecute ?? canBeExecute"
          :modelValue="gtype"
          @update:modelValue="(t) => onChangeGenericType(i, t)"
        />
        <Icon 
          v-tooltip="'删除泛型参数'"
          class="type-clear-button"
          icon="icon-close"
          fill="currentColor"
          @click="onClearMainGenericType"
        />
      </template>
      <span v-else @click="onPickMainType">{{ modelValue?.toUserFriendlyName() || '请选择' }}</span>
    </template>
    <!--普通选择类型-->
    <NodeParamTypeRender v-else :type="modelValue" @click="onPickMainType" />
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import NodeParamTypeRender from '../../Small/NodeParamTypeRender.vue';
import NodeParamIconRender from '../../Small/NodeParamIconRender.vue';
import NodeParamSetTypeChoose from '../../Small/NodeParamSetTypeChoose.vue';
import { NodeParamType } from '@/node-blueprint/Base/Flow/Type/NodeParamType';
import { Vector2 } from '@/node-blueprint/Base/Utils/Base/Vector2';
import { injectNodeGraphEditorContextInEditorOrIDE } from '@/node-blueprint/Editor/Docunment/NodeIde';
import { NodeParamTypeRegistry } from '@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry';
import Icon from '@/node-blueprint/Editor/Nana/Icon.vue';
import HtmlUtils from '@/node-blueprint/Base/Utils/HtmlUtils';

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
const { getNodeGraphEditorContext } = injectNodeGraphEditorContextInEditorOrIDE();

function onClearMainGenericType() {
  const oldType = prop.modelValue;
  if (!oldType)
    emit('update:modelValue', NodeParamType.Any);
  else if (oldType.isDictionary) 
    emit('update:modelValue', oldType.genericTypes[1]);
  else
    emit('update:modelValue', oldType.genericTypes[0]);
}
function onChangeGenericType(index: number, type: NodeParamType) {
  if (prop.modelValue) {
    const genericTypes = new Array(prop.modelValue.genericTypes.length);
    genericTypes[index] = type;

    emit('update:modelValue', 
      NodeParamTypeRegistry.getInstance().reRegisterNewGenericType(
        prop.modelValue, 
        genericTypes
      )
    );
  }
}
function onPickMainType() {
  if (selectBox.value) {
    getNodeGraphEditorContext()?.showSelectTypePanel(
      new Vector2(HtmlUtils.getLeft(selectBox.value), HtmlUtils.getTop(selectBox.value)),
      prop.canBeExecute,
      prop.canBeAny,
      prop.canBeArrayOrSetOrDict
    ).then((type) => {
      emit('update:modelValue', type);
    });
  }
}

</script>

<style lang="scss">
.node-param-type-picker {
  display: inline-flex ;
  flex-direction: row;
  align-items: center;
  padding: 1px 3px;
  border-radius: 5px;
  cursor: pointer;
  user-select: none;
  border: 1px solid transparent;
  background-color: var(--mx-editor-clickable-background-color);
  color: var(--mx-editor-text-color);

  > span {
    margin: 0 4px 0 2px;
  }

  &:hover > .type-clear-button {
    display: initial;
  }

  .type-clear-button {
    display: none;
    border-radius: 4px;
    background-color: var(--mx-editor-background-third-color);
    cursor: pointer;
    user-select: none;
    z-index: 10;

    &:hover {
      fill: var(--mx-editor-red-light-text-color);
    }
  }

  &:hover {
    border-color: var(--mx-editor-border-color);
    background-color: var(--mx-editor-hover-text-color);
    color: var(--mx-editor-text-color);
  }
}
</style>