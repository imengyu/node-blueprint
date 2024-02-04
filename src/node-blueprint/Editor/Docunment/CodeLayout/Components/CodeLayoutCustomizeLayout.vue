<template>
  <!--Four buttons-->
  <CodeLayoutActionsRender class="code-layout-customize-layout-actions" :actions="actions" />
  <!--Customize Layout popup-->
  <Teleport to="body">

  </Teleport>
</template>

<script setup lang="ts">
import { h, inject, computed } from 'vue';
import { useCodeLayoutLang } from '../Language';
import type { CodeLayoutActionButton } from '../CodeLayout';
import CodeLayoutActionsRender from '../CodeLayoutActionsRender.vue';
import LayoutSidebarLeftCodicon from '../Icons/LayoutSidebarLeftCodicon.vue';
import LayoutSidebarLeftOffCodicon from '../Icons/LayoutSidebarLeftOffCodicon.vue';
import LayoutPanelCodicon from '../Icons/LayoutPanelCodicon.vue';
import LayoutPanelOffCodicon from '../Icons/LayoutPanelOffCodicon.vue';
import LayoutSidebarRightCodicon from '../Icons/LayoutSidebarRightCodicon.vue';
import LayoutSidebarRightOffCodicon from '../Icons/LayoutSidebarRightOffCodicon.vue';
import LayoutCodicon from '../Icons/LayoutCodicon.vue';

const { t } = useCodeLayoutLang();

const props = defineProps({
  activityBar: {
    type: Boolean,
    default: true,
  },
  primarySideBar: {
    type: Boolean,
    default: true,
  },
  secondarySideBar: {
    type: Boolean,
    default: true,
  },
  bottomPanel: {
    type: Boolean,
    default: true,
  },
  statusBar: {
    type: Boolean,
    default: true,
  },
})
const emit = defineEmits([
  'update:activityBar',
  'update:primarySideBar',
  'update:secondarySideBar',
  'update:bottomPanel',
  'update:statusBar',
]) ;

const actions = computed<CodeLayoutActionButton[]>(() => ([
  {
    name: t('togglePrimarySideBar'),
    icon: () => props.primarySideBar ? h(LayoutSidebarLeftCodicon) : h(LayoutSidebarLeftOffCodicon),
    onClick: () => {
      emit('update:primarySideBar', !props.primarySideBar);
    },
  },
  {
    name: t('togglePanel'),
    icon: () => props.bottomPanel ? h(LayoutPanelCodicon) : h(LayoutPanelOffCodicon),
    onClick: () => {
      emit('update:bottomPanel', !props.bottomPanel);
    },
  },
  {
    name: t('toggleSecondarySideBar'),
    icon: () => props.secondarySideBar ? h(LayoutSidebarRightCodicon) : h(LayoutSidebarRightOffCodicon),
    onClick: () => {
      emit('update:secondarySideBar', !props.secondarySideBar);
    },
  },
  {
    name: t('customizeLayout'),
    icon: () => h(LayoutCodicon),
    onClick: () => {
      
    },
  },
]));

</script>

<style lang="scss">
.code-layout-customize-layout-actions {
  position: relative;
  height: 100%;
  padding-right: 10px;
  
  svg {
    width: 18px;
    height: 18px;
  }

  .code-layout-actions button:hover {
    background-color: var(--code-layout-color-background-hover-light);
  }
}
</style>