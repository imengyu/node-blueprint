<template>
  <div class="code-layout-split-tab">
    <!--tab list-->
    <div 
      ref="tabScroll" 
      :class="'code-layout-split-tab-list'+(forbiddenChildePointerEvents?' forbidden-childe-pointer-events':'')" 
    >
      <div class="tabs">
        <div 
          v-for="(panel, index) in grid.children"
          :key="index"
          :class="[
            'item',
            panel === grid.activePanel ? 'active' : '',
          ]"
          @click="grid.setActiveChild(panel)"
        >
          <!-- icon and title -->
          <span class="icon"> 
            <CodeLayoutVNodeStringRender :content="panel.iconSmall || panel.iconLarge" />
          </span>
          <span class="title">{{ panel.title }}</span>
          <span v-if="panel.badge" class="badge">
            <CodeLayoutVNodeStringRender :content="panel.badge" />
          </span>

          <!-- close -->
          <span v-if="panel.closeType !== 'none'" class="close">
            <IconClose v-if="panel.closeType === 'close'" class="close-icon" />
            <IconDot v-if="panel.closeType === 'unSave'" class="unsave-dot" />
          </span>
        </div>
      </div>
    </div>
    <!--tab content -->
    <div class="dock-tab-content">
      <slot v-if="grid.activePanel" name="tabContentRender" :panel="grid.activePanel" />
      <slot v-else name="tabEmptyContentRender" :grid="grid" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, type PropType } from 'vue';
import type { CodeLayoutSplitNGridInternal, CodeLayoutSplitNPanelInternal } from './SplitN';
import CodeLayoutVNodeStringRender from '../Components/CodeLayoutVNodeStringRender.vue';
import IconClose from '../Icons/IconClose.vue';
import IconDot from '../Icons/IconDot.vue';

const props = defineProps({
  grid: {
    type: Object as PropType<CodeLayoutSplitNGridInternal>,
    default: null,
  },
});

const tabScroll = ref<HTMLElement>();
const forbiddenChildePointerEvents = ref(false);


</script>