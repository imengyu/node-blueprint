<template>
  <CodeLayout
    ref="codeLayout"
    :layoutConfig="config"
    :mainMenuConfig="(menuData as MenuOptions)"
    @canLoadLayout="initLayout"
    @canSaveLayout="saveLayout"
  >
    <template #centerArea>
      <SplitLayout
        ref="splitLayout"
        @panelClose="onPanelClose"
        @panelActive="onActiveTabChange"
      >
        <template #tabContentRender="{ panel }">
          <NodeDocunmentEditorComponent
            v-if="panel.name.startsWith('NodeEditor')"
            :docunment="(panel.data as NodeDocunmentEditor)"
            :editorSettings="editorSettings"
            :debugController="debugController"
            @activeGraphEditorChange="(g: NodeGraph) => onActiveGraphEditorChange((panel.data as NodeDocunmentEditor), g)"
            @activeGraphSelectionChange="(p1, p2, p3) => onActiveGraphSelectionChange((panel.data as NodeDocunmentEditor), p1, p2, p3)"
            @compileDoc="() => onCompileDocunment((panel.data as NodeDocunmentEditor))"
          />
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
            <ConsoleItem 
              v-if="debugController.debugging"
              level="warning"
              content="现在正在调试，您对文档做出的修改会在下次调试生效"
            />
          <NodeNodeProp 
            v-if="currentActiveNodes.length > 0"
            :nodes="(currentActiveNodes as NodeEditor[])"
            :context="(currentActiveGraph?.activeEditor as NodeGraphEditorContext)"
          />
          <PropItem v-else>
            在图表选中单元来编辑其属性
          </PropItem>
          <NodeConnectorProp v-if="currentActiveConnectors.length > 0" :connectors="(currentActiveConnectors as NodeConnectorEditor[])" />
        </PropBox>
      </template>
      <template v-else-if="panel.name==='GraphProps'">
        <PropBox class="node-custom-editor">
          <ConsoleItem 
            v-if="debugController.debugging"
            level="warning"
            content="现在正在调试，您对文档做出的修改会在下次调试生效"
          />
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
      <template v-else-if="panel.name==='DebugBreakPoints'">
        <DebugBreakPoints :panel="panel" :debugController="debugController" />
      </template>
      <template v-else-if="panel.name==='DebugStacks'">
        <DebugStacks :panel="panel" :debugController="debugController" />
      </template>
      <template v-else-if="panel.name==='DebugVariables'">
        <DebugVariables :panel="panel" :debugController="debugController" />
      </template>
    </template>
  </CodeLayout>
</template>

<script setup lang="ts">
import { nextTick, onBeforeUnmount, onMounted, reactive, ref, provide, h, type Ref } from 'vue';
import NodeDocunmentEditorComponent from './NodeDocunmentEditor.vue';
import NodeDocunmentProp from './Prop/NodeDocunmentProp.vue';
import NodeConnectorProp from './Prop/NodeConnectorProp.vue';
import NodeGraphProp from './Prop/NodeGraphProp.vue';
import NodeGraphVariableProp from './Prop/NodeGraphVariableProp.vue';
import NodeGraphChildrenProp from './Prop/NodeGraphChildrenProp.vue';
import NodeNodeProp from './Prop/NodeNodeProp.vue';
import PropBox from '../Components/PropControl/Common/PropBox.vue';
import Console from '../Console/Console.vue';
import DebugBreakPoints from './Debug/DebugBreakPoints.vue';
import DebugStacks from './Debug/DebugStacks.vue';
import DebugVariables from './Debug/DebugVariables.vue';
import SettingsUtils from '@/node-blueprint/Base/Utils/SettingsUtils';
import { NodeDocunmentEditor } from '../Graph/Flow/NodeDocunmentEditor';
import { openJsonFile, saveJsFile, saveJsonFile } from './Tools/IOUtils';
import { CodeLayout, SplitLayout, defaultCodeLayoutConfig } from 'vue-code-layout';
import type { CodeLayoutInstance, CodeLayoutConfig, CodeLayoutPanelInternal, CodeLayoutSplitNInstance } from 'vue-code-layout';
import type { MenuOptions } from '@imengyu/vue3-context-menu';
import type { INodeGraphEditorSettings, NodeGraphEditorContext } from '../Graph/NodeGraphEditor';
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

import TestScript from '../../../../test-scripts/compiler-test-2.json';
import { NodeGraphCompiler } from '@/node-blueprint/Base/Compiler/NodeGraphCompiler';
import { printError } from '@/node-blueprint/Base/Logger/DevLog';
import { useEditorDebugController } from './Editor/EditorDebugController';
import ConsoleItem from '../Console/ConsoleItem.vue';
import type { NodePortEditor } from '../Graph/Flow/NodePortEditor';

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
    default: 'body',
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

function wrapperAsyncFunction(prom : Promise<any>, message = '') {
  const loading = Alert.loading('加载中');
  prom.then(() => {
    loading.close();
  }).catch((e) => {
    loading.close();
    Alert.error({ content: message + ' ' + e });
  }) 
}

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
          onClick: () => wrapperAsyncFunction(newDocunment()),
        },
        {
          label: '打开',
          shortcut: 'Ctrl+O',
          divided: true,
          onClick: () => wrapperAsyncFunction(loadDocunment()),
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
          label: '编译',
          children: [
            {
              label: '编译',
              shortcut: 'F4',
              onClick() {
                if (currentActiveDocunment.value)
                  onCompileDocunment(currentActiveDocunment.value as NodeDocunment);
              },
            },
            {
              label: '编译并导出',
              onClick() {
                if (currentActiveDocunment.value)
                  onCompileDocunment(currentActiveDocunment.value as NodeDocunment, true);
              },
            },
          ],
          divided: true,
        },
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
const currentActiveNodes = ref<NodeEditor[]>([]) as Ref<NodeEditor[]>;
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
 * 编译按钮
 */
function onCompileDocunment(doc: NodeDocunmentEditor, exportFile = false) {
  try {
    const result = NodeGraphCompiler.getInstance().getCompiler('js').compileDocunment(doc, !exportFile);
    if (exportFile) {
      saveJsFile(`${doc.name}.js`, result);
    } else {
      console.log(result);
    }
  } catch (e) {
    console.log(e instanceof Error ? e.stack : e);
    printError('CompileDocunment', e)
  }
}
/**
 * 快速跳转到编辑器的指定位置
 * @param doc 文档
 * @param graph 图表
 * @param node 节点
 * @param port 端口
 */
async function jumpToDocunment(doc: NodeDocunmentEditor, graph?: NodeGraph, node?: NodeEditor, port?: string|NodePortEditor, showPositionIndicator = false) {
  if (!doc.activeEditor)
    await openDocunment(doc);
  if (graph) {
    await doc.activeEditor?.switchActiveGraph(graph);
    if (node) {
      if (typeof port === 'string') 
        port = node.getPortByGUID(port) as NodePortEditor;
      if (graph.activeEditor?.moveViewportToNode(port ?? node, showPositionIndicator)) 
        node.twinkle();
    }
  }
}
/**
 * 新文档
 */
async function newDocunment() {
  const doc = new NodeDocunmentEditor({
    name: '新文档',
    version: '1.0',
    description: '新文档',
    author: '',
  });
  doc.load();
  doc.initNew();
  return await openDocunment(doc);
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
  if (splitLayout.value)
    splitLayout.value.clearLayout();
}
/**
 * 打开文档
 * @param doc 
 */
async function openDocunment(doc: NodeDocunmentEditor) { 
  if (opendDocunment.value.has(doc.uid)) 
    return doc;
  
  //添加文档至界面
  opendDocunment.value.set(doc.uid, doc);
  currentActiveDocunment.value = doc;

  //加载文档
  debugController.loadDocunment(doc);

  if (splitLayout.value) {
    splitLayout.value.getActiveGird()?.addPanel({
      name: `NodeEditor${doc.uid}`,
      title: doc.name,
      closeType: 'close',
      data: doc,
    });
    splitLayout.value.activePanel(`NodeEditor${doc.uid}`);
  }

  onCurrentActiveDocunmentChanged();
  await doc.waitReady();

  return doc;
}
/**
 * 加载文档
 */
async function loadDocunment() {
  let content = '';
  try {
    content = await openJsonFile();
  } catch {
    return;
  }

  const json = JSON.parse(content);
  const doc = new NodeDocunmentEditor();
  doc.load(json);

  await openDocunment(doc);
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
        case 'DebugVariables':
          panel.title = '堆栈变量';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-coins' });
          break;
        case 'DebugStacks':
          panel.title = '调用栈';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-cards' });
          break;
        case 'DebugBreakPoints':
          panel.title = '断点';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-breakpoint-active' });
          break;
        case 'DebugGroup':
          panel.title = '调试器';
          panel.tooltip = panel.title;
          panel.tabStyle = 'single';
          panel.iconSmall = () => h(Icon, { icon: 'icon-bug-fill' });
          panel.iconLarge = () => h(Icon, { icon: 'icon-bug-fill', size: 20 });
          break;
        case 'ExplorerGroup':
          panel.title = '资源管理器';
          panel.tooltip = panel.title;
          panel.iconSmall = () => h(Icon, { icon: 'icon-folder-close' });
          panel.iconLarge = () => h(Icon, { icon: 'icon-folder-close', size: 20 });
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

//#region 面板事件

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

//#endregion 

//#region 加载与卸载

onMounted(() => {
  loadSettings(); 
  nextTick(() => {
    if (!loadTestScript) {
      newDocunment();
    } else {
      const doc = new NodeDocunmentEditor();
      doc.load(TestScript as any);
      openDocunment(doc); 
    }
  })
});
onBeforeUnmount(() => {
  closeAllDocunment();
});

//#endregion 

//#region 上下文

const context = reactive({
  newDocunment,
  closeDocunment,
  openDocunment,
  getCurrentActiveGraphEditor,
  getOtherGraphEditor,
  getDocunmentByUid,
  getCurrentActiveDocunmentEditor,
  jumpToDocunment,
  focusDebuggerPanel() { codeLayout.value?.getPanelByName('DebugStacks')?.activeSelf(); },
} as NodeIdeControlContext);

provide('NodeIdeControlContext', context);

//#endregion 

//#region 调试控制器

const debugController = useEditorDebugController(context);

provide('NodeIdeDebugController', debugController);

//#endregion

defineExpose({
  getContext() { return context },
})
</script>

<style lang="scss">
@import './NodeIde.scss';
</style>