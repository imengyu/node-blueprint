<template>
  <TreeList
    v-if="debugController.currentExecuteVariableInfo.value"
    :items="debugController.currentExecuteVariableInfo.value"
    :defaultOpen="true"
    itemClass="console-item"
    class="console-base-font"
  >
    <template #itemLeft="{ level, item }">
      <span v-if="level==0">{{ item.key }}</span>
      <Row v-else-if="level==1" class="console-obj-item">
        <span class="console-obj-color-key key">{{ item.key }}</span>
        <span class="sp">:</span>
        <ConsoleAutoShower :value="item.value.v" />
      </Row>
    </template>
    <template #itemRight="{ level, item }">
      <template v-if="level == 1">
        <SmallButton title="复制值" @click="onCopyValue(item.value)">
          <Icon icon="icon-flag-" />
        </SmallButton>
      </template>
    </template>
  </TreeList>
</template>

<script setup lang="ts">
import { type PropType } from 'vue';
import useClipboard from 'vue-clipboard3';
import type { CodeLayoutPanelInternal } from 'vue-code-layout';
import type { EditorDebugController } from '../Editor/EditorDebugController';
import SmallButton from '../../Components/SmallButton.vue';
import Row from '../../Nana/Layout/RowView.vue';
import Icon from '../../Nana/Icon.vue';
import ConsoleAutoShower from '../../Console/ConsoleAutoShower.vue';
import TreeList from '../../Components/List/TreeList.vue';

defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    default: null,
  },
  debugController: {
    type: Object as PropType<EditorDebugController>,
    default: null,
  },
});

const { toClipboard } = useClipboard();

function onCopyValue(value: any) {
  toClipboard(JSON.stringify(value));
}

</script>