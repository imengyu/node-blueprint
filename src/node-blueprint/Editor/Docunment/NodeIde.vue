<template>
  <CodeLayout
    ref="codeLayout"
    :layout-config="config"
    :main-menu-config="menuData"
  >
    <template #centerArea>
      <SplitLayout
        ref="splitLayout"
        @panelClose="onPanelClose"
        @panelActive="onActiveTabChange"
      >
        <template #tabContentRender="{ panel }">
          <template v-if="panel.name.startsWith('NodeEditor')">
            <NodeDocunmentEditorComponent
              :docunment="(panel.data as NodeDocunmentEditor)"
              :editorSettings="editorSettings"
              @activeGraphEditorChange="(g: NodeGraph) => onActiveGraphEditorChange((panel.data as NodeDocunmentEditor), g)"
              @activeGraphSelectionChange="(p1, p2, p3) => onActiveGraphSelectionChange((panel.data as NodeDocunmentEditor), p1, p2, p3)"
            />
          </template>
          <template v-else>
            <h2 :style="{ margin: 0 }">Grid {{ panel.name }}</h2>
          </template>
        </template>
        <template #tabEmptyContentRender="{ grid }">
          <h2 :style="{ margin: 0 }">Empty Grid {{ grid.name }} {{ grid.direction }}</h2>
        </template>
        <template #tabHeaderExtraRender>
          <IconButton fillHeight @click="newDocunment()">
            <Icon icon="icon-add-bold" fill="var(--tab-text-color)" />
          </IconButton>
        </template>
      </SplitLayout>
    </template>
    <template #titleBarIcon>
      <img class="node-menu-logo" src="../Images/Logo/logo-huge-light.svg">
    </template>
    <template #panelRender="{ panel }">
      <template v-if="panel.name==='NodeProps'">
        <PropBox class="node-custom-editor">
          <NodeNodeProp v-if="currentActiveNodes.length > 0" :nodes="(currentActiveNodes as NodeEditor[])" />
          <PropItem v-else>
            在图表选中单元来编辑其属性
          </PropItem>
          <NodeConnectorProp v-if="currentActiveConnectors.length > 0" :connectors="(currentActiveConnectors as NodeConnectorEditor[])" />
        </PropBox>
      </template>
      <template v-else-if="panel.name==='GraphProps'">
        <PropBox class="node-custom-editor">
          <NodeGraphProp v-if="currentActiveGraph" :graph="(currentActiveGraph as NodeGraph)" />
          <NodeDocunmentProp v-if="currentActiveDocunment" :doc="(currentActiveDocunment as NodeDocunment)" />
        </PropBox>
      </template>
      <template v-else-if="panel.name==='GraphVariableProps'">
        <PropBox class="node-custom-editor" noSearch>
          <NodeGraphVariableProp v-if="currentActiveGraph" :graph="(currentActiveGraph as NodeGraph)" />
        </PropBox>
      </template>
      <template v-else-if="panel.name==='GraphChildrenProps'">
        <PropBox class="node-custom-editor" noSearch>
          <NodeGraphChildrenProp v-if="currentActiveDocunment?.mainGraph" :activeGraph="(currentActiveGraph as NodeGraph)" :graph="(currentActiveDocunment.mainGraph as NodeGraph)" />
        </PropBox>
      </template>
      <template v-else-if="panel.name==='Console'">
        <Console :panel="panel" />
      </template>
    </template>
  </CodeLayout>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, provide, h } from 'vue';
import NodeDocunmentEditorComponent from './NodeDocunmentEditor.vue';
import NodeDocunmentProp from './Prop/NodeDocunmentProp.vue';
import NodeConnectorProp from './Prop/NodeConnectorProp.vue';
import NodeGraphProp from './Prop/NodeGraphProp.vue';
import NodeGraphVariableProp from './Prop/NodeGraphVariableProp.vue';
import NodeGraphChildrenProp from './Prop/NodeGraphChildrenProp.vue';
import NodeNodeProp from './Prop/NodeNodeProp.vue';
import PropBox from '../Components/PropControl/Common/PropBox.vue';
import Console from '../Console/Console.vue';
import SettingsUtils from '@/node-blueprint/Base/Utils/SettingsUtils';
import { CodeLayout, SplitLayout, defaultCodeLayoutConfig } from 'vue-code-layout';
import { NodeDocunmentEditor } from '../Graph/Flow/NodeDocunmentEditor';
import { openJsonFile, saveJsonFile } from './Tools/IOUtils';
import type { MenuOptions } from '@imengyu/vue3-context-menu';
import type { CodeLayoutInstance, CodeLayoutConfig, CodeLayoutPanelInternal, CodeLayoutSplitNInstance } from 'vue-code-layout';
import type { INodeGraphEditorSettings } from '../Graph/NodeGraphEditor';
import type { NodeDocunment } from '@/node-blueprint/Base/Flow/Graph/NodeDocunment';
import type { NodeIdeControlContext } from './NodeIde';
import type { NodeDocunmentEditorContext } from './NodeDocunmentEditor';
import type { NodeGraph } from '@/node-blueprint/Base/Flow/Graph/NodeGraph';
import type { NodeEditor } from '../Graph/Flow/NodeEditor';
import type { NodeConnectorEditor } from '../Graph/Flow/NodeConnectorEditor';
import type { IObject } from '@/node-blueprint/Base/Utils/BaseTypes';
import Alert from '../Nana/Modal/Alert';
import Icon from '../Nana/Icon.vue';
import IconButton from '../Nana/Button/IconButton.vue';
import DefaultLayoutData from './Data/DefaultLayoutData.json';
import PropItem from '../Components/PropList/PropItem.vue';

import TestScript from '../../../../test-scripts/compiler-test-1.json';
const loadTestScript = true;


const splitLayout = ref<CodeLayoutSplitNInstance>();
const codeLayout = ref<CodeLayoutInstance>();
const config = ref<CodeLayoutConfig>({
  ...defaultCodeLayoutConfig,
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
  panelHeaderHeight: 24,
  panelMinHeight: 150,
  titleBar: true,
  titleBarShowCustomizeLayout: true,
  activityBar: true,
  primarySideBar: true,
  secondarySideBar: true,
  bottomPanel: true,
  statusBar: true,
  menuBar: true,
});

const props = defineProps({
  modalTeleport: {
    type: String,
    default: '#app',
  },
});

provide('NodeGraphUIModalTeleport', props.modalTeleport);

//#region 设置

const editorSettings = ref<INodeGraphEditorSettings>({
  drawDebugInfo: false,
  drawGrid: true,
  snapGrid: true,
});

function loadSettings() {
  editorSettings.value = SettingsUtils.getSettings('NodeIdeEditorSettings', editorSettings.value);
  config.value = SettingsUtils.getSettings('NodeIdeEditorCodeLayoutSettings', config.value);
}
function saveSettings() {
  saveLayout();
  SettingsUtils.setSettings('NodeIdeEditorSettings', editorSettings.value as IObject);
  SettingsUtils.setSettings('NodeIdeEditorCodeLayoutSettings', config.value as IObject);
}

onBeforeUnmount(saveSettings)
window.addEventListener('beforeunload', saveSettings);

//#endregion

//#region 菜单管理

const menuData = reactive<MenuOptions>({
  x: 0,
  y: 0,
  items: [
    {
      label: '文件',
      children: [
        {
          label: '新建',
          shortcut: 'Ctrl+N',
          onClick: newDocunment,
        },
        {
          label: '打开',
          shortcut: 'Ctrl+O',
          divided: true,
          onClick: loadDocunment,
        },
        {
          label: '保存',
          shortcut: 'Ctrl+S',
          onClick: saveDocunment,
        },
        {
          label: '导出',
          shortcut: 'Ctrl+E',
          divided: true,
          onClick: saveDocunment,
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
          checked: editorSettings.value.drawGrid,
          onClick() {
            editorSettings.value.drawGrid = !editorSettings.value.drawGrid;
            this.checked = editorSettings.value.drawGrid;
          },
        },
        {
          label: '吸附网格',
          divided: true,
          checked: editorSettings.value.snapGrid,
          onClick() {
            editorSettings.value.snapGrid = !editorSettings.value.snapGrid;
            this.checked = editorSettings.value.snapGrid;
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
          checked: editorSettings.value.drawDebugInfo,
          onClick() {
            editorSettings.value.drawDebugInfo = !editorSettings.value.drawDebugInfo;
            this.checked = editorSettings.value.drawDebugInfo;
          },
        },
        {
          label: '重置界面布局',
          onClick() {
            resetDefultLayout();
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
const currentActiveNodes = ref<NodeEditor[]>([]);
const currentActiveConnectors = ref<NodeConnectorEditor[]>([]);

/**
 * 获取激活的文档编辑器
 */
function getCurrentActiveDocunmentEditor() : NodeDocunmentEditorContext|undefined {
  return currentActiveDocunment.value?.activeEditor ?? undefined;
}
/**
 * 获取当前打开的编辑器
 */
function getCurrentActiveGraphEditor() {
  return currentActiveDocunment.value?.activeEditor?.getActiveGraph()?.activeEditor || null;
}
/**
 * 获取其他打开的编辑器
 */
function getOtherGraphEditor() {
  return currentActiveDocunment.value?.activeEditor?.getOtherGraphs()?.map(g => g.activeEditor) || null;
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
  currentActiveNodes.value = [];
  currentActiveConnectors.value = [];
}
/**
 * 激活图表更改事件
 */
function onActiveGraphEditorChange(doc: NodeDocunmentEditor, graph: NodeGraph) {
  if (doc.uid === currentActiveDocunment.value?.uid) {
    currentActiveGraph.value = graph;
    currentActiveNodes.value = [];
    currentActiveConnectors.value = [];
  }
}
/**
 * 激活图表选择更改事件
 */
function onActiveGraphSelectionChange(doc: NodeDocunmentEditor, graphUid: string, selectedNodes: NodeEditor[], selectedConnectors: NodeConnectorEditor[]) {
  if (doc.uid === currentActiveDocunment.value?.uid && graphUid === currentActiveGraph.value?.uid) {
    currentActiveNodes.value = selectedNodes;
    currentActiveConnectors.value = selectedConnectors;
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
function closeDocunment(uid: string, force = false) {
  const doc = opendDocunment.value.get(uid)
  if (!doc)
    return;
  if (force)
    opendDocunment.value.delete(uid);
  else
    splitLayout.value?.getPanelByName(`NodeEditor${uid}`)?.closePanel();
}
/**
 * 关闭全部文档
 */
function closeAllDocunment() {
  const openedUids = Array.from(opendDocunment.value.values()).map(p => p.uid);
  for (const uid of openedUids)
    closeDocunment(uid, true);
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

  splitLayout.value?.getActiveGird()?.addPanel({
    name: `NodeEditor${doc.uid}`,
    title: doc.name,
    closeType: 'close',
    data: doc,
  });
  splitLayout.value?.activePanel(`NodeEditor${doc.uid}`);
}
/**
 * 加载文档
 */
function loadDocunment() {
  openJsonFile((content) => {
    let json = {};
    try {
      json = JSON.parse(content);
    } catch {
      Alert.error({ content: '加载文档失败，无效的文件' });
      return;
    }

    const doc = new NodeDocunmentEditor();
    doc.load(json);

    openDocunment(doc);
  })
}
/**
 * 保存文档
 */
function saveDocunment() {
  const doc = currentActiveDocunment.value;
  if (doc)
    saveJsonFile(doc.name, doc.save());
}

//#endregion

//#region 界面布局

function initLayout() {
  nextTick(() => {
    if (!codeLayout.value)
      return;

    const layoutData = SettingsUtils.getSettings<any>('NodeIdeEditorLayout', null) || DefaultLayoutData;
    codeLayout.value.loadLayout(layoutData, (panel) => {
      switch (panel.name) {
        case 'Console':
          panel.title = '控制台';
          panel.iconSmall = () => h(Icon, { icon: 'icon-develop' });
          break;
        case 'NodeProps':
          panel.title = '单元属性';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-cube' });
          break;
        case 'GraphProps':
          panel.title = '图表属性';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-vector' });
          break;
        case 'GraphVariableChildrenGroup':
          panel.title = '图表变量和图表树';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-shapes-' });
          break;
        case 'GraphVariableProps':
          panel.title = '图表变量';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-shapes-' });
          break;
        case 'GraphChildrenProps':
          panel.title = '图表树';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-shapes-2' });
          break;
      }
      return panel;
    });
    
  });
}
function resetDefultLayout() {
  SettingsUtils.setSettings('NodeIdeEditorLayout', null);
  codeLayout.value?.clearLayout();
  initLayout();
}
function saveLayout() {
  SettingsUtils.setSettings('NodeIdeEditorLayout', codeLayout.value?.saveLayout() || null);
}

//#endregion

function onPanelClose(panel: CodeLayoutPanelInternal, resolve: () => void) {
  if (panel.name.startsWith('NodeEditor'))  {
    const editor = (panel.data as NodeDocunmentEditor);
    opendDocunment.value.delete(editor.uid);
    if (currentActiveDocunment.value?.uid === editor.uid) {
      currentActiveDocunment.value = opendDocunment.value.values().next().value;
      onCurrentActiveDocunmentChanged();
    }
  }
  resolve();
}
function onActiveTabChange(currentActive: CodeLayoutPanelInternal) {
  if (!currentActive)
    return;
  if (currentActive.name.startsWith('NodeEditor')) {
    const doc = currentActive.data as NodeDocunmentEditor;
    if (doc) {
      currentActiveDocunment.value = doc;
      currentActiveGraph.value = doc.activeEditor?.getActiveGraph() || null;
      onCurrentActiveDocunmentChanged();
    }
  }
}

onMounted(() => {
  initLayout();
  loadSettings();
  nextTick(() => {
    if (!loadTestScript) {
      newDocunment();
    } else {
      const doc = new NodeDocunmentEditor();
      doc.load(TestScript as any);
      openDocunment(doc);
    }
  });
});
onBeforeUnmount(() => {
  saveLayout();
  closeAllDocunment();
});

const context = reactive({
  newDocunment,
  closeDocunment,
  openDocunment,
  getCurrentActiveGraphEditor,
  getOtherGraphEditor,
  getDocunmentByUid,
  getCurrentActiveDocunmentEditor,
} as NodeIdeControlContext);

provide('NodeIdeControlContext', context);

defineExpose({
  getContext() { return context },
})
</script>

<style lang="scss">
@import './NodeIde.scss';
</style>