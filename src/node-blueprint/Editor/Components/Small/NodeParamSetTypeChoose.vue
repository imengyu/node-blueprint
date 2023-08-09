<template>
  <div class="node-param-set-type-choose">
    <div
      v-tooltip="'更改容器类型'"  
      class="node-float-set-typedot" 
      @click="show=!show" 
    >
      <slot />
    </div>
    <div v-show="show" class="node-float-set-selector">
      <Icon v-tooltip="'变量'" icon="icon-sphere" @click="switchType('variable')" />
      <Icon v-tooltip="'数组'" icon="icon-port-array-full" @click="switchType('array')" />
      <Icon v-tooltip="'集合'" icon="icon-port-set" @click="switchType('set')" />
      <Icon v-tooltip="'映射'" icon="icon-port-dictionary-full" @click="switchType('dictionary')" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import { NodeParamType, type NodeParamTypeDefine } from '../../../Base/Flow/Type/NodeParamType';
import { NodeParamTypeRegistry } from '@/node-blueprint/Base/Flow/Type/NodeParamTypeRegistry';

const props = defineProps({
  type: {
    type: Object as PropType<NodeParamType>,
    default: null,
  },
});

const emit = defineEmits([ 'update:type' ]);

function switchType(type: 'variable'|'array'|'set'|'dictionary') {
  const registry = NodeParamTypeRegistry.getInstance()
  console.log('NodeParamSetTypeChoose switchType');
  
  switch(type) {
    case 'variable':
      if (!props.type)
        updateType(NodeParamType.Any);
      else if (props.type.isArray || props.type.isSet || props.type.isDictionary)
        updateType(props.type.genericTypes[0]);
      else
        updateType(props.type);
      break;
    case 'array': {
      let genericType = '';
      if (!props.type)
        genericType = '<any>';
      else if (props.type.isArray || props.type.isSet || props.type.isDictionary)
        genericType = '<' + props.type.genericTypes[0].toString() + '>';
      else
        genericType = '<' + props.type.toString() + '>';
      const arrayDefine = registry.getTypeByString('array');
      const dictType = registry.registerType('array' + genericType, {
        ...arrayDefine?.define as NodeParamTypeDefine,
        hiddenInChoosePanel: true,
        isCustomType: true,
      });
      updateType(dictType);
      break;
    }
    case 'set': {
      let genericType = '';
      if (!props.type)
        genericType = '<any>';
      else if (props.type.isArray || props.type.isSet || props.type.isDictionary)
        genericType = '<' + props.type.genericTypes[0].toString() + '>';
      else
        genericType = '<' + props.type.toString() + '>';
      const define = registry.getTypeByString('set');
      const dictType = registry.registerType('set' + genericType, {
        ...define?.define as NodeParamTypeDefine,
        hiddenInChoosePanel: true,
        isCustomType: true,
      });
      updateType(dictType);
      break;
    }
    case 'dictionary': {
      let genericType = '';
      if (!props.type)
        genericType = '<any,any>';
      else if (props.type.isArray || props.type.isSet )
        genericType = '<any,' + props.type.genericTypes[0].toString() + '>';
      else if (props.type.isDictionary)
        genericType = '<' + props.type.genericTypes[0].toString() + ',' + props.type.genericTypes[1].toString() + '>';
      else
        genericType = '<any,' + props.type.toString() + '>';
      const define = registry.getTypeByString('dictionary');
      const dictType = registry.registerType('dictionary' + genericType, {
        ...define?.define as NodeParamTypeDefine,
        hiddenInChoosePanel: true,
        isCustomType: true,
      });
      updateType(dictType);
      break;
    }
  }
  show.value = false;
}

function updateType(type: NodeParamType) {
  emit('update:type', type);
}

const show = ref(false);
</script>

<style lang="scss">
.node-param-set-type-choose {
  display: flex;
  justify-content: center;
  align-items: center;
  position: relative;
}
.node-float-set-typedot {
  display: flex;
  cursor: pointer;
  padding: 2px 5px;
  text-shadow: 0px 0px 3px rgb(0, 0, 0);
}
.node-float-set-selector {
  display: flex;
  flex-direction: column;
  align-items: center;
  position: absolute;
  top: 20px;
  width: 22px;
  padding: 4px 0;
  border: 1px solid #000;
  background: #fff;
  z-index: 200;

  > .nana-icon {
    cursor: pointer;
    display: block;
    width: 20px;
    height: 20px;
    padding: 2px;
    text-align: center;

    &:hover, &:active {
      background-color: #6b6b6b;
      fill: #fff;
    }
  }
}
</style>