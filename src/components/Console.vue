<template>
  <div class="console-base">
    <div class="toolbar">
      <button @click="clearLogs">
        <i class="iconfont icon-close-1"></i>清空输出
      </button>
      <button @click="filterWarning=!filterWarning" :class="filterWarning?'active':''">
        <i class="iconfont icon-error-1 text-warning"></i>{{ waringCount }}
      </button>
      <button @click="filterError=!filterError" :class="filterError?'active':''">
        <i class="iconfont icon-error- text-danger"></i>{{ errorCount }}
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
        <i v-if="i.hasWarp" :class="'switch iconfont icon-zuo' + (i.warpOpen?' open':'')" @click="i.warpOpen=!i.warpOpen"></i>

        <i v-if="i.level==='error'" class="icon iconfont icon-error- text-danger"></i>
        <i v-if="i.level==='warning'" class="icon iconfont icon-error-1 text-warning"></i>
        <i v-if="i.level==='info'" class="icon iconfont icon-info-1 text-info"></i>
        <span class="tag">{{ i.tag }}</span>
        <span v-if="i.speicalType==='undefined'" class="speical">undefined</span>
        <span v-else-if="i.speicalType==='null'" class="speical">null</span>
        <span v-else>{{ i.content }}</span>
      </div>
    </div>
  </div>
</template>

<script lang="ts">
import logger, { LogLevel } from "@/utils/Logger";
import { Component, Prop, Vue, Watch } from "vue-property-decorator";

interface LogItem {
  tag: string,
  content: string,
  level: LogLevel,
  hasWarp: boolean,
  warpOpen: boolean,
  speicalType: LogSpeicalType,
}
type LogSpeicalType = 'none'|'undefined'|'null';

@Component({
  name: 'Console',
})
export default class Console extends Vue {

  outputs = new Array<LogItem>();

  waringCount = 0;
  errorCount = 0;
  filterWarning = false;
  filterError = false;
  authScrool = true;
  list : HTMLElement = null;

  mounted() {
    this.logListener = this.logListener.bind(this);
    logger.addListener(this.logListener);
    logger.reSendTemparyLogs();
    setTimeout(() => {
      this.list = <HTMLElement>this.$refs.list;
    }, 200)
  }
  beforeDestroy() {
    logger.removeListener(this.logListener);
  }
  logListener(tag : string, level : LogLevel, content : string, extendObj ?: object) {
    let hasWarp = false;
    let speicalType : LogSpeicalType = 'none';
    if(typeof content === 'string') 
      hasWarp = content.contains('\n');
    else if(typeof content === 'undefined')
      speicalType = 'undefined';
    else if(content === null)
      speicalType = 'null';

    this.outputs.push({
      tag: tag,
      hasWarp: hasWarp,
      content: content,
      level: level,
      speicalType: speicalType,
      warpOpen: false,
    });
    if(level === 'warning') this.waringCount++;
    if(level === 'error') this.errorCount++;

    if(this.authScrool && this.list) 
      this.list.scrollTo(0, this.list.scrollHeight);
  }
  clearLogs() {
    this.waringCount = 0;
    this.errorCount = 0;
    this.outputs.empty();
  }
  showItem(item : LogItem) {
    if(this.filterWarning)
      return item.level === 'warning';
    if(this.filterError)
      return item.level === 'error';
    if(!this.filterWarning && !this.filterError)
      return true;
    return false;
  }

}

</script>