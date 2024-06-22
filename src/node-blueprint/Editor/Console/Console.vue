<template>
  <div class="console-base">
    <CodeLayoutScrollbar ref="list">
      <div class="list">
        <ConsoleItem 
          v-for="(i, k) in outputs" 
          v-show="showItem(i)"
          :key="k" 
          :tag="i.tag"
          :content="i.content"
          :level="i.level"
          :hasWarp="i.hasWarp"
          :warpOpen="i.warpOpen"
          :speicalType="i.speicalType"
          @update:warpOpen="(v) => outputs[k].warpOpen = v"
          @goRef="(a,b,c) => onGoRef(a,b,c)" 
          @goSrc="onGoRef(i.srcDoc as string, i.srcBlock as string, i.srcPort as string)" 
        />
      </div>
    </CodeLayoutScrollbar>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, type PropType, onBeforeUnmount, watch, h } from 'vue'
import Icon from "../Nana/Icon.vue";
import ConsoleItem from './ConsoleItem.vue';
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import logger from '@/node-blueprint/Base/Logger/Logger';
import { CodeLayoutScrollbar, type CodeLayoutPanelInternal } from 'vue-code-layout';
import type { LogLevel } from '@/node-blueprint/Base/Logger/Logger';
import type { CodeLayoutScrollbarInstance } from 'vue-code-layout/lib/Components/CodeLayoutScrollbar.vue';
import { Debounce } from '@/node-blueprint/Base/Utils/Timer/Debounce';

export interface LogItem {
  tag: string,
  content: any,
  level: LogLevel,
  hasWarp: boolean,
  warpOpen: boolean,
  speicalType: LogSpeicalType,
  srcText?: string,
  srcDoc?: string,
  srcBlock?: string,
  srcPort?: string,
}
export type LogSpeicalType = 'none'|'undefined'|'null'|'true'|'false'|'object'|'number'|'';

const props = defineProps({
  panel: {
    type: Object as PropType<CodeLayoutPanelInternal>,
    default: null,
  }
});
const emit = defineEmits([ 'goRef' ]);

const outputs = ref(new Array<LogItem>());
const waringCount = ref(0);
const errorCount = ref(0);
const filterWarning = ref(false);
const filterError = ref(false);
const autoScroll = ref(true);
const list = ref<CodeLayoutScrollbarInstance | null>(null);
const listScrollDebTask = new Debounce(1000, () => {
  const container = list.value?.getScrollContainer();
  if (container)
    container.scrollTop = container.scrollHeight + container.offsetHeight;
})

function logListener(tag : string, level : LogLevel, content : string|number|boolean|unknown, extendObj ?: unknown) {
  let hasWarp = false;
  let speicalType : LogSpeicalType = 'none';
  
  if(content === null)
    speicalType = 'null';
  else if(typeof content === 'string') 
    hasWarp = content.includes('\n');
  else if(typeof content === 'undefined')
    speicalType = 'undefined';
  else if(typeof content === 'object')
    speicalType = 'object';
  else if(typeof content === 'number')
    speicalType = 'number';
  else if(typeof content === 'boolean')
    speicalType = content ? 'true' : 'false'; 

  let srcText = '';
  let srcBlock = '';
  let srcPort = '';
  let srcDoc = '';

  outputs.value.push({
    tag: tag,
    hasWarp: hasWarp,
    content: content as any,
    level: level,
    speicalType: speicalType,
    warpOpen: false,
    srcText: srcText,
    srcBlock: srcBlock,
    srcPort: srcPort,
    srcDoc: srcDoc,
  });
  if(level === 'warning') waringCount.value++;
  if(level === 'error') errorCount.value++;

  if(autoScroll.value) 
    listScrollDebTask.executeWithDelay(500);
  if (extendObj) {
    //TODO: Log extendObj
  }
}
function clearLogs() {
  waringCount.value = 0;
  errorCount.value = 0;
  ArrayUtils.clear(outputs.value);
}
function showItem(item : LogItem) {
  if(filterWarning.value)
    return item.level === 'warning';
  if(filterError.value)
    return item.level === 'error';
  if(!filterWarning.value && !filterError.value)
    return true;
  return false;
}
function onGoRef(refDoc : string, refBlock : string, refPort : string) {
  emit('goRef', refDoc, refBlock, refPort);
}

function initToolbar() {
  const panel = props.panel;
  panel.actions = [
    {
      tooltip: '筛选警告条目',
      icon: () => h(Icon, { icon: 'icon-warning-filling', class: filterWarning.value ? 'text-warning' : 'text-secondary' }),
      onClick() {
        filterWarning.value = !filterWarning.value;
      },
    },
    {
      tooltip: '筛选错误条目',
      icon: () => h(Icon, { icon: 'icon-delete-filling', class: filterError.value ? 'text-danger' : 'text-secondary' }),
      onClick() {
        filterError.value = !filterError.value;
      },
    },
    {
      tooltip: '自动滚动',
      icon: () => h(Icon, { icon: 'icon-decline-filling', class: autoScroll.value ? 'text-success' : 'text-secondary' }),
      onClick() {
        autoScroll.value = !autoScroll.value;
      },
    },
    {
      text: '清除列表',
      icon: () => h(Icon, { icon: 'icon-close-bold' }),
      onClick() {
        clearLogs();
      },
    },
    {
      render: () => h('span', {
        class: 'console-toolbar-left',
      }, `全部: ${ outputs.value.length }`),
    },
  ];
}

watch(() => props.panel, initToolbar);

onMounted(() => {
  logger.addListener(logListener);
  logger.reSendLogs();
  initToolbar();
});
onBeforeUnmount(() => {
  logger.removeListener(logListener);
});
</script>

<style lang="scss">
@import "Console.scss";
</style>