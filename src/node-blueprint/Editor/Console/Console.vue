<template>
  <div class="console-base">
    <div class="toolbar">
      <button @click="clearLogs">
        <IconFont type="close1" class="icon" />清空输出
      </button>
      <button @click="filterWarning=!filterWarning" :class="filterWarning?'active':''">
        <IconFont type="warning-filling" class="icon text-warning" />{{ waringCount }}
      </button>
      <button @click="filterError=!filterError" :class="filterError?'active':''">
        <IconFont type="delete-filling" class="icon text-danger" />{{ errorCount }}
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
        <IconFont v-if="i.hasWarp" type="arrow-right-filling" :class="'switch iconfont icon-zuo' + (i.warpOpen?' open':'')" @click="i.warpOpen=!i.warpOpen" />

        <IconFont v-if="i.level==='error'" type="delete-filling" class="icon iconfont text-danger" />
        <IconFont v-else-if="i.level==='warning'" type="warning-filling" class="icon text-warning" />
        <IconFont v-else-if="i.level==='info'" type="prompt-filling" class="icon text-info" />

        <span class="tag mr-2">{{ i.tag }}</span>
        
        <ConsoleObjectShower v-if="i.speicalType==='object'" :value="i.content" @on-go-ref="(d: string,b: string,p: string) => onGoRef(d,b,p)"></ConsoleObjectShower>
        <ConsoleRefShower v-else :value="i.content" @on-go-ref="(d: string,b: string,p: string) => onGoRef(d,b,p)" :isTop="true"></ConsoleRefShower>

        <a v-if="i.srcText && i.srcText!==''" class="src" @click="onGoRef(i.srcDoc as string, i.srcBlock as string, i.srcPort as string)">{{i.srcText}}</a>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import logger, { LogExtendData, LogLevel } from "../Common/Logger/Logger";
import { SaveableTypes } from "../Common/BaseTypes";
import { defineComponent } from 'vue'
import ConsoleRefShower from "./ConsoleRefShower.vue";
import ConsoleObjectShower from "./ConsoleObjectShower.vue";
import CommonUtils from "../Common/Utils/CommonUtils";
import IconFont from "../Common/Components/IconFont.vue";

interface LogItem {
  tag: string,
  content: SaveableTypes,
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
    IconFont
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
    logListener(tag : string, level : LogLevel, content : string|number|boolean|unknown, extendObj ?: LogExtendData) {
      let hasWarp = false;
      let speicalType : LogSpeicalType = 'none';
      
      if(content === null)
        speicalType = 'null';
      else if(typeof content === 'string') 
        hasWarp = content.contains('\n');
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
      if(extendObj) {
        if(extendObj.srcDoc) {
          srcText += extendObj.srcDoc.name;
          //srcDoc = extendObj.srcDoc.uid + ':' + extendObj.srcBlock.currentGraph.uid;
        }
        if(extendObj.srcBlock) {
          if(!CommonUtils.isDefinedAndNotNull(extendObj.srcDoc)) {
            extendObj.srcDoc = extendObj.srcBlock.graph?.docunment || undefined;
            if(extendObj.srcDoc) {
              srcText += extendObj.srcDoc.name;
              srcDoc = extendObj.srcDoc.uid + ':' + extendObj.srcBlock.graph?.uid;
            }
          }
          srcText += '.' + extendObj.srcBlock.define.name;
          srcBlock = extendObj.srcBlock.uid;
        }
        if(extendObj.srcPort) {
          srcText += '.' + extendObj.srcPort.define.name;
          srcPort = extendObj.srcPort.guid;
        }
      }

      this.outputs.push({
        tag: tag,
        hasWarp: hasWarp,
        content: content as SaveableTypes,
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
      this.outputs.clear();
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