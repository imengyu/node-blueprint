<template>
  <div 
    :class="[
      'tree-list-item',
      itemClass,
      open ? 'open' : '',
    ]"
    :style="{
      paddingLeft: `${level * 5 + 10}px`
    }"
    tabindex="20"
    @click="onClick"
    @contextmenu="onContextMenu"
  >
    <div 
      v-if="level > 0"
      class="line" 
      :style="{
        left: `${level * 5 + 10}px`
      }"
    />
    <div>
      <Icon v-if="children.length > 0" icon="icon-arrow-right-bold" class="arrow" />
      <span v-else class="arrow-placeholder" />

      <slot name="itemLeft" :level="level" :item="item" />
    </div>
    <div>
      <slot name="itemRight" :level="level" :item="item" />
    </div>
  </div>
  <!--Child-->
  <template v-if="open && children.length > 0">
    <TreeListItem
      v-for="child in children"
      :key="child.key"
      :dsec="dsec"
      :item="child"
      :level="level+1"
      :defaultOpen="defaultOpen"
      :itemClass="itemClass"
    >
      <template #itemLeft="values : any">
        <slot name="itemLeft" v-bind="values" />
      </template>
      <template #itemRight="values : any">
        <slot name="itemRight" v-bind="values" />
      </template>
    </TreeListItem>
  </template>
</template>

<script setup lang="ts">
import { computed, inject, onMounted, ref, watch, type PropType } from 'vue';
import { 
  type TreeListContext, type ITreeListItem,type ITreeListDescItem,
  TreeListContextKey, TreeListDefaultDesc
} from './TreeList';
import Icon from '../../Nana/Icon.vue';

const props = defineProps({
  item: {
    type: Object as PropType<ITreeListItem>,
    default: null,
  },
  level: {
    type: Number,
    default: 0,
  },
  dsec: {
    type: Object as PropType<ITreeListDescItem[]>,
    default: null,
  },
  defaultOpen: {
    type: Boolean,
    default: false,
  },
  itemClass: {
    type: String,
    default: '',
  },
});

const open = ref(props.defaultOpen);

const descMap = computed(() => {
  return props.dsec?.[props.level] ?? TreeListDefaultDesc;
});
const children = computed(() => {
  return props.item[descMap.value.childrenKey] || [];
});

const context = inject(TreeListContextKey) as TreeListContext;

function loadOpenState() {
  const item = props.item;
  if (descMap.value.openKey && item)
    open.value = item[descMap.value.openKey];
}

function onClick() {
  const item = props.item;
  if (children.value.length > 0) {
    open.value = !open.value;
    if (open.value)
      context.itemOpen(item);
    else
      context.itemClose(item);
    return;
  }
  context.itemClick(item);
}
function onContextMenu(e: MouseEvent) {
  context.itemContextMenu(props.item, e);
}

watch(open, (v) => {
  const item = props.item;
  if (descMap.value.openKey && item)
    item[descMap.value.openKey] = v;
})
watch(() => props.item, () => {
  loadOpenState();
})
onMounted(() => {
  loadOpenState();
});

</script>