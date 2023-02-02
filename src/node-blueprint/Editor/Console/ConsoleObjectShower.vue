<template>
  <div class="console-obj">
    <div v-if="value && typeof value === 'object'" class="console-obj-item" @click="swithValOpen">
      <i :class="'iconfont icon-zuo switch' + (valCanOpen?'':' hidden') + (valOpen?' open':'')"></i>
      <slot class="key" />
      <span class="sp">:</span>
      <span>{{valName}}</span>
    </div>
    <div v-else class="console-obj-item">
      <i class="iconfont icon-zuo switch hidden"></i>
      <slot class="key" />
      <span class="sp">:</span>
      <ConsoleRefShower :value="value" @on-go-ref="(d,b,p) => $emit('on-go-ref',d,b,p)" :isTop="false" />
    </div>
    <div v-if="valOpen">
      <ConsoleObjectShower v-for="(item, k) in valChilds" :key="k" :value="item.val" @on-go-ref="(d: unknown,b: unknown,p: unknown) => $emit('on-go-ref',d,b,p)">
        <span class="key">{{item.key}}</span>
      </ConsoleObjectShower>
      <a v-if="valChildHasMore" class="show-more" @click="loadObjectChilds">显示更多(还有 {{ valChildAll - valChildNowIndex }})</a>
    </div>
  </div>
</template>

<script lang="ts">
import { defineComponent } from 'vue'
import type { ISaveableTypes } from '../../Base/Utils/BaseTypes';
import ConsoleRefShower from './ConsoleRefShower.vue'

export default defineComponent({
  name: 'ConsoleObjectShower',
  components: {
    ConsoleRefShower,
  },
  props: [ 'value' ],
  watch: {
    value() { this.loadObject() }
  },
  mounted() {
    setTimeout(() => this.loadObject(), 200);
  },
  data() {
    return {
      valName: '',
      valChilds: null as Array<{
        key?: string,
        val: ISaveableTypes
      }>|null,
      valChildHasMore: false,
      valChildAll: 0,
      valChildNowIndex: 0,
      valCanOpen: false,
      valOpen: false,
      valType: 'Others' as 'Array'|'Object'|'Set'|'Map'|'WeakMap'|'WeakSet'|'Others',
    }
  },
  methods: {
    swithValOpen() {
      if(this.valCanOpen) {
        this.valOpen = !this.valOpen;
        if(this.valChilds === null) 
          this.loadObjectChilds();
      }
    },
    loadObjectChilds() {
      if(this.valChilds === null) {
        this.valChilds = [];
        this.valChildNowIndex = 0;
      }
      switch(this.valType) {
        case 'Array': {
          let arr = this.$props.value as Array<ISaveableTypes>;
          this.valChildAll = arr.length;
          for(let i = 0, c = arr.length; this.valChildNowIndex < c && i < 100; i++, this.valChildNowIndex++) 
            this.valChilds.push({ key: this.valChildNowIndex.toString(), val: arr[i]});
          this.valChildHasMore = this.valChildNowIndex < this.valChildAll - 1;
          break;
        }
        case 'Object': {
          let obj = this.$props.value as { [index: string]: ISaveableTypes};
          let keys = Object.keys(obj);
          this.valChildAll = keys.length;
          for(let i = 0, c = keys.length; this.valChildNowIndex < c && i < 100; i++, this.valChildNowIndex++) {
            let key = keys[this.valChildNowIndex].trim();
            this.valChilds.push({ key: key, val: obj[key] });
          }
          this.valCanOpen = this.valChildAll > 0;
          this.valChildHasMore = this.valChildNowIndex < this.valChildAll - 1;
          break;
        }
        case 'Set': {
          let arr = this.$props.value as Set<ISaveableTypes>;
          let vals = new Array(arr.values());
          this.valChildAll = arr.size;
          for(let i = 0, c = arr.size; this.valChildNowIndex < c && i < 100; i++, this.valChildNowIndex++) 
            this.valChilds.push({ key: this.valChildNowIndex.toString(), val: vals[i] as unknown as ISaveableTypes});
          this.valChildHasMore = this.valChildNowIndex < this.valChildAll - 1;
          break;
        }
        case 'Map': {
          let obj = this.$props.value as Map<unknown,unknown>;
          let keys = new Array(obj.keys());
          this.valChildAll = keys.length;
          for(let i = 0, c = keys.length; this.valChildNowIndex < c && i < 100; i++, this.valChildNowIndex++) {
            let key = keys[this.valChildNowIndex];
            this.valChilds.push({ key: key + '', val: obj.get(key) as ISaveableTypes });
          }
          this.valChildHasMore = this.valChildNowIndex < this.valChildAll - 1;
          break;
        }
        default:
          this.valChildHasMore = false;
          break;
      }
    }, 
    loadObject() {
      let obj = this.$props.value;
      let str = Object.prototype.toString.call(obj);
        
      this.valOpen = false;
      this.valChildHasMore = false;
      this.valOpen = false;

      switch(str) {
        case '[object Array]': {
          this.valName = `Array(${obj.length})`;
          this.valCanOpen = true;
          this.valType = 'Array';
          break;
        } 
        case'[object Object]': {
          let keys = Object.keys(obj).slice(0, 5);
          this.valName = JSON.stringify(obj, keys);
          this.valCanOpen = true;
          this.valType = 'Object';
          break;
        } 
        case '[object Set]': {
          this.valName = `Set(${obj.size})`;
          this.valCanOpen = true;
          this.valType = 'Set';
          break;
        } 
        case '[object Map]': {
          this.valName = `Map(${obj.size})`;
          this.valCanOpen = true;
          this.valType = 'Map';
          break;
        } 
        case '[object WeakMap]': {
          this.valName = `WeakMap`;
          this.valCanOpen = true;
          this.valType = 'WeakMap';
          break;
        } 
        case '[object WeakSet]': {
          this.valName = `WeakSet`;
          this.valCanOpen = true;
          this.valType = 'WeakSet';
          break;
        } 
        default: {
          this.valName = str.trim();
          this.valCanOpen = false;
          this.valType = 'Others';
          break;
        }
      }
    }
  }
})
</script>
