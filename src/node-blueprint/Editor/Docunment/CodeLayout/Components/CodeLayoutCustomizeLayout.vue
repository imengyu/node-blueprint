<template>
  <!--Four buttons-->
  <CodeLayoutActionsRender class="code-layout-customize-layout-actions" :actions="actions" />
  <!--Customize Layout popup-->
  <Teleport to="body">
    <div 
      v-if="showCustomizeLayout"
      ref="customizeLayoutPopup"
      tabindex="0"
      class="code-layout-customize-layout"
      @keydown="handleCustomizeLayoutControlItemKeyDown"
    >
      <div class="header">
        {{ t('customizeLayout') }}
        <CodeLayoutActionsRender :actions="customizeLayoutControlActions" />
      </div>
      <div class="list">
        <div 
          v-for="(item, key) in customizeLayoutControlItems"
          :ref="(v) => (customizeLayoutControlItemRefs[key] = v as HTMLElement)"
          :key="key"
          :class="[
            'item',
            item.splited ? 'splited' : '',
            item.visibility ? 'visibility' : '',
            customizeLayoutControlActive === key ? 'active' : '',
          ]"
          tabindex="0"
          @click="handleCustomizeLayoutControlItemClick(key)"
        >
          <div>
            <CodeLayoutVNodeStringRender :content="item.icon" />
            <span class="title">{{ item.title }}</span>
            <IconCheck v-if="item.checked" class="check" />
          </div>
          <div>
            <span class="right">{{ item.rightText }}</span>
            <IconEyeCodicon v-if="item.showVisibility && item.visibility" class="eye" />
            <IconEyeClosedCodicon v-else-if="item.showVisibility" class="eye" />
          </div>
        </div>
      </div>
    </div>
  </Teleport>
</template>

<script setup lang="ts">
import { h, inject, computed, ref, type Ref, type VNode, nextTick } from 'vue';
import { useCodeLayoutLang } from '../Language';
import type { CodeLayoutActionButton, CodeLayoutConfig } from '../CodeLayout';
import CodeLayoutActionsRender from '../CodeLayoutActionsRender.vue';
import LayoutSidebarLeftCodicon from '../Icons/LayoutSidebarLeftCodicon.vue';
import LayoutSidebarLeftOffCodicon from '../Icons/LayoutSidebarLeftOffCodicon.vue';
import LayoutPanelCodicon from '../Icons/LayoutPanelCodicon.vue';
import LayoutPanelOffCodicon from '../Icons/LayoutPanelOffCodicon.vue';
import LayoutSidebarRightCodicon from '../Icons/LayoutSidebarRightCodicon.vue';
import LayoutSidebarRightOffCodicon from '../Icons/LayoutSidebarRightOffCodicon.vue';
import LayoutCodicon from '../Icons/LayoutCodicon.vue';
import LayoutMenubarCodicon from '../Icons/LayoutMenubarCodicon.vue';
import LayoutActivitybarLeftCodicon from '../Icons/LayoutActivitybarLeftCodicon.vue';
import LayoutStatusbarCodicon from '../Icons/LayoutStatusbarCodicon.vue';
import LayoutPanelLeftCodicon from '../Icons/LayoutPanelLeftCodicon.vue';
import LayoutPanelRightCodicon from '../Icons/LayoutPanelRightCodicon.vue';
import LayoutPanelCenterCodicon from '../Icons/LayoutPanelCenterCodicon.vue';
import LayoutPanelJustifyCodicon from '../Icons/LayoutPanelJustifyCodicon.vue';
import IconResetDefault from '../Icons/IconResetDefault.vue';
import IconClose from '../Icons/IconClose.vue';
import IconCheck from '../Icons/IconCheck.vue';
import IconEyeCodicon from '../Icons/IconEyeCodicon.vue';
import IconEyeClosedCodicon from '../Icons/IconEyeClosedCodicon.vue';
import CodeLayoutVNodeStringRender from './CodeLayoutVNodeStringRender.vue';

const { t } = useCodeLayoutLang();

const layoutConfig = inject('codeLayoutConfig') as Ref<CodeLayoutConfig>;

const showCustomizeLayout = ref(false);
const customizeLayoutPopup = ref<HTMLElement>();
const customizeLayoutControlActive = ref(0);
const customizeLayoutControlItemRefs = ref<HTMLElement[]>([]);
const customizeLayoutControlItems = computed<{
  title: string,
  rightText?: string,
  icon: () => VNode,
  click: () => void,
  splited?: boolean,
  checked?: boolean,
  visibility?: boolean,
  showVisibility?: boolean,
}[]>(() => ([
  {
    title: t('menuBar'),
    icon: () => h(LayoutMenubarCodicon),
    click: () => layoutConfig.value.menuBar = !layoutConfig.value.menuBar,
    rightText: t('visibility'),
    visibility: layoutConfig.value.menuBar,
    showVisibility: true,
  },
  {
    title: t('activityBar'),
    icon: () => h(LayoutActivitybarLeftCodicon),
    click: () => layoutConfig.value.activityBar = !layoutConfig.value.activityBar,
    visibility: layoutConfig.value.activityBar,
    showVisibility: true,
  },
  {
    title: t('primarySideBar'),
    icon: () => h(LayoutSidebarLeftCodicon),
    click: () => layoutConfig.value.primarySideBar = !layoutConfig.value.primarySideBar,
    visibility: layoutConfig.value.primarySideBar,
    showVisibility: true,
  },
  {
    title: t('secondarySideBar'),
    icon: () => h(LayoutSidebarRightCodicon),
    click: () => layoutConfig.value.secondarySideBar = !layoutConfig.value.secondarySideBar,
    visibility: layoutConfig.value.secondarySideBar,
    showVisibility: true,
  },
  {
    title: t('panel'),
    icon: () => h(LayoutPanelCodicon),
    click: () => layoutConfig.value.bottomPanel = !layoutConfig.value.bottomPanel,
    visibility: layoutConfig.value.bottomPanel,
    showVisibility: true,
  },
  {
    title: t('statusBar'),
    icon: () => h(LayoutStatusbarCodicon),
    click: () => layoutConfig.value.statusBar = !layoutConfig.value.statusBar,
    visibility: layoutConfig.value.statusBar,
    showVisibility: true,
  },
  {
    title: t('left'),
    rightText: t('primarySideBarPosition'),
    icon: () => h(LayoutSidebarLeftCodicon),
    click: () => layoutConfig.value.primarySideBarPosition = 'left',
    splited: true,
    checked: layoutConfig.value.primarySideBarPosition === 'left',
  },
  {
    title: t('right'),
    icon: () => h(LayoutSidebarLeftCodicon),
    click: () => layoutConfig.value.primarySideBarPosition = 'right',
    checked: layoutConfig.value.primarySideBarPosition === 'right',
  },
  {
    title: t('left'),
    rightText: t('panelAlignment'),
    icon: () => h(LayoutPanelLeftCodicon),
    click: () => layoutConfig.value.bottomAlignment = 'left',
    splited: true,
    checked: layoutConfig.value.bottomAlignment === 'left',
  },
  {
    title: t('right'),
    icon: () => h(LayoutPanelRightCodicon),
    click: () => layoutConfig.value.bottomAlignment = 'right',
    checked: layoutConfig.value.bottomAlignment === 'right',
  },
  {
    title: t('center'),
    icon: () => h(LayoutPanelCenterCodicon),
    click: () => layoutConfig.value.bottomAlignment = 'center',
    checked: layoutConfig.value.bottomAlignment === 'center',
  },
  {
    title: t('justify'),
    icon: () => h(LayoutPanelJustifyCodicon),
    click: () => layoutConfig.value.bottomAlignment = 'justify',
    checked: layoutConfig.value.bottomAlignment === 'justify',
  },
]));
const customizeLayoutControlActions : CodeLayoutActionButton[] = [
  {
    name: t('restoreDefault'),
    icon: () => h(IconResetDefault),
    onClick() {
      layoutConfig.value.onResetDefault?.();
    },
  },
  {
    name: t('close'),
    icon: () => h(IconClose),
    onClick() {
      showCustomizeLayout.value = false;
    },
  }
]

function handleCustomizeLayoutControlItemClick(index: number) {
  customizeLayoutControlActive.value = index;
  customizeLayoutControlItemRefs.value[customizeLayoutControlActive.value].focus();
  customizeLayoutControlItems.value[customizeLayoutControlActive.value].click();
}
function handleCustomizeLayoutControlItemKeyDown(e: KeyboardEvent) {
  switch (e.key) {
    case 'ArrowUp':
      customizeLayoutControlActive.value = Math.max(customizeLayoutControlActive.value - 1, 0);
      customizeLayoutControlItemRefs.value[customizeLayoutControlActive.value].focus();
      break;
    case 'ArrowDown':
      customizeLayoutControlActive.value = Math.min(
        customizeLayoutControlActive.value + 1, 
        customizeLayoutControlItems.value.length - 1
      );
      customizeLayoutControlItemRefs.value[customizeLayoutControlActive.value].focus();
      break;
    case ' ':
    case 'Enter':
      customizeLayoutControlItems.value[customizeLayoutControlActive.value].click();
      break;
  } 
}

const actions = computed<CodeLayoutActionButton[]>(() => ([
  {
    name: t('togglePrimarySideBar'),
    tooltip: t('togglePrimarySideBar'),
    icon: () => layoutConfig.value.primarySideBar ? h(LayoutSidebarLeftCodicon) : h(LayoutSidebarLeftOffCodicon),
    onClick: () => {
      layoutConfig.value.primarySideBar = !layoutConfig.value.primarySideBar;
    },
  },
  {
    name: t('togglePanel'),
    tooltip: t('togglePanel'),
    icon: () => layoutConfig.value.bottomPanel ? h(LayoutPanelCodicon) : h(LayoutPanelOffCodicon),
    onClick: () => {
      layoutConfig.value.bottomPanel = !layoutConfig.value.bottomPanel;
    },
  },
  {
    name: t('toggleSecondarySideBar'),
    tooltip: t('toggleSecondarySideBar'),
    icon: () => layoutConfig.value.secondarySideBar ? h(LayoutSidebarRightCodicon) : h(LayoutSidebarRightOffCodicon),
    onClick: () => {
      layoutConfig.value.secondarySideBar = !layoutConfig.value.secondarySideBar;
    },
  },
  {
    name: t('customizeLayout'),
    tooltip: t('customizeLayout'),
    icon: () => h(LayoutCodicon),
    onClick: () => {
      showCustomizeLayout.value = !showCustomizeLayout.value;
      if (showCustomizeLayout.value)
        nextTick(() => customizeLayoutPopup.value?.focus());
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
.code-layout-customize-layout {
  position: fixed;
  top: 5px;
  left: 50%;
  width: 600px;
  border-radius: var(--code-layout-border-radius-small);
  margin-left: -300px;
  z-index: 10;
  background-color: var(--code-layout-color-background-second);
  box-shadow: 0 0 5px 1px var(--code-layout-color-shadow);
  color: var(--code-layout-color-text);
  font-size: var(--code-layout-font-size);
  overflow: hidden;

  .header {
    padding: 4px 0;
    text-align: center;
    background-color: var(--code-layout-color-background-light);

    .code-layout-actions {
      position: absolute;
      top: 0;
      right: 0;

      svg {
        width: 18px;
        height: 18px;
      }
    }
  } 
  .list {
    padding: 2px 4px;

    .item {
      position: relative;
      display: flex;
      flex-direction: row;
      justify-content: space-between;
      align-items: center;
      padding: 3px 10px;
      cursor: pointer;
      user-select: none;
      border-radius: var(--code-layout-border-radius-small);

      div {
        display: flex;
        flex-direction: row;
        align-items: center;
      }

      &.splited {
        margin-top: 2px;

        &::after {
          position: absolute;
          left: 0;
          right: 0;
          top: -1px;
          height: 1px;
          content: '';
          background-color: var(--code-layout-color-border);
        }
      }

      svg {
        width: 18px;
        height: 18px;
      }

      .eye {
        margin-left: 5px;
        display: none;
      }
      .check {
        width: 18px;
        height: 18px;
        margin-left: 3px;
      }

      .title {
        margin-left: 5px;
      }
      .right {
        color: var(--code-layout-color-text-highlight);
      }

      &:active, &:hover, &.active {
        .eye {
          display: initial;
        }
      }

      &:hover {
        background-color: var(--code-layout-color-background-light);
      }
      &:active, &.active, &:focus {
        background-color: var(--code-layout-color-background-highlight);

        .right {
          color: var(--code-layout-color-text-light);
        }
      }
    }
  }
}
</style>