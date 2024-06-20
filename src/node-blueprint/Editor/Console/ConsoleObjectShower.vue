<template>
  <div class="console-obj">
    <div v-if="value && typeof value === 'object'" class="console-obj-item" @click="swithValOpen">
      <Icon 
        icon="icon-arrow-right-filling"
        fill="currentColor"
        :class="'switch' + (valCanOpen?'':' hidden') + (valOpen?' open':'')" 
        :size="12"
      />
      <slot class="key" />
      <span class="sp">:</span>
      <span>{{ valName }}</span>
    </div>
    <div v-else class="console-obj-item">
      <Icon 
        icon="icon-arrow-right-filling"
        class="switch hidden"
        fill="currentColor"
        :size="12"
      />
      <slot class="key" />
      <span class="sp">:</span>
      <ConsoleRefShower :value="value" :isTop="false" @onGoRef="(d,b,p) => $emit('onGoRef',d,b,p)" />
    </div>
    <div v-if="valOpen">
      <ConsoleObjectShower v-for="(item, k) in valChilds" :key="k" :value="item.val" @on-go-ref="(d: unknown,b: unknown,p: unknown) => $emit('onGoRef',d,b,p)">
        <span class="key">{{ item.key }}</span>
      </ConsoleObjectShower>
      <a v-if="valChildHasMore" class="show-more" @click="loadObjectChilds">显示更多(还有 {{ valChildAll - valChildNowIndex }})</a>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { onMounted, ref, watch } from 'vue'
import type { ISaveableTypes } from '../../Base/Utils/BaseTypes';
import ConsoleRefShower from './ConsoleRefShower.vue'
import Icon from '../Nana/Icon.vue';

defineEmits([ 'onGoRef' ]);
const props = defineProps({
  value: {
    type: null,
    default: null,
  },
});

const valName = ref('');
const valChilds = ref<{
  key?: string,
  val: ISaveableTypes
}[]|null>(null);
const valChildHasMore = ref(false);
const valChildAll = ref(0);
const valChildNowIndex = ref(0);
const valCanOpen = ref(false);
const valOpen = ref(false);
const valType = ref<'Array'|'Object'|'Set'|'Map'|'WeakMap'|'WeakSet'|'Others'>('Others');

watch(() => props.value, () => {
  loadObject();
})

onMounted(() => {
  setTimeout(() => loadObject(), 200);
})


function swithValOpen() {
  if(valCanOpen.value) {
    valOpen.value = !valOpen.value;
    if(valChilds.value === null) 
      loadObjectChilds();
  }
}
function loadObjectChilds() {
  if(valChilds.value === null) {
    valChilds.value = [];
    valChildNowIndex.value = 0;
  }
  switch(valType.value) {
    case 'Array': {
      let arr = props.value as Array<ISaveableTypes>;
      valChildAll.value = arr.length;
      for(let i = 0, c = arr.length; valChildNowIndex.value < c && i < 100; i++, valChildNowIndex.value++) 
        valChilds.value.push({ key: valChildNowIndex.value.toString(), val: arr[i]});
      valChildHasMore.value = valChildNowIndex.value < valChildAll.value - 1;
      break;
    }
    case 'Object': {
      let obj = props.value as { [index: string]: ISaveableTypes};
      let keys = Object.keys(obj);
      valChildAll.value = keys.length;
      for(let i = 0, c = keys.length; valChildNowIndex.value < c && i < 100; i++, valChildNowIndex.value++) {
        let key = keys[valChildNowIndex.value].trim();
        valChilds.value.push({ key: key, val: obj[key] });
      }
      valCanOpen.value = valChildAll.value > 0;
      valChildHasMore.value = valChildNowIndex.value < valChildAll.value - 1;
      break;
    }
    case 'Set': {
      let arr = props.value as Set<ISaveableTypes>;
      let vals = new Array(arr.values());
      valChildAll.value = arr.size;
      for(let i = 0, c = arr.size; valChildNowIndex.value < c && i < 100; i++, valChildNowIndex.value++) 
        valChilds.value.push({ key: valChildNowIndex.value.toString(), val: vals[i] as unknown as ISaveableTypes});
      valChildHasMore.value = valChildNowIndex.value < valChildAll.value - 1;
      break;
    }
    case 'Map': {
      let obj = props.value as Map<unknown,unknown>;
      let keys = new Array(obj.keys());
      valChildAll.value = keys.length;
      for(let i = 0, c = keys.length; valChildNowIndex.value < c && i < 100; i++, valChildNowIndex.value++) {
        let key = keys[valChildNowIndex.value];
        valChilds.value.push({ key: key + '', val: obj.get(key) as ISaveableTypes });
      }
      valChildHasMore.value = valChildNowIndex.value < valChildAll.value - 1;
      break;
    }
    default:
      valChildHasMore.value = false;
      break;
  }
}
function loadObject() {
  let obj = props.value;
  let str = Object.prototype.toString.call(obj);
    
  valOpen.value = false;
  valChildHasMore.value = false;
  valOpen.value = false;

  switch(str) {
    case '[object Array]': {
      valName.value = `Array(${obj.length})`;
      valCanOpen.value = true;
      valType.value = 'Array';
      break;
    } 
    case'[object Object]': {
      let keys = Object.keys(obj).slice(0, 5);
      valName.value = JSON.stringify(obj, keys);
      valCanOpen.value = true;
      valType.value = 'Object';
      break;
    } 
    case '[object Set]': {
      valName.value = `Set(${obj.size})`;
      valCanOpen.value = true;
      valType.value = 'Set';
      break;
    } 
    case '[object Map]': {
      valName.value = `Map(${obj.size})`;
      valCanOpen.value = true;
      valType.value = 'Map';
      break;
    } 
    case '[object WeakMap]': {
      valName.value = `WeakMap`;
      valCanOpen.value = true;
      valType.value = 'WeakMap';
      break;
    } 
    case '[object WeakSet]': {
      valName.value = `WeakSet`;
      valCanOpen.value = true;
      valType.value = 'WeakSet';
      break;
    } 
    default: {
      valName.value = str.trim();
      valCanOpen.value = false;
      valType.value = 'Others';
      break;
    }
  }
}

</script>
