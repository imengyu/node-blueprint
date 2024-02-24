<template>
  <div class="console-base">
    <div ref="list" class="list">
      <div v-for="(i, k) in outputs" v-show="showItem(i)" :key="k" :class="'item ' + i.level + (i.warpOpen?' warp':'')">
        <Icon v-if="i.hasWarp" icon="icon-arrow-right-filling" :class="'switch iconfont' + (i.warpOpen?' open':'')" @click="i.warpOpen=!i.warpOpen" />

        <Icon v-if="i.level==='error'" icon="icon-delete-filling" class="icon iconfont text-danger" />
        <Icon v-else-if="i.level==='warning'" icon="icon-warning-filling" class="icon text-warning" />
        <Icon v-else-if="i.level==='info'" icon="icon-prompt-filling" class="icon text-info" />

        <span class="tag mr-2">{{ i.tag }}</span>
        
        <ConsoleObjectShower v-if="i.speicalType==='object'" :value="i.content" @on-go-ref="(d: string,b: string,p: string) => onGoRef(d,b,p)" />
        <ConsoleRefShower v-else :value="i.content" :isTop="true" @on-go-ref="(d: string,b: string,p: string) => onGoRef(d,b,p)" />

        <a v-if="i.srcText && i.srcText!==''" class="src" @click="onGoRef(i.srcDoc as string, i.srcBlock as string, i.srcPort as string)">{{ i.srcText }}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, type PropType, onBeforeUnmount, watch, h } from 'vue'
import ConsoleRefShower from "./ConsoleRefShower.vue";
import ConsoleObjectShower from "./ConsoleObjectShower.vue";
import Icon from "../Nana/Icon.vue";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import logger from '@/node-blueprint/Base/Logger/Logger';
import type { LogLevel } from '@/node-blueprint/Base/Logger/Logger';
import type { CodeLayoutPanelInternal } from '../Docunment/CodeLayout/CodeLayout';

interface LogItem {
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
type LogSpeicalType = 'none'|'undefined'|'null'|'true'|'false'|'object'|'number';

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
const list = ref<HTMLElement | null>(null);

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



  if(autoScroll.value && list) 
    list.value?.scrollTo(0, list.value.scrollHeight);
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
      icon: () => h(Icon, { icon: 'icon-decline-filling', class: autoScroll.value ? '' : 'text-secondary' }),
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
  logger.reSendTemparyLogs();
  initToolbar();
});
onBeforeUnmount(() => {
  logger.removeListener(logListener);
});
</script>

<style lang="scss">
@import "Console.scss";
</style>