<template>
  <div class="prop-vec-tab">
    <div 
      class="tabs"
      @whell="onTabItemMouseWhell($event)"
    >
      <div 
        v-for="(tab, index) in tabs"
        :key="index"
        v-tooltip="tab.title"
        :class="[ 
          'item',
          activeTab === index ? 'active' : '',
        ]"
        @mousedown="onTabItemMouseDown($event, index)"
      >
        <Icon :icon="tab.icon" />
      </div>
    </div>
    <div class="content">
      <slot />
    </div>
  </div>
</template>


<script setup lang="ts">
import { ref, type Ref, provide } from "vue";
import Icon from '../../Nana/Icon.vue';

export interface PropTabItem {
  id: number,
  title: string,
  icon: string,
}
export interface PropTabContext {
  activeTab: Ref<number>,
  nextTabId: () => number,
  registerTab: (item: PropTabItem) => void,
  unRegisterTab: (id: number) => void,
}

let tabId = 0;
const tabs = ref<PropTabItem[]>([]);
const activeTab = ref(0);

const emit = defineEmits([ 'onTabClick' ]);

provide<PropTabContext>('PropTabContext', {
  activeTab,
  nextTabId: () => tabId++,
  registerTab: (item: PropTabItem) => {
    tabs.value.push(item);
  },
  unRegisterTab: (id: number) => {
    tabs.value.splice(tabs.value.findIndex(item => item.id === id), 1);
  },
});

function onTabItemMouseDown(e : MouseEvent, index : number) {
  emit('onTabClick', index);
  activeTab.value = tabs.value[index].id;
}
function onTabItemMouseWhell(e : WheelEvent) {
  let el = e.target as HTMLElement;
  if(el) {
    if(e.deltaY < 0) {
      if(el.scrollLeft > 0) el.scrollLeft -= 10;
      else el.scrollLeft = 0;
    } else if(e.deltaY > 0) {
      if(el.scrollLeft < el.scrollWidth) el.scrollLeft += 10;
      else el.scrollLeft = el.scrollWidth;
    }
  }
}
</script>

<style lang="scss">
@import "../../Nana/Scss/Scroll.scss";

$tab-size: 30px;

.prop-vec-tab {
  display: block;
  position: relative;
  height: 100%;
  background-color: var(--mx-editor-tab-mormal-color);

  .tabs {
    display: inline-block;
    position: absolute;
    width: $tab-size;
    top: 0;
    left: 0;
    bottom: 0;

    &::before {
      display: inline-block;
      position: absolute;
      content: '';
      top: 0;
      right: 0;
      bottom: 0;
      width: 1px;
      z-index: 0;
      background-color: var(--mx-editor-border-color-dark);
    }

    .item {
      position: relative;
      display: inline-flex;
      padding: 0px;
      margin: 2px 0;
      cursor: pointer;
      color: var(--mx-editor-text-color);
      border: 1px solid transparent;
      justify-content: center;
      align-items: center;
      height: $tab-size;
      width: $tab-size;
      vertical-align: middle;

      .icon {
        display: inline-block;
      } 

      svg {
        fill: var(--mx-editor-text-color);
      }

      &:hover {
        background-color: var(--mx-editor-tab-active-color);
      }
      &.active {
        background-color: var(--mx-editor-tab-active-color);
        border-right-color: var(--mx-editor-tab-active-color);
        border-bottom-color: var(--mx-editor-border-color-dark);
        border-left-color: var(--mx-editor-border-color-dark);
        border-top-color: var(--mx-editor-border-color-dark);

        &::before {
          position: absolute;
          display: inline-block;
          content: '';
          width: 100%;
          bottom: -1px;
          left: 0;
          background-color: var(--mx-editor-border-color-dark);
        }
      }    
    }
  }
  .content {
    position: absolute;
    background-color: var(--mx-editor-tab-active-color);
    left: $tab-size;
    top: 0;
    bottom: 0;
    right: 0;
    overflow-x: hidden;
    overflow-y: scroll;

    @include pc-fix-scrollbar();

    > div {
      display: block;
      height: 100%;
    }
  }
}
</style>