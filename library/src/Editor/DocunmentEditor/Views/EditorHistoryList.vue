<template>
  <TreeList
    :items="historyManager?.historySteps ?? []"
    :desc="[
      { childrenKey: 'childSteps' }
    ]"
    :defaultOpen="true"
    itemClass="console-item"
    class="console-base-font"
  >
    <template #itemLeft="{ level, item }">
      <span>{{ item.name }}</span>
    </template>
    <template #itemRight="{ level, item }">
    </template>
  </TreeList>
</template>

<script setup lang="ts">
import { type PropType } from 'vue';
import type { CodeLayoutPanelInternal } from 'vue-code-layout';
import SmallButton from '@/Editor/Components/Shared/SmallButton.vue';
import Row from '@/Editor/Components/Shared/Layout/RowView.vue';
import Icon from '@/Editor/Components/Shared/Icon.vue';
import TreeList from '@/Editor/Components/Editor/List/TreeList.vue';
import type { EditorHistoryStepStackManager } from '@/Editor/GraphEditor/Editor/History/StackManager';

const props = defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    default: null,
  },
  historyManager: {
    type: Object as PropType<EditorHistoryStepStackManager>,
    default: null,
  },
});


</script>