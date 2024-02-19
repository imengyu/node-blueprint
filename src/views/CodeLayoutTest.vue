<template>
  <div class="full-container">
    <CodeLayout 
      ref="codeLayout"
      :layout-config="config"
      :main-menu-config="menuData"
    >
      <template #centerArea>
        <SplitLayout
          ref="splitLayout"
          @panelClose="onPanelClose"
        >
          <template #tabContentRender="{ panel }">
            <h2 :style="{ margin: 0, backgroundColor: colors[panel.data] }">Grid {{ panel.name }}</h2>
          </template>
          <template #tabEmptyContentRender="{ grid }">
            <h2 :style="{ margin: 0 }">Empty Grid {{ grid.name }}</h2>
          </template>
        </SplitLayout>
      </template>
      <template #titleBarIcon>
        <img src="../node-blueprint/Editor/Images/Logo/logo.svg" style="width:18px;height:18px;margin:0 15px;">
      </template>
      <template #panelRender="{ panel }">
        <template v-if="panel.name === 'group1.panel1'">
          <CodeLayoutScrollbar>
            <p>体错致转兄鸭例收各匪扒今宾忠纠常河渣满布广遣住远卷疫偿宙继廉棚梯剃据墓壶斩损划星甲径逝诗辩侵宜否暴架嘉装赴忆吸尺趴它枯修箭统拜皱阔难艺脖耽遭谷子易道隙蚊绘谜首型失酒也个声入弦谱显榜度蔬诉宿康蹦馋恶抛坏</p>
            <p>体错致转兄鸭例收各匪扒今宾忠纠常河渣满布广遣住远卷疫偿宙继廉棚梯剃据墓壶斩损划星甲径逝诗辩侵宜否暴架嘉装赴忆吸尺趴它枯修箭统拜皱阔难艺脖耽遭谷子易道隙蚊绘谜首型失酒也个声入弦谱显榜度蔬诉宿康蹦馋恶抛坏</p>
            <p>体错致转兄鸭例收各匪扒今宾忠纠常河渣满布广遣住远卷疫偿宙继廉棚梯剃据墓壶斩损划星甲径逝诗辩侵宜否暴架嘉装赴忆吸尺趴它枯修箭统拜皱阔难艺脖耽遭谷子易道隙蚊绘谜首型失酒也个声入弦谱显榜度蔬诉宿康蹦馋恶抛坏</p>
          </CodeLayoutScrollbar>
        </template>
        <span v-else>{{ panel.size }} / {{ panel.name }}</span>
      </template>
    </CodeLayout>
  </div>
</template>

<script setup lang="ts">
import IconFile from '@/node-blueprint/Editor/Docunment/Editor/Icons/IconFile.vue';
import IconSearch from '@/node-blueprint/Editor/Docunment/Editor/Icons/IconSearch.vue';
import type { CodeLayoutConfig, CodeLayoutInstance, CodeLayoutPanelInternal } from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout';
import CodeLayout from '@/node-blueprint/Editor/Docunment/CodeLayout/CodeLayout.vue';
import CodeLayoutScrollbar from '@/node-blueprint/Editor/Docunment/CodeLayout/Components/CodeLayoutScrollbar.vue';
import { ref, reactive, onMounted, nextTick, h } from 'vue';
import type { MenuOptions } from '@imengyu/vue3-context-menu';
import type { CodeLayoutSplitNInstance } from '@/node-blueprint/Editor/Docunment/CodeLayout/SplitLayout/SplitN';
import SplitLayout from '@/node-blueprint/Editor/Docunment/CodeLayout/SplitLayout/SplitLayout.vue';

const colors = [
  '#fb0',
  '#f00',
  '#090',
  '#02a',
  '#1ff',
]

const splitLayout = ref<CodeLayoutSplitNInstance>();
const codeLayout = ref<CodeLayoutInstance>();

const config = reactive<CodeLayoutConfig>({
  primarySideBarSwitchWithActivityBar: true,
  primarySideBarPosition: 'left',
  primarySideBarWidth: 20,
  primarySideBarMinWidth: 170,
  activityBarPosition: 'side',
  secondarySideBarWidth: 20,
  secondarySideBarMinWidth: 170,
  bottomPanelHeight: 30,
  bottomPanelMinHeight: 40,
  bottomAlignment: 'center',
  statusBarHeight: '20px',
  panelHeaderHeight: 24,
  panelMinHeight: 150,
  titleBar: true,
  titleBarShowCustomizeLayout: true,
  activityBar: true,
  primarySideBar: true,
  secondarySideBar: false,
  bottomPanel: false,
  statusBar: true,
  menuBar: true,
});

const menuData : MenuOptions = {
  x: 0,
  y: 0,
  items: [
    {
      label: "File",
      children: [
        { label: "New" },
        { label: "Open" },
        { 
          label: "Open recent",
          children: [
            { label: "File 1...." },
            { label: "File 2...." },
            { label: "File 3...." },
            { label: "File 4...." },
            { label: "File 5...." },
          ],
        },
        { label: "Save", divided: true },
        { label: "Save as..." },
        { label: "Close" },
        { label: "Exit" },
      ],
    },
    {
      label: "Edit",
      children: [
        { label: "Undo" },
        { label: "Redo" },
        { label: "Cut", divided: true },
        { label: "Copy" },
        { label: "Find", divided: true },
        { label: "Replace" },
      ],
    },
    {
      label: "View",
      children: [
        { label: "Zoom in" },
        { label: "Zoom out" },
        { label: "Reset zoom" },
        { label: "Full screent", divided: true },
        { label: "Find", divided: true },
        { label: "Replace" },
      ],
    },
    {
      label: "Help",
      children: [
        { label: "About" },
      ],
    },
  ],
  zIndex: 3,
  minWidth: 230,
};

function onPanelClose(panel: CodeLayoutPanelInternal, resolve: () => void) {
  resolve();
}

onMounted(() => {
  nextTick(() => {
    if (codeLayout.value) {

      const group1 = codeLayout.value.addGroup({
        title: 'Group1',
        tooltip: 'Group1',
        name: 'group1',
        tabStyle: 'single',
        badge: '2',
        iconLarge: () => h(IconFile),
      }, 'primarySideBar');
      codeLayout.value.addGroup({
        title: 'Group2',
        tooltip: 'Group2',
        name: 'group2',
        tabStyle: 'single',
        iconLarge: () => h(IconSearch),
      }, 'primarySideBar');

      const bottomGroup = codeLayout.value.getRootGrid('bottomPanel');
      const secondaryGroup = codeLayout.value.getRootGrid('secondarySideBar');

      for (let i = 4; i < 13; i++) {
        
        codeLayout.value.addGroup({
          title: 'Group' + i,
          tooltip: 'Group' + i,
          name: 'group1' + i,
          tabStyle: 'single',
          iconLarge: () => h(IconSearch),
        }, 'primarySideBar');
      }

      group1.addPanel({
        title: 'Panel1',
        tooltip: 'Panel1',
        name: 'group1.panel1',
        noHide: true,
        startOpen: true,
        iconSmall: () => h(IconSearch),
      });
      group1.addPanel({
        title: 'Panel2',
        tooltip: 'Panel2',
        name: 'group1.panel2',
        iconSmall: () => h(IconSearch),
        actions: [
          { 
            name: 'test',
            icon: () => h(IconSearch),
            onClick() {},
          },
          { 
            name: 'test2',
            icon: () => h(IconFile),
            onClick() {},
          },
        ]
      });
      group1.addPanel({
        title: 'Panel3',
        tooltip: 'Panel3',
        name: 'group1.panel3',
        startOpen: true,
        iconSmall: () => h(IconSearch),
        actions: [
          { 
            name: 'test',
            icon: () => h(IconSearch),
            onClick() {},
          },
        ]
      });
    
      bottomGroup.addPanel({
        title: 'Panel4',
        tooltip: 'Panel4',
        name: 'group3.panel4',
        iconSmall: () => h(IconSearch),
        badge: '2',
        actions: [
          { 
            name: 'test',
            icon: () => h(IconSearch),
            onClick() {},
          },
        ]
      });
      const panel5 = bottomGroup.addPanel({
        title: 'Panel5',
        tooltip: 'Panel5',
        name: 'group3.panel5',
        startOpen: true,
        iconSmall: () => h(IconSearch),
      });

      panel5.addPanel({
        title: 'Panel51',
        tooltip: 'Panel51',
        name: 'group3.panel5.panel1',
        iconSmall: () => h(IconSearch),
        actions: [
          { 
            name: 'test',
            icon: () => h(IconSearch),
            onClick() {},
          },
        ]
      });
      panel5.addPanel({
        title: 'Panel5.2',
        tooltip: 'Panel5.2',
        name: 'group3.panel5.panel2',
        iconSmall: () => h(IconFile),
      });
    }

    if (splitLayout.value) {
      const grid = splitLayout.value.getRootGrid();
      const grid1 = grid.addGrid({
        name: '0',
        visible: true,
        size: 0,
        direction: 'horizontal',
      });
      grid.addGrid({
        name: '2',
        visible: true,
        size: 0,
        minSize: 100,
      });
      const grid3 = grid1.addGrid({
        name: '3',
        visible: true,
        size: 0,
        minSize: 0,
      });
      grid1.addGrid({
        name: '4',
        visible: true,
        size: 0,
        minSize: 100,
        canMinClose: true,
      });

      grid3.addPanel({
        title: 'Panel3-1',
        tooltip: 'Panel3-1',
        name: 'panel3.1',
        startOpen: true,
        iconSmall: () => h(IconSearch),
        data: 2,
      });
      grid3.addPanel({
        title: 'Panel3-2',
        tooltip: 'Panel3-2',
        name: 'panel3.2',
        startOpen: true,
        data: 1,
        closeType: 'close',
        iconSmall: () => h(IconSearch),
      });
      grid3.addPanel({
        title: 'Panel3-3',
        tooltip: 'Panel3-3',
        name: 'panel3.3',
        startOpen: true,
        data: 3,
        closeType: 'unSave',
        iconSmall: () => h(IconSearch),
      });
      grid3.addPanel({
        title: 'Panel3-4',
        tooltip: 'Panel3-4',
        name: 'panel3.4',
        startOpen: true,
        data: 4,
        iconSmall: () => h(IconSearch),
      });
    }
  });
});

</script>

<style>
.full-container {
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}
</style>