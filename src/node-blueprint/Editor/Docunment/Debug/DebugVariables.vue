<template>
  <CodeLayoutScrollbar scroll="vertical">
    <CollapseItem 
      v-if="debugController.currentExecuteVariableInfo.value"
      open
      title="变量"
    >
      <PropList 
        :items="debugController.currentExecuteVariableInfo.value"
        emptyText="暂无"
      >
        <template #rowVertical="{ item }">
          <Row class="console-item tiny" width="100%" justify="space-between">
            <Row class="console-obj-item">
              <span class="key">{{ item.key }}</span>
              <span class="dp">:</span>
              <ConsoleAutoShower :value="item.value" />
            </Row>
            <Row>
              <SmallButton title="复制值" @click="onCopyValue(item.value)">
                <Icon icon="icon-flag-" />
              </SmallButton>
            </Row>
          </Row>
        </template>
      </PropList>
    </CollapseItem>
    <CollapseItem 
      v-if="debugController.currentExecuteTempsInfo.value"
      open
      title="临时变量"
    >
      <PropList 
        :items="debugController.currentExecuteTempsInfo.value"
        emptyText="暂无"
      >
        <template #rowVertical="{ item }">
          <Row class="console-item tiny" width="100%" justify="space-between">
            <Row class="console-obj-item">
              <span class="key">{{ item.key }}</span>
              <span class="dp">:</span>
              <ConsoleAutoShower :value="item.value" />
            </Row>
            <Row>
              <SmallButton title="复制值" @click="onCopyValue(item.value)">
                <Icon icon="icon-flag-" />
              </SmallButton>
            </Row>
          </Row>
        </template>
      </PropList>
    </CollapseItem>
  </CodeLayoutScrollbar>
</template>

<script setup lang="ts">
import { type PropType } from 'vue';
import Icon from '../../Nana/Icon.vue';
import type { CodeLayoutPanelInternal } from 'vue-code-layout';
import type { EditorDebugController } from '../Editor/EditorDebugController';
import useClipboard from 'vue-clipboard3';
import PropList from '../../Components/PropList/PropList.vue';
import SmallButton from '../../Components/SmallButton.vue';
import Row from '../../Nana/Layout/RowView.vue';
import CollapseItem from '../../Components/List/CollapseItem.vue';
import ConsoleAutoShower from '../../Console/ConsoleAutoShower.vue';
import { CodeLayoutScrollbar } from 'vue-code-layout';

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