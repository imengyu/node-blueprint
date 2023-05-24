<template>
  <ColumnView :flex="1">
    <MenuBar 
      :options="menuData"
      class="node-main-menu"
    >
      <template #prefix>
        <img class="node-menu-logo" src="../Images/Logo/logo-huge-light.svg">
      </template>
    </MenuBar>
    <DockLayout
      ref="dockLayout"
      theme="dark"
      class="node-main-area"
    >
      <template #panelRender="{ panel }">
        <template v-if="panel.key.startsWith('NodeEditor')">
          <NodeDocunmentEditorComponent 
            v-if="getDocunmentByUid(panel.key.substr(10))"
            :docunment="getDocunmentByUid(panel.key.substr(10))!"
          />
        </template>
        <template v-else-if="panel.key==='Props'">
          <h1>Tab Content</h1>
          <span>This is second tab</span>
        </template>
        <template v-else-if="panel.key==='Console'">
          <Console />
        </template>
      </template>
    </DockLayout>
  </ColumnView>  
</template>

<script setup lang="ts">
import { nextTick, onMounted, reactive, ref } from 'vue';
import '@imengyu/vue-dock-layout/lib/vue-dock-layout.css';
import ColumnView from '../Nana/Layout/ColumnView.vue';
import NodeDocunmentEditorComponent from './NodeDocunmentEditor.vue';
import Console from '../Console/Console.vue';
import { DockLayout, type DockLayoutInterface } from '@imengyu/vue-dock-layout';
import { MenuBar, type MenuBarOptions } from '@imengyu/vue3-context-menu';
import { NodeDocunmentEditor } from '../Graph/Flow/NodeDocunmentEditor';

const dockLayout = ref<DockLayoutInterface>();
const menuData = reactive<MenuBarOptions>({
  theme: 'flat',
  items: [
    {
      label: '文件',
      children: [
        {
          label: '新建',
          shortcut: 'Ctrl+N',
          onClick() {
            newDocunment();
          },
        },
        {
          label: '打开',
          shortcut: 'Ctrl+O',
          divided: true,
        },
        {
          label: '保存',
          shortcut: 'Ctrl+S',
        },
        {
          label: '导出',
          shortcut: 'Ctrl+E',
          divided: true,
        },
        {
          label: '退出',
        },
      ],
    },
    {
      label: '编辑',
      children: [
        {
          label: '新建',
          shortcut: 'Ctrl+Z',
        },
        {
          label: '新建',
          shortcut: 'Ctrl+Y',
          divided: true,
        },
        {
          label: '剪贴',
          shortcut: 'Ctrl+X',
        },
        {
          label: '复制',
          shortcut: 'Ctrl+C',
        },
        {
          label: '粘贴',
          shortcut: 'Ctrl+V',
        },
        {
          label: '删除',
          shortcut: 'Delete',
        },
      ],
    },
    {
      label: '视图',
      children: [
        {
          label: '显示网格',
          divided: true,
          onClick() {
            
          },
        },
        {
          label: '放大',
          onClick() {
            
          },
        },
        {
          label: '缩小',
          onClick() {
            
          },
        },
        {
          label: '100%',
          divided: true,
        },
        {
          label: '绘制调试信息',
          onClick() {
            
          },
        },
        {
          label: '重置界面布局',
          onClick() {
            
          },
        },
      ],
    },
    {
      label: '调试',
      children: [
        {
          label: '启动调试',
          shortcut: 'F5',
        },
        {
          label: '停止调试',
          shortcut: 'Shift+F5',
          divided: true,
        },
        {
          label: '单步调试',
          shortcut: 'F10',
        },
        {
          label: '单步进入',
          shortcut: 'F11',
        },
        {
          label: '单步退出',
          shortcut: 'Shift+F11',
          divided: true,
        },
        {
          label: '启用所有断点',
        },
        {
          label: '禁用所有断点',
        },
      ],
    },
    {
      label: '帮助',
      children: [
        {
          label: '使用文档',
        },
        {
          label: '关于',
        },
      ],
    },
  ],
});
const opendDocunment = ref(new Map<string, NodeDocunmentEditor>());

function getDocunmentByUid(uid: string) {
  return opendDocunment.value.get(uid)
}

function newDocunment() {
  const doc = new NodeDocunmentEditor({
    name: '新文档',
  });
  doc.initNew();
  openDocunment(doc);
}
function closeDocunment(uid: string) {
  const doc = opendDocunment.value.get(uid)
  if (!doc)
    return;
  opendDocunment.value.delete(uid);
  dockLayout.value?.removePanel(`NodeEditor${uid}`);
}
function openDocunment(doc: NodeDocunmentEditor) {
  if (opendDocunment.value.has(doc.uid))
    return;
  
  //添加文档至界面
  opendDocunment.value.set(doc.uid, doc);
  dockLayout.value?.addPanel({
    key: `NodeEditor${doc.uid}`,
    title: doc.name,
    closeable: true,
    onClose() {
      closeDocunment(doc.uid);
      return true;
    },
  }, 'centerArea');

  //打开主图表
  setTimeout(() => {
    if (doc.activeEditor) {
      if (doc.mainGraph)
        doc.activeEditor.openGraph(doc.mainGraph);
    }
  }, 300);
}

onMounted(() => {
  nextTick(() => {
    dockLayout.value?.setData({
      name: 'root',
      size: 100,
      grids: [
        {
          size: 20,
          name: 'left',
        },
        {
          size: 60,
          name: 'center',
          grids: [
            {
              size: 70,
              name: 'centerArea',
              alwaysVisible: true,
            },
            {
              size: 30,
              name: 'centerConsole',
            },
          ],
        },
        {
          size: 20,
          name: 'right',
        },
      ],
    });
    dockLayout.value?.addPanel({
      key: 'Console',
      title: '控制台',
    }, 'centerConsole');
    dockLayout.value?.addPanel({
      key: 'Props',
      title: '属性窗口',
    }, 'right');
  })
  setTimeout(() => {
    newDocunment();
  }, 500);
});
</script>

<style lang="scss">
.node-menu-logo {
  width: 155px;
  height: 25px;
}
.node-main-menu {
  --mx-menu-backgroud: #161727!important;

  padding: 4px 6px!important;
  font-size: 13px;
  background-color: var(--mx-menu-backgroud);

  .mx-menu-bar-item {
    color: #fff!important;

    &:hover {
      background-color: #757575!important;
      color: #e9e9e9!important;
    }
    &.active {
      background-color: #fff!important;
      color: #000!important;
    }
  }
}
.node-main-area {
  flex: 1;
  width: 100%;
  top: 32px;
  height: calc(100% - 32px);
}
</style>