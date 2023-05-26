<template>
  <div class="console-base">
    <div class="toolbar">
      <button @click="clearLogs">
        <Icon icon="icon-close-bold" class="icon text-white" />清空输出
      </button>
      <button @click="filterWarning=!filterWarning" v-tooltip="'筛选警告条目'" :class="filterWarning?'active':''">
        <Icon icon="icon-warning-filling" class="icon text-warning" />{{ waringCount }}
      </button>
      <button @click="filterError=!filterError" v-tooltip="'筛选错误条目'" :class="filterError?'active':''">
        <Icon icon="icon-delete-filling" class="icon text-danger" />{{ errorCount }}
      </button>
      <button @click="filterError=false;filterWarning=false">
        全部: {{ outputs.length }}
      </button>
      <button @click="authScrool=!authScrool;" :class="authScrool?'active':''">
        自动滚动
      </button>
    </div>
    <div class="list" ref="list">
      <div v-for="(i, k) in outputs" :key="k" :class="'item ' + i.level + (i.warpOpen?' warp':'')" v-show="showItem(i)">
        <Icon v-if="i.hasWarp" icon="icon-arrow-right-filling" :class="'switch iconfont' + (i.warpOpen?' open':'')" @click="i.warpOpen=!i.warpOpen" />

        <Icon v-if="i.level==='error'" icon="icon-delete-filling" class="icon iconfont text-danger" />
        <Icon v-else-if="i.level==='warning'" icon="icon-warning-filling" class="icon text-warning" />
        <Icon v-else-if="i.level==='info'" icon="icon-prompt-filling" class="icon text-info" />

        <span class="tag mr-2">{{ i.tag }}</span>
        
        <ConsoleObjectShower v-if="i.speicalType==='object'" :value="i.content" @on-go-ref="(d: string,b: string,p: string) => onGoRef(d,b,p)"></ConsoleObjectShower>
        <ConsoleRefShower v-else :value="i.content" @on-go-ref="(d: string,b: string,p: string) => onGoRef(d,b,p)" :isTop="true"></ConsoleRefShower>

        <a v-if="i.srcText && i.srcText!==''" class="src" @click="onGoRef(i.srcDoc as string, i.srcBlock as string, i.srcPort as string)">{{i.srcText}}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import ConsoleRefShower from "./ConsoleRefShower.vue";
import ConsoleObjectShower from "./ConsoleObjectShower.vue";
import Icon from "../Nana/Icon.vue";
import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import type { LogLevel } from '@/node-blueprint/Base/Logger/Logger';
import logger from '@/node-blueprint/Base/Logger/Logger';

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

export default defineComponent({
  name: 'Console',
  components: {
    ConsoleRefShower,
    ConsoleObjectShower,
    Icon,
  },
  data() {
    return {
      outputs: new Array<LogItem>(),
      waringCount: 0,
      errorCount: 0,
      filterWarning: false,
      filterError: false,
      authScrool: true,
      list: null as HTMLElement | null,
    }
  },
  mounted() {
    this.logListener = this.logListener.bind(this);
    logger.addListener(this.logListener);
    logger.reSendTemparyLogs();
    setTimeout(() => {
      this.list = this.$refs.list as HTMLElement;
    }, 200)
  },
  beforeUnmount() {
    logger.removeListener(this.logListener);
  },
  methods: {
    logListener(tag : string, level : LogLevel, content : string|number|boolean|unknown, extendObj ?: unknown) {
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

      this.outputs.push({
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
      if(level === 'warning') this.waringCount++;
      if(level === 'error') this.errorCount++;



      if(this.authScrool && this.list) 
        this.list.scrollTo(0, this.list.scrollHeight);
    },
    clearLogs() {
      this.waringCount = 0;
      this.errorCount = 0;
      ArrayUtils.clear(this.outputs);
    },
    showItem(item : LogItem) {
      if(this.filterWarning)
        return item.level === 'warning';
      if(this.filterError)
        return item.level === 'error';
      if(!this.filterWarning && !this.filterError)
        return true;
      return false;
    },
    onGoRef(refDoc : string, refBlock : string, refPort : string) {
      this.$emit('on-go-ref', refDoc, refBlock, refPort);
    },
  }
})
</script>

<style lang="scss">
@import "Console.scss";
</style>