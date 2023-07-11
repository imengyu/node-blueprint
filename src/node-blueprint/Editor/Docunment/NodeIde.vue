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
      @activeTabChange="onActiveTabChange"
    >
      <template #panelRender="{ panel }">
        <template v-if="panel.key.startsWith('NodeEditor')">
          <NodeDocunmentEditorComponent 
            v-if="opendDocunment.has(panel.key.substr(10))"
            :docunment="getDocunmentByUid(panel.key.substr(10))!"
            :editorSettings="editorSettings"
            @activeGraphEditorChange="(g: NodeGraph) => onActiveGraphEditorChange(panel.key.substr(10), g)"
            @activeGraphSelectionChange="(p1, p2, p3) => onActiveGraphSelectionChange(panel.key.substr(10), p1, p2, p3)"
          />
        </template>
        <template v-else-if="panel.key==='Props'">
          <PropBox class="node-custom-editor">
            <NodeDocunmentProp v-if="currentActiveDocunment" :doc="(currentActiveDocunment as NodeDocunment)" />
          </PropBox>
        </template>
        <template v-else-if="panel.key==='Console'">
          <Console />
        </template>
      </template>
    </DockLayout>
  </ColumnView>  
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, provide } from 'vue';
import ColumnView from '../Nana/Layout/ColumnView.vue';
import NodeDocunmentEditorComponent from './NodeDocunmentEditor.vue';
import NodeDocunmentProp from './Prop/NodeDocunmentProp.vue';
import PropBox from './Prop/Common/PropBox.vue';
import Console from '../Console/Console.vue';
import SettingsUtils from '@/node-blueprint/Base/Utils/SettingsUtils';
import { DockLayout, DockPanel, type DockLayoutInterface } from '../Nana/DockLayout';
import { MenuBar, type MenuBarOptions } from '@imengyu/vue3-context-menu';
import { NodeDocunmentEditor } from '../Graph/Flow/NodeDocunmentEditor';
import type { INodeGraphEditorSettings } from '../Graph/NodeGraphEditor.vue';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import type { NodeIdeControlContext } from './NodeIde';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeEditor } from '../Graph/Flow/NodeEditor';
import type { NodeConnectorEditor } from '../Graph/Flow/NodeConnectorEditor';

const dockLayout = ref<DockLayoutInterface>();

//#region 设置

const editorSettings = reactive<INodeGraphEditorSettings>(SettingsUtils.getSettings('NodeIdeEditorSettings', {
  topMargin: 30,
  drawDebugInfo: false,
  drawGrid: true,
}));

function saveSettings() {
  SettingsUtils.setSettings('NodeIdeEditorSettings', editorSettings);
}

onBeforeUnmount(saveSettings)
window.addEventListener('beforeunload', saveSettings);

//#endregion

//#region 菜单管理

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
          label: '撤销',
          shortcut: 'Ctrl+Z',
        },
        {
          label: '恢复',
          shortcut: 'Ctrl+Y',
          divided: true,
        },
        {
          label: '剪贴',
          shortcut: 'Ctrl+X',
          onClick() {
            getCurrentActiveGraphEditor()?.cutSelectionNodes();
          },
        },
        {
          label: '复制',
          shortcut: 'Ctrl+C',
          onClick() {
            getCurrentActiveGraphEditor()?.copySelectionNodes();
          },
        },
        {
          label: '粘贴',
          shortcut: 'Ctrl+V',
          onClick() {
            getCurrentActiveGraphEditor()?.pasteNodes();
          },
        },
        {
          label: '删除',
          shortcut: 'Delete',
          onClick() {
            getCurrentActiveGraphEditor()?.userDelete();
          },
        },
      ],
    },
    {
      label: '视图',
      children: [
        {
          label: '显示网格',
          divided: true,
          checked: editorSettings.drawGrid,
          onClick() {
            editorSettings.drawGrid = !editorSettings.drawGrid;
            this.checked = editorSettings.drawGrid;
          },
        },
        {
          label: '放大',
          shortcut: 'Ctrl+鼠标滚轮上',
          onClick() {
            getCurrentActiveGraphEditor()?.zoomIn();
          },
        },
        {
          label: '缩小',
          shortcut: 'Ctrl+鼠标滚轮下',
          onClick() {
            getCurrentActiveGraphEditor()?.zoomOut();
          },
        },
        {
          label: '100%',
          shortcut: 'Ctrl+0',
          divided: true,
          onClick() {
            getCurrentActiveGraphEditor()?.zoomSet(100);
          },
        },
        {
          label: '绘制调试信息',
          checked: editorSettings.drawDebugInfo,
          onClick() {
            editorSettings.drawDebugInfo = !editorSettings.drawDebugInfo;
            this.checked = editorSettings.drawDebugInfo;
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

//#endregion

//#region 属性栏管理



//#endregion

//#region 文档管理

const opendDocunment = ref(new Map<string, NodeDocunmentEditor>());
const currentActiveDocunment = ref<NodeDocunment|null>(null);
const currentActiveGraph = ref<NodeGraph|null>(null);
const currentActiveNode = ref<NodeEditor|null>(null);
const currentActiveConnector = ref<NodeConnectorEditor|null>(null);

/**
 * 获取当前打开的编辑器
 */
function getCurrentActiveGraphEditor() {
  return currentActiveDocunment.value?.activeEditor?.getActiveGraph()?.activeEditor || null;
}
/**
 * 通过UID获取文档实例
 * @param uid 
 */
function getDocunmentByUid(uid: string) {
  return opendDocunment.value.get(uid)
}
/**
 * 文档更改事件
 */
function onCurrentActiveDocunmentChanged() {
  currentActiveGraph.value = null;
  currentActiveNode.value = null;
  currentActiveConnector.value = null;
}
/**
 * 激活图表更改事件
 */
function onActiveGraphEditorChange(docUid: string, graph: NodeGraph) {
  if (docUid === currentActiveDocunment.value?.uid) {
    currentActiveGraph.value = graph;
    currentActiveNode.value = null;
    currentActiveConnector.value = null;
  }
}
/**
 * 激活图表选择更改事件
 */
function onActiveGraphSelectionChange(docUid: string, graphUid: string, selectedNodes: NodeEditor[], selectedConnectors: NodeConnectorEditor[]) {
  if (docUid === currentActiveDocunment.value?.uid && graphUid === currentActiveGraph.value?.uid) {
    currentActiveNode.value = selectedNodes.length > 0 ? selectedNodes[0] : null;
    currentActiveConnector.value = selectedConnectors.length > 0 ? selectedConnectors[0] : null;
  }
}



/**
 * 新文档
 */
function newDocunment() {
  const doc = new NodeDocunmentEditor({
    name: '新文档',
    version: '1.0',
    description: '新文档',
    author: '',
  });
  doc.load();
  doc.initNew();
  openDocunment(doc);
  return doc;
}
/**
 * 关闭已打开文档
 * @param uid 
 */
function closeDocunment(uid: string) {
  const doc = opendDocunment.value.get(uid)
  if (!doc)
    return;
  opendDocunment.value.delete(uid);
  dockLayout.value?.removePanel(`NodeEditor${uid}`);
  if (currentActiveDocunment.value === doc) {
    currentActiveDocunment.value = opendDocunment.value.values().next().value;
    onCurrentActiveDocunmentChanged();
  }
}
/**
 * 打开文档
 * @param doc 
 */
function openDocunment(doc: NodeDocunmentEditor) {
  if (opendDocunment.value.has(doc.uid))
    return;
  
  //添加文档至界面
  opendDocunment.value.set(doc.uid, doc);
  currentActiveDocunment.value = doc;
  onCurrentActiveDocunmentChanged();
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

//#endregion

function onActiveTabChange(currentActive: DockPanel) {
  if (currentActive.key.startsWith('NodeEditor')) {
    const doc = getDocunmentByUid(currentActive.key.substring(10));
    if (doc) {
      currentActiveDocunment.value = doc;
      onCurrentActiveDocunmentChanged();
    }
  }
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
              tabStyle: { marginLeft: '40px' },
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

const context = reactive({
  newDocunment,
  closeDocunment,
  openDocunment,
  getCurrentActiveGraphEditor,
  getDocunmentByUid,
} as NodeIdeControlContext);

provide('NodeIdeControlContext', context);

defineExpose({
  getContext() { return context },
})
</script>

<style lang="scss">
@import './NodeIde.scss';
</style>