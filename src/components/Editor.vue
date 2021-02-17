<template>
  <div class="window" oncontextmenu="return false">
    <!--进入遮罩-->
    <div :class="'editor-intro'+(showIntro?' show':'')" v-show="showIntroE">
      <h1>Easy blueprint</h1>
      <div>简单可视化脚本蓝图编辑器</div>
    </div>
    <!--菜单栏-->
    <MenuBar :menus="menuMain" class="window-title-bar">
      <div class="editor-file-tab" style="margin-left:18px">
        <GraphBreadcrumb v-for="doc in openedDocunments" :key="doc.uid"
          :ref="'BlockTab_' + doc.uid"
          :currentDocunment="doc" 
          :currentGraph="doc.currentGraph"
          :class="'editor-file-tab-item' + (doc == currentDocunment?' active':'')"
          @click="goDoc(doc)"
          @on-go-doc="onGoDoc"
          @on-close="onCloseGraph"
          @on-go-graph="goGraph">
        </GraphBreadcrumb>
      </div>
      <template slot="icon">
        <div class="editor-icon" >
          <img src="../assets/images/logo.png" />
        </div>
      </template>
      <template v-if="showControlButtons" slot="end">
        <div class="window-controls-container">
          <div class="window-icon-bg" @click="windowControl('min')" title="最小化">
            <div class="window-icon window-minimize"></div>
          </div>
          <div v-if="windowIsMax" class="window-icon-bg window-icon-unmaximize" @click="windowControl('restore')" title="还原">
            <div class="window-icon window-max-restore window-unmaximize"></div>
          </div>
          <div v-else class="window-icon-bg window-icon-maximize" @click="windowControl('max')" title="最大化">
            <div class="window-icon window-max-restore window-maximize"></div>
          </div>
          <div class="window-icon-bg window-close-bg" @click="windowControl('close')" title="关闭">
            <div class="window-icon window-close"></div>
          </div>
        </div>
      </template>
    </MenuBar>
    <!--工具栏-->
    <div class="editor-toolbar">

      <div :class="'tool-item button icon'+(mouseLeftMove?'':' active')" title="鼠标用来选择组件" @click="mouseLeftMove=false"><i class="iconfont icon-yidong_huaban1"></i></div>
      <div :class="'tool-item button icon'+(mouseLeftMove?' active':'')" title="鼠标用来移动视图" @click="mouseLeftMove=true"><i class="iconfont icon-shou"></i></div>
      
      <div class="separator"></div>

      <div v-show="currentDocunment" >
        
        <div class="tool-item button icon" title="添加单元" @click="showAddBlockPanelBar($event.currentTarget)"><i class="iconfont icon-pluss-2"></i></div>
        <div class="tool-item button icon" title="删除选中" :disabled="!isSelectedBlock" @click="showDeleteModalClick()"><i class="iconfont icon-trash"></i></div>

        <div class="separator"></div>

        <div v-if="runningState=='editing'||runningState=='runningPaused'" class="tool-item button icon green" 
          :title="runningState=='runningPaused'?'继续运行':'开始调试'" @click="startRun">
          <i class="iconfont icon-play"></i>
        </div>
        <div v-if="runningState=='editing'" class="tool-item button icon blue" title="开始单步调试" @click="startRunAndStepNext">
          <i class="iconfont icon-play-next"></i>
        </div>
        <div v-if="runningState=='runningPaused'" class="tool-item button icon green" title="运行下一步" @click="stepNext">
          <i class="iconfont icon-play-next"></i>
        </div>
        <div v-if="runningState=='running'" class="tool-item button icon yellow" title="暂停调试" @click="pauseRun">
          <i class="iconfont icon-pause"></i>
        </div>
        <div v-if="runningState=='running'||runningState=='runningPaused'" class="tool-item button icon red" title="停止调试" @click="stopRun">
          <i class="iconfont icon-close-2"></i>
        </div>

        <div class="separator"></div>

      </div>

      <div class="tool-item button icon" title="打开控制台" @click="openConsole"><i class="iconfont icon-terminal"></i></div>
    
    </div>
    <!--添加单元弹出窗口-->
    <AddPanel v-show="showAddBlockPanel" 
      ref="AddBlockPanel"
      :show="showAddBlockPanel"
      :allBlocksGrouped="allBlocksGrouped" 
      :showPos="showAddBlockPanelPos"
      :style="{ maxHeight: showAddBlockPanelMaxHeight + 'px' }"
      :isAddDirectly="addBlockPanelAddDirectly"
      :filterByPortDirection="filterByPortDirection"
      :filterByPortType="filterByPortType" 
      :filterByPortKeyType="filterByPortKeyType" 
      :filterSrcPort="filterSrcPort" 
      :filterByPortCustomType="filterByPortCustomType" 
      @onBlockItemClick="onBlockAddItemClick"
      @onClose="showAddBlockPanel=false" />
    <!--添加单元弹出窗口-->
    <ChooseTypePanel
      ref="ChooseTypePanel"
      :show="showChooseTypePanel"
      :showPos="showChooseTypePanelPos"
      :canbeExecute="showChooseTypePanelCanbeExecute"
      :style="{ maxHeight: showChooseTypePanelMaxHeight + 'px' }"
      @onItemClick="onChooseTypeItemClick"
      @onClose="showChooseTypePanel=false" />
    
    <!--主编辑器-->
    <div v-for="doc in openedDocunments" :key="doc.uid" v-show="doc==currentDocunment" class="editor-main">
      <Split v-model="splitOff">
        <!--流图编辑器-->
        <BlockDrawer slot="left" :ref="'BlockDrawer_'+doc.uid"
          :runner="runner"
          :settings="settings"
          :mouseLeftMove="mouseLeftMove"
          :docunment="doc"
          @update-select-state="updateSelectState"
          @update-add-block-panel-filter="updateAddBlockPanelFilter"
          @show-add-block-panel-at-pos="showAddBlockPanelAt"
          @clear-add-block-panel-filter="clearAddBlockPanelFilter"
          @update-clipboard-state="(v) => isClipboardFilled = v"
          @update-multi-selecting="(v) => isMultiSelecting = v"
          @update-block-owner-data="(d) => blockOwnerData = d"
          @choose-custom-type="onChooseCustomType"
          @on-show-input-right-menu="showInputRightMenu"
          @on-want-save="saveDoc(doc)"
          @on-open-graph="goGraph"
          @on-created="onDocEditorCreated"
          @on-destroyed="onDocEditorDestroyed"
        ></BlockDrawer>

        <!--属性栏-->
        <div slot="right" class="prop">
          <Split v-model="split2" mode="vertical">
            <div slot="top" class="prop-host">
              <BlockProp v-if="!isMultiSelecting && selectedBlock" :block="selectedBlock"></BlockProp>
              <ConnectorProp v-else-if="!isMultiSelecting && selectedConnector" :connector="selectedConnector"></ConnectorProp>
            </div>
            <div slot="bottom" class="prop-host">
              <DocunmentProp v-if="doc && doc.currentGraph == doc.mainGraph" 
                :doc="doc"
                :blockOwnerData="blockOwnerData"
                @on-open-graph="goGraph"
                @on-delete-graph="onDeleteGraph"
                @choose-graph-variable-type="onChooseGraphVariableType"

              ></DocunmentProp>
              <GraphProp v-else-if="doc.currentGraph" 
                :graph="doc.currentGraph"
                :blockOwnerData="blockOwnerData"
                @on-open-graph="goGraph"
                @on-delete-graph="onDeleteGraph"
                @choose-graph-variable-type="onChooseGraphVariableType"

              ></GraphProp>
            </div>
          </Split>
        </div>
      </Split>
    </div>
    <div v-if="openedDocunments.length==0" class="editor-main">
      <div class="editor-blank-page">
        <div class="huge-button" @click="newFile">
          <img src="../assets/images/add-new.svg" />
          <span>新建流程图</span>
        </div>
        <div class="huge-button" @click="loadFile">
          <img src="../assets/images/open.svg" />
          <span>打开流程图</span>
        </div>
        <div class="huge-button">
          <ul>
            <li><small>最近打开文件</small></li>
            <li v-for="(item, li) in this.recentList" :key="li">
              <a href="javascript:;" :title="item" @click="doLoadFile(item)">{{ getPath(item) }}</a>
            </li>
          </ul>
        </div>
      </div>
    </div>

    <!--对话框-->
    <Modal v-model="showDropChangesModal" width="360">
      <p slot="header" style="color:#f60;text-align:center">
        <Icon type="ios-information-circle"></Icon>
        <span>文件保存提示</span>
      </p>
      <div style="text-align:center">
        你希望丢弃当前文档的更改吗？<br>
        注意，未保存的更改将丢失！
      </div>
      <div slot="footer">
        <Button size="large" @click="showDropChangesModal=false">取消</Button>
        <Button type="error" size="large" @click="dropChangesCallback();showDropChangesModal=false;">丢弃更改</Button>
      </div>
    </Modal>
    <!--打开文件Input-->
    <input ref="OpenFileInput" type="file" accept="application/x-javascript" style="visibility: hidden;eight:0" @change="onOpenFileInputChanged" />

  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { State } from 'vuex-class'
import { Block } from '../model/Define/Block'
import { Vector2 } from "../model/Vector2";
import { Rect } from "../model/Rect";
import { BlockRegData, BlockParameterTypeRegData, BlockParameterEnumRegData } from "../model/Define/BlockDef";
import { BlockPort } from "../model/Define/Port";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { BlockFileParser } from "../model/WorkProvider/BlockFileParser";

import CanvasUtils from "../utils/CanvasUtils";
import CommonUtils from "../utils/CommonUtils";
import BlockCategory from "../components/BlockCategory.vue";
import BlockProp from "../components/BlockProp.vue";
import AddPanel from "../components/AddPanel.vue";
import BlockServiceInstance from "../sevices/BlockService";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import DebugWorkProviderInstance from "../model/WorkProvider/DebugWorkProvider";
import SettingsServiceInstance from "../sevices/SettingsService";
import { BlockEditor } from "../model/Editor/BlockEditor";
import { BlockPortDirection } from "../model/Define/Port";
import { BlockRunner, BlockRunContextData } from "../model/WorkProvider/Runner";
import { BlockDocunment, BlockGraphDocunment } from "../model/Define/BlockDocunment";
import { EditorSettings } from "../model/Editor/EditorSettings";
import { MenuOptions, MenuItem, MenuData, MenuSeparator } from "../model/Menu";
import ConnectorProp from "../components/ConnectorProp.vue";
import BlockDrawer from "../components/BlockDrawer.vue";
import MenuBar from "../components/MenuBar.vue";
import GraphProp from "../components/GraphProp.vue";
import DocunmentProp from "../components/DocunmentProp.vue";
import ChooseTypePanel from "../components/ChooseTypePanel.vue";
import GraphBreadcrumb from "../components/GraphBreadcrumb.vue";
import { BlockParameterType } from "../model/Define/BlockParameterType";
import BlockRegister from "../model/Blocks/Utils/BlockRegister";
import HtmlUtils from "../utils/HtmlUtils";
import electron, { BrowserWindow, Rectangle, remote, shell } from "electron";
import fs from "fs";
import url from 'url'
import logger, { Logger } from "../utils/Logger";
import StringUtils from "../utils/StringUtils";

export class EditorShortCutKey {
  public key : string;
  public alt = false;
  public conntrol = false;
  public shift = false;
  public callback : Function;

  public constructor(key : string, callback : Function, alt = false, conntrol = false, shift = false) {
    this.key = key;
    this.callback = callback;
    this.alt = alt;
    this.conntrol = conntrol;
    this.shift = shift;
  }
}
export type EditorRunningState = 'editing'|'running'|'runningPaused';

@Component({
  components: {
    'BlockCategory': BlockCategory,
    'AddPanel': AddPanel,
    'MenuBar': MenuBar,
    'BlockProp': BlockProp,
    'ConnectorProp': ConnectorProp,
    'BlockDrawer': BlockDrawer,
    'GraphProp': GraphProp,
    'DocunmentProp': DocunmentProp,
    'ChooseTypePanel': ChooseTypePanel,
    'GraphBreadcrumb': GraphBreadcrumb,
  }
})
export default class Editor extends Vue {
  name = "App";

  mouseLeftMove = false;
  splitOff = 0.8;
  split2 = 0.28;

  showIntro = true;
  showIntroE = true;
  showControlButtons = false;

  //#region 主菜单

  menuMain : Array<MenuData> = [];
  menuItemStartRun : MenuData = null;
  menuItemStopRun : MenuData = null;
  menuItemStepNext : MenuData = null;
  menuItemStartRunAndStepNext : MenuData = null;
  menuItemCut : MenuData = null;
  menuItemCopy : MenuData = null;
  menuItemPatse : MenuData = null;
  menuItemDelete : MenuData = null;
  menuItemSave : MenuData = null;
  menuItemExportJson : MenuData = null;
  menuItemRecent : MenuData = null;

  @Watch('runningState')
  updateRunMenuStates() {
    this.menuItemStartRun.enable = this.runningState == 'editing' || this.runningState == 'runningPaused';
    this.menuItemStartRun.name = this.runningState == 'runningPaused' ? '继续运行' : '启动调试';
    this.menuItemStopRun.enable = this.runningState != 'editing';
    this.menuItemStepNext.enable = this.runningState != 'editing' && this.runner.stepMode;
    this.menuItemStartRunAndStepNext.enable = this.runningState == 'editing';
  }
  updateEditMenuState() {
    this.menuItemDelete.enable = this.isSelectedBlock;
    this.menuItemCut.enable = this.menuItemDelete.enable;
    this.menuItemCopy.enable = this.menuItemDelete.enable;
    this.menuItemPatse.enable = this.isClipboardFilled;
  }
  updateFileMenuState() {
    this.menuItemSave.enable = this.currentDocunment != null;
    this.menuItemExportJson.enable = this.currentDocunment != null;
  }

  initMenu() {
    this.menuItemStartRun = new MenuData('启动调试', () => this.startRun(), 'F5');
    this.menuItemStopRun = new MenuData('停止调试', () => this.stopRun(), 'Shift+F5', false, false);
    this.menuItemStepNext = new MenuData('单步调试', () => this.stepNext(), 'F10');
    this.menuItemStartRunAndStepNext = new MenuData('单步前进', () => this.startRunAndStepNext(), 'F10', false, false);

    this.menuItemCut = new MenuData('剪切', () => this.editorControlCurrent.clipboardCutSelect(), 'Ctrl+X');
    this.menuItemCopy = new MenuData('复制', () => this.editorControlCurrent.clipboardCopySelect(), 'Ctrl+C');
    this.menuItemPatse = new MenuData('粘贴', () => this.editorControlCurrent.clipboardPaste(), 'Ctrl+V');
    this.menuItemDelete = new MenuData('删除', () => this.showDeleteModalClick(), 'Delete');

    this.menuItemRecent = new MenuData('打开最近文件', [
      new MenuSeparator(),
      new MenuData('清除最近打开文件', () => { this.recentList.empty(); this.flushRecentList(); }),
    ]);

    this.menuItemSave = new MenuData('保存...', () => {
      this.saveDoc(this.currentDocunment)
    }, 'Ctrl+S', false, false);
    this.menuItemExportJson = new MenuData('导出JSON', () => this.saveJson(this.currentDocunment), '', false, false);

    this.menuMain = [
      new MenuData('文件', [
        new MenuData('新建文件', () => this.newFile()),
        new MenuData('打开...', () => this.loadFile()),
        this.menuItemRecent,
        new MenuSeparator(),
        this.menuItemSave,
        this.menuItemExportJson,
      ].concat(
        this.currentRuntimeType == 'electron' ? [
          new MenuSeparator(),
          new MenuData('退出', () => this.windowControl('close')),
        ] : []
      )),
      new MenuData('编辑', [
        new MenuData('撤销', () => this.undo(), 'Ctrl+Z'),
        new MenuData('重做', () => this.redo(), 'Ctrl+Y'),
        new MenuSeparator(),
        this.menuItemCut,
        this.menuItemCopy,
        this.menuItemPatse,
        this.menuItemDelete,
      ]),
      new MenuData('视图', [
        new MenuData('显示网格', (menu) => {
          menu.checked = this.settings.gridShow = !this.settings.gridShow;
        }, '', this.settings.gridShow, true),
        new MenuSeparator(),
        new MenuData('放大', () => this.editorControlCurrent.zoomIn()),
        new MenuData('100%', () => { this.editorControlCurrent.zoomUpdate(100) }),
        new MenuData('缩小', () => this.editorControlCurrent.zoomOut()),
        new MenuSeparator(),
        new MenuData('绘制调试信息', (menu) => {
          menu.checked = this.settings.drawDebugInfo = !this.settings.drawDebugInfo;
        }, '', this.settings.drawDebugInfo, true),
        new MenuData('切换开发者工具', () => {
          if(this.currentRuntimeType == 'electron')
            this.ipc.send('main-act-toggle-devtools');
        })
      ]),
      new MenuData('调试', [
        this.menuItemStartRun,
        this.menuItemStopRun,
        new MenuSeparator(),
        this.menuItemStepNext,
        this.menuItemStartRunAndStepNext,
        new MenuSeparator(),
        new MenuData('启用所有断点', () => this.disableAllBreakPoint(), ''),
        new MenuData('禁用所有断点', () => this.enableAllBreakPoint(), ''),
      ]),
      new MenuData('帮助', [
        new MenuData('使用文档', () => this.showHelp(), ''),
        new MenuData('关于', () => this.showAbout(), ''),
      ].concat(this.currentRuntimeType == 'electron' ? [
        new MenuSeparator(),
        new MenuData('切换开发者工具', () => this.currentWindow.webContents.toggleDevTools(), 'Ctrl+Shift+I'),
        new MenuData('强制重载页面', () => this.ipc.send('main-act-reload'), 'Ctrl+R'),
      ] : [])),
    ];

    window.addEventListener('contextmenu', (e) => {    
      if(HtmlUtils.isEleEditable(e.target)) {
        this.showInputRightMenu(new Vector2(e.x, e.y), <HTMLInputElement>e.target);
        e.preventDefault();
      }
    }, false);

    //添加键盘快捷键
    if(this.currentRuntimeType == 'electron') {
      this.keyShutCuts.addOnce(new EditorShortCutKey('KeyI', () => {
        this.currentWindow.webContents.toggleDevTools();
      }, false, true, true));
      this.keyShutCuts.addOnce(new EditorShortCutKey('KeyR', () => {
        this.ipc.send('main-act-reload');
      }, false, true, false));
    }
  }
  showDeleteModalClick() { this.editorControlCurrent.showDeleteModalClick() }
  showInputRightMenu(screenPos : Vector2, ele : HTMLInputElement ) {
    
    let selection = document.getSelection().toString();
    let menuItems = <MenuItem[]>[
      { label: "剪切", onClick: () => {ele.focus();document.execCommand('cut')}, disabled: StringUtils.isNullOrEmpty(selection) },
      { label: "复制", onClick: () => {ele.focus();document.execCommand('copy')}, disabled: StringUtils.isNullOrEmpty(selection) },
      { label: "粘贴", onClick: () => {ele.focus();document.execCommand('paste')}, divided: true },
      { label: "全选", onClick: () => {ele.focus();document.execCommand('seletcAll')}, },
      { label: "删除", onClick: () => {ele.focus();document.execCommand('delete')}, disabled: StringUtils.isNullOrEmpty(selection) },
    ];

    this.$contextmenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      customClass: 'menu-context',
    });
  }

  //键盘快捷键

  keyShutCuts : Array<EditorShortCutKey> = [];

  initShutCuts() {
    window.addEventListener('keypress', this.onWindowKey);
  }
  deleteShutCuts() {
    this.keyShutCuts.empty();
    window.removeEventListener('keypress', this.onWindowKey);
  }
  onWindowKey(e : KeyboardEvent) {
    for(let i = this.keyShutCuts.length - 1; i >= 0; i-- ) {
      let k = this.keyShutCuts[i];
      if(k.key == e.code 
        && e.altKey == k.alt && e.shiftKey == k.shift && e.ctrlKey == k.conntrol) 
        k.callback();
    }
  }

  //#endregion

  //公共方法

  public redo() { this.editorControlCurrent.redo(); }
  public undo() { this.editorControlCurrent.undo(); }

  blockOwnerData = null;

  //子模块状态信息
  isSelectedBlock = false;
  isClipboardFilled = false;
  isMultiSelecting = false;

  selectedBlock = null;
  selectedConnector = null;

  updateSelectState(s) {
    this.isSelectedBlock = s;
  
    if(!this.isMultiSelecting) {
      this.selectedBlock = this.editorControlCurrent.getOneSelectedBlock();
      this.selectedConnector = this.editorControlCurrent.getOneSelectedConnector();
    }else {
      this.selectedBlock = null;
      this.selectedConnector = null;
    }
  }

  //#region 添加单元菜单

  @Watch('showAddBlockPanel') 
  onShowAddBlockPanelChanged(newV) {
    if(!newV && this.editorControlCurrent.isConnectingToNew) 
      this.editorControlCurrent.endConnectToNew();
  }

  public allBlocksGrouped = [];

  onBlockAddItemClick(block : BlockRegData) {
    this.showAddBlockPanel = false;
    this.editorControlCurrent.userAddBlock(block);
  }

  //添加单元弹出

  showAddBlockPanelPos = new Vector2();
  showAddBlockPanel = false;
  showAddBlockPanelMaxHeight = 500;
  addBlockPanelAddDirectly = false;

  filterByPortDirection : BlockPortDirection = null;
  filterByPortType : BlockParameterType = null;
  filterByPortKeyType : BlockParameterType = null;
  filterSrcPort = null;
  filterByPortCustomType : string = '';

  updateAddBlockPanelFilter(filter) {
    this.filterByPortDirection = filter.filterByPortDirection;
    this.filterByPortType = filter.filterByPortType;
    this.filterByPortKeyType = filter.filterByPortKeyType;
    this.filterSrcPort = filter.filterSrcPort;
    this.filterByPortCustomType = filter.filterByPortCustomType;
    this.addBlockPanelDoFilter();
  }
  clearAddBlockPanelFilter() {
    this.filterByPortDirection = null;
    this.filterByPortType = null;
    this.filterByPortKeyType = null;
    this.filterSrcPort = null;
    this.filterByPortCustomType = null;
    (<AddPanel>this.$refs.AddBlockPanel).clearFilter();
  }
  addBlockPanelDoFilter() {
    setTimeout(() => (<AddPanel>this.$refs.AddBlockPanel).doFilter(), 150);
  }
  public showAddBlockPanelAt(editorControl : BlockDrawer, pos : Vector2, showAddDirectly = true) {
    this.showAddBlockPanelPos.Set(pos);
    this.showAddBlockPanel = true;
    this.showAddBlockPanelMaxHeight = editorControl.getViewPort().h - pos.y;
    this.addBlockPanelAddDirectly = showAddDirectly;
    if(this.showAddBlockPanelMaxHeight > 500) this.showAddBlockPanelMaxHeight = 500;
    else if(this.showAddBlockPanelMaxHeight < 222) {
      this.showAddBlockPanelPos.y -= 222 - this.showAddBlockPanelMaxHeight;
      this.showAddBlockPanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.AddBlockPanel).focus();
  }
  showAddBlockPanelBar(e : HTMLElement) {
    if(this.currentDocunment != null) {
      this.editorControlCurrent.setNoAddBlockInpos();
      this.clearAddBlockPanelFilter();

      if(this.showAddBlockPanel) this.showAddBlockPanel = false;
      else this.showAddBlockPanelAt(this.editorControlCurrent, new Vector2(
        e.offsetLeft + this.editorControlCurrent.toolBarWidth,
        e.offsetTop + this.editorControlCurrent.toolBarHeight + 3
      ), false);
    }
  }

  //#endregion

  //#region 选择数据类型菜单

  showChooseTypePanel = false;
  showChooseTypePanelPos = new Vector2();
  showChooseTypePanelMaxHeight = 500;
  showChooseTypePanelCanbeExecute = true;
  showChooseTypePanelCallback : (type: BlockParameterTypeRegData, isBaseType : boolean) => void = null;

  onChooseTypeItemClick(choosedType : BlockParameterTypeRegData, isBaseType : boolean) {
    if(typeof this.showChooseTypePanelCallback == 'function') {
      this.showChooseTypePanel = false;
      this.showChooseTypePanelCallback(choosedType, isBaseType);
    }
  }
  public showChooseTypePanelAt(editorControl : BlockDrawer, pos : Vector2, canbeExecute : boolean) {
    this.showChooseTypePanelPos.Set(pos);
    this.showChooseTypePanel = true;
    this.showChooseTypePanelCanbeExecute = canbeExecute;
    this.showChooseTypePanelMaxHeight = editorControl.getViewPort().h - pos.y;
    if(this.showChooseTypePanelPos.x + 300 > window.innerWidth)
      this.showChooseTypePanelPos.x -= this.showChooseTypePanelPos.x + 300 - window.innerWidth;
    if(this.showChooseTypePanelMaxHeight > 500) this.showChooseTypePanelMaxHeight = 500;
    else if(this.showChooseTypePanelMaxHeight < 222) {
      this.showChooseTypePanelPos.y -= 222 - this.showChooseTypePanelMaxHeight;
      this.showChooseTypePanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.ChooseTypePanel).focus();
  }

  onChooseCustomType(pos : Vector2, callback, canbeExecute : boolean) {
    this.showChooseTypePanelCallback = callback;
    this.showChooseTypePanelAt(this.editorControlCurrent, pos, canbeExecute);
  }
  onChooseGraphVariableType(v, pos : Vector2, canbeExecute : boolean) {
    this.showChooseTypePanelCallback = v;
    this.showChooseTypePanelAt(this.editorControlCurrent, pos, canbeExecute);
  }

  //#endregion

  //#region 设置加载与读取

  settings : EditorSettings = {
    gridShow: true,
    drawDebugInfo: false,
    propViewWidth1: 0.8,
    propViewWidth2: 0.28,
    lastIsMaxed: false,
    lastWindowWidth: 0,
    lastWindowHeight: 0,
  }

  private loadSettings() {
    this.settings.drawDebugInfo = SettingsServiceInstance.getSettingsBoolean('drawDebugInfo', false);
    this.settings.gridShow = SettingsServiceInstance.getSettingsBoolean('gridShow', true);
    this.settings.propViewWidth1 = SettingsServiceInstance.getSettingsNumber('propViewWidth1', this.settings.propViewWidth1);
    this.settings.propViewWidth2 = SettingsServiceInstance.getSettingsNumber('propViewWidth2', this.settings.propViewWidth2);
    this.settings.lastIsMaxed = SettingsServiceInstance.getSettingsBoolean('lastIsMaxed', this.settings.lastIsMaxed);
    this.settings.lastWindowWidth = SettingsServiceInstance.getSettingsNumber('lastWindowWidth', this.settings.lastWindowWidth);
    this.settings.lastWindowHeight = SettingsServiceInstance.getSettingsNumber('lastWindowHeight', this.settings.lastWindowHeight);

    this.splitOff = this.settings.propViewWidth1;
    this.split2 = this.settings.propViewWidth2;

    if(this.currentRuntimeType == 'electron') {
 
      let screenSize = remote.screen.getPrimaryDisplay().size;
      let targetWindowSize = { x: this.settings.lastWindowWidth, y: this.settings.lastWindowHeight };
      if(targetWindowSize.x > screenSize.width) targetWindowSize.x = screenSize.width;
      if(targetWindowSize.y > screenSize.height) targetWindowSize.y = screenSize.height;
      if(targetWindowSize.x < 710) targetWindowSize.x = 710;
      if(targetWindowSize.y < 500) targetWindowSize.y = 500;

      if(this.settings.lastIsMaxed) 
        this.currentWindow.maximize();
      this.currentWindow.setSize(targetWindowSize.x, targetWindowSize.y, false);
      this.windowIsMax = this.currentWindow.isMaximized();
    }
  }
  private saveSettings() {
    SettingsServiceInstance.setSettingsBoolean('drawDebugInfo', this.settings.drawDebugInfo);
    SettingsServiceInstance.setSettingsBoolean('gridShow', this.settings.gridShow);
    SettingsServiceInstance.setSettingsNumber('propViewWidth1', this.settings.propViewWidth1);
    SettingsServiceInstance.setSettingsNumber('propViewWidth2', this.settings.propViewWidth2);


    if(this.currentRuntimeType == 'electron') {
      let size = this.currentWindow.getSize();
      this.settings.lastIsMaxed = this.currentWindow.isMaximized();
      this.settings.lastWindowWidth = size[0];
      this.settings.lastWindowHeight = size[1];
      SettingsServiceInstance.setSettingsBoolean('lastIsMaxed', this.settings.lastIsMaxed);
      SettingsServiceInstance.setSettingsNumber('lastWindowWidth', this.settings.lastWindowWidth);
      SettingsServiceInstance.setSettingsNumber('lastWindowHeight', this.settings.lastWindowHeight);
    }
  }

  //#endregion

  //#region 最近文件

  private recentList : Array<string> = [];

  private loadRecentList() {
    if(this.currentRuntimeType == 'electron') {
      fs.readFile(this.currentAppPath + '/recent.json', {}, (err, data) => {
        if(data.length > 0) {
          let j = JSON.parse(data.toString());
          if(j) {
            this.recentList = j.recentList;
            this.recentList.forEach((s) => {
              this.menuItemRecent.childs.unshift(new MenuData(s, () => this.doLoadFile(s)))
            })
          }
        }

      });
    }
  }
  private saveRecentList() {
    fs.writeFileSync(this.currentAppPath + '/recent.json', JSON.stringify({
      recentList: this.recentList
    }))
  }    
  private addToRecentList(s) {
    if(!this.recentList.contains(s)) {
      if(this.recentList.length >= 9) 
        this.recentList.pop();
      this.recentList.unshift(s);
      this.menuItemRecent.childs.unshift(new MenuData(s, () => this.doLoadFile(s)))
      this.saveRecentList();
    }
  }
  private getPath(s) {
    return StringUtils.getFileName(s);
  }
  private flushRecentList() { 
    for(let i = this.menuItemRecent.childs.length - 3; i >= 0; i++) 
      this.menuItemRecent.childs.remove(i);
    this.recentList.forEach((l) => { 
      this.menuItemRecent.childs.unshift(new MenuData(l, () => this.doLoadFile(l)))
    });
  }

  //#endregion

  //#region 初始化
  
  private currentRuntimeType : 'web'|'electron' = 'web';

  private init() {  

    let baseLoading = document.getElementById('base-loading');
    if(baseLoading) HtmlUtils.hideElement(baseLoading);

    if(process.env.EDITOR_ENV == 'electron') {
      this.showControlButtons = true;
      this.currentRuntimeType = 'electron';
      this.initElectron();
      this.initElectronIPC();
      window.onbeforeunload = () => {
        this.saveSettings(); 
      };
    }else if(process.env.EDITOR_ENV == 'web') {
      this.currentRuntimeType = 'web';
      window.onbeforeunload = () => {
        this.saveSettings();
        return "确认离开当前页面吗？未保存的数据将会丢失";
      };
    }

    this.parser = new BlockFileParser();

    this.loadSettings();
    this.initMenu();
    this.initEditorRunner();
    this.initEditorWorkProvider();
    this.loadRecentList();
  
    BlockServiceInstance.init();
    BlockServiceInstance.setIsEditorMode(true);
    BlockServiceInstance.setAllBlocksGrouped(this.allBlocksGrouped);
    BlockRegister.registerAll();
    ParamTypeServiceInstance.init();
    BlockServiceInstance.updateBlocksList();

    this.initShutCuts();

    setTimeout(() => {
      this.showIntro = false;
      setTimeout(() => this.showIntroE = false, 300);
    }, 1000)
  }
  private destroy() {
    this.deleteShutCuts();
    this.saveSettings();
    this.saveRecentList();
    this.runner = null;
    window.onbeforeunload = null;
  }

  mounted() {
    (<any>window).editor = this;
    this.init();
  }
  beforeDestroy() {
    this.destroy();
  }

  //#endregion

  //#region Electron附加控制

  ipc : electron.IpcRenderer = null;
  dialog : Electron.Dialog = null;
  remote : Electron.Remote = null;

  currentWindow : BrowserWindow = null;
  currentAppPath = '';

  private initElectron() {
    this.ipc = electron.ipcRenderer;
    this.remote = electron.remote;
    this.dialog = this.remote.dialog;
    this.currentWindow = this.remote.getCurrentWindow();
    this.windowIsMax = this.currentWindow.isMaximized();
    this.currentWindow.setMinimumSize(710, 500);
    this.currentAppPath = process.cwd();
  }
  private initElectronIPC() {   
    this.ipc.on("main-window-act", (event, arg) => {
      if (arg == "show-exit-dialog") {
        this.windowControl('close');
      }
    });
    this.ipc.on('selected-json', (event, arg, path) => {
      if(!path || path.length == 0) 
        return;
      if(arg.type=='chooseOneImageAndCallback'){
        
      }
    });
    this.ipc.send('main-act-main-standby', true);
  }

  windowIsMax = false;

  windowControl(act) {
    switch(act) {
      case 'close':
        this.closeAndSaveAllDoc((close) => {
          if(close) this.ipc.send("main-act-quit");
        });
        break;
      case 'min':
        this.currentWindow.minimize();
        this.windowIsMax = this.currentWindow.isMaximized();
        break; 
      case 'max':
        this.currentWindow.maximize();
        this.windowIsMax = this.currentWindow.isMaximized();
        break;
      case 'restore':
        this.currentWindow.restore();
        this.windowIsMax = this.currentWindow.isMaximized();
        break;
    }
  }

  //#endregion

  //编辑器功能提供者
  //=======================

  initEditorWorkProvider() {
    let _this = this;
    DebugWorkProviderInstance.ModalProvider = (level : string, title :string, text: string, 
      okCallback : () => void) => {
      switch(level) {
        case 'log':
          _this.$Modal.success({
            title: title,
            content: text,
            onOk: () => okCallback()
          });
          break;
        case 'info':
          _this.$Modal.info({
            title: title,
            content: text,
            onOk: () => okCallback(),
          });
          break;
        case 'warn':
          _this.$Modal.warning({
            title: title,
            content: text,
            onOk: () => okCallback(),
          });
          break;
        case 'error':
          _this.$Modal.error({
            title: title,
            content: text,
            onOk: () => okCallback(),
          });
          break;
      }
      
    };
    DebugWorkProviderInstance.ConfirmModalProvider = (title :string, text: string, 
      okCallback : () => void, cancelCallback : () => void) => {
      _this.$Modal.confirm({
        title: title,
        content: text,
        onOk: () => okCallback(),
        onCancel: () => cancelCallback(),
      });
    };
  }

  //#region 文件保存写入控制

  private showDropChangesModal = false;
  private dropChangesCallback = () => {};

  public parser : BlockFileParser = null;

  private editorControlCurrent : BlockDrawer = null;
  private editorControls : Array<BlockDrawer> = [];

  public openedDocunments : Array<BlockDocunment> = [];
  public currentDocunment : BlockDocunment = null;

  private newFile() {
    let doc = new BlockDocunment('新文档');
    doc.isEditor = true;
    doc.mainGraph.isEditor = true;
    doc.currentGraph = doc.mainGraph;
    this.goDoc(doc);

    let that = this;
    setTimeout(() => {
      that.goGraph(doc.mainGraph);
    }, 500);
  }
  public onOpenFileInputChanged() {
    let input = (<HTMLInputElement>this.$refs.OpenFileInput);
    if(input.files.length > 0) {
      let reader = new FileReader();
      reader.readAsText(input.files[0], 'UTF-8');
      reader.onload = (e) => {
        this.doLoadFileToGraph(e.target.result.toString(), input.files[0].path);
      };
    }
  }
  private doLoadFile(path : string) {
    this.addToRecentList(path);//添加到最近列表
    let g = this.isFileOpened(path);
    if(g == null) {

      if(!fs.existsSync(path)) {
        this.$Modal.error({ title: '加载文档失败', content: '文件 ' + path + ' 不存在' });
        return;
      }

      g = new BlockDocunment();
      g.path = path;

      this.$Message.loading({ content: '文档正在载入中，请稍后...', duration: 0 });

      logger.log('Loading file : ' + path);
      fs.readFile(g.path, { encoding: 'UTF-8' }, (err, data) => {
        if(err) {
          this.$Message.destroy();
          logger.error('Load file failed : ' + path + '\n' + err);
          this.$Modal.error({ title: '加载文档失败', content: '发生了错误：' + err });
        }else this.doLoadFileToGraph(data, path);
      });

    }else {
      this.goDoc(g);
      setTimeout(() => {
        this.goGraph(g.mainGraph);
      }, 200);
    }
  }
  private doLoadFileToGraph(data : string, path : string) {
    let errRet = (e) => {
      this.$Modal.error({
        title: '加载文档失败',
        content: e
      });
      this.$Message.destroy();
    }
    let doc = new BlockDocunment();
    let ret = null;
    try {
      ret = this.parser.loadFromString(data, doc, true);
    } catch(e) {
      errRet('发生了错误：' + e);
      console.error(e);
      logger.error('File load failed : ' + e);
      return;
    }
    if(ret === -1)
      errRet('加载的文件是一个空文件');
    else if(ret === -2)
      errRet('加载的文件是不是有效的JSON格式，这表示文件可能已经损坏')
    else {
      this.goDoc(doc);

      //跳转
      setTimeout(() => {
        this.goGraph(doc.mainGraph);
        this.$Message.destroy();
      }, 400);

      logger.log('File loaded : ' + this.getPath(path));
    }
  }

  private getCurrentEditor(g : BlockGraphDocunment) {
    return (<BlockDrawer>this.$refs['BlockDrawer_' + g.docunment.uid])[0];
  }
  private getCurrentDocEditor(g : BlockDocunment) {
    return (<BlockDrawer>this.$refs['BlockDrawer_' + g.uid])[0];
  }

  public goDoc(g : BlockDocunment) {
    if(g != this.currentDocunment) {
      this.currentDocunment = g;
      if(!this.openedDocunments.contains(g))
        this.openedDocunments.push(g);
    }
  }
  public goGraph(g : BlockGraphDocunment) {
    this.getCurrentEditor(g).goGraph(g);
  }

  public closeAndSaveAllDoc(callback: Function) { 
    let close = () => {
      if(this.openedDocunments.length > 0) {
        this.closeDoc(this.openedDocunments[0], (con) => {
          if(con) close();
          else callback(false);
        })
      }else callback(true);
    };
    close();
  }
  public closeDoc(g : BlockDocunment, callback ?: Function) {
    let doClose = (g : BlockDocunment) => {
      let oldIndex = this.openedDocunments.indexOf(g);
      this.openedDocunments.remove(g);
      if(this.currentDocunment == g) {
        this.currentDocunment = oldIndex > 0 ? this.openedDocunments[oldIndex - 1] : 
          (this.openedDocunments.length > 0 ? this.openedDocunments[0] : null);
      }
      if(typeof callback == 'function')
        callback(true);
      logger.log('Docunment ' + g.name + ' closed.')
    };
    if(this.openedDocunments.contains(g)) {
      if(g.fileChanged) {
        this.$Modal.confirm({
          title: '保存提示',
          content: '你想保存文件 ' + g.name + ' 的修改吗？\n如果你不保存，你对此文件的修改都将丢失！',
          okText: '保存并关闭',
          cancelText: '不保存关闭',
          onOk: () => {
            this.saveDoc(g, (saved : boolean) => {
              if(saved)
                doClose(g)
            });
          },
          onCancel: () => {
            doClose(g);
            if(typeof callback == 'function')
              callback(false);
          }
        });
      }else
        doClose(g);
    }
  }
  
  /**
   * 导出文档到json
   */
  public saveJson(g : BlockDocunment) {  
    if(this.currentRuntimeType == 'electron') {
      //保存json
      this.dialog.showSaveDialog(this.currentWindow, {
        title: '导出 ' + g.name + ' 到 JSON 文件',
        filters: [
          { name: 'JSON文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] }
        ],
      }).then((v) => {
        let str = this.parser.saveToString(this.currentDocunment, true);
        fs.writeFileSync(v.filePath, str, {});
      }).catch(() => {})
    }
    else {
      let str = this.parser.saveToString(this.currentDocunment, true);
      CommonUtils.exportRaw(this.currentDocunment.name + '.json', str);
    }
  }
  /**
   * 保存文档
   */
  public saveDoc(g : BlockDocunment, callback ?: Function) {
    if(g.fileChanged) g.fileChanged = false;

    //保存基础数据
    this.getCurrentDocEditor(g).saveViewPort();

    //electron
    if(this.currentRuntimeType == 'electron') {
      //如果文件路径为空，则询问用户保存位置
      if(CommonUtils.isNullOrEmpty(g.path)) {
        this.dialog.showSaveDialog(this.currentWindow, {
          title: '保存 ' + g.name,
          filters: [
            { name: 'JSON文件', extensions: ['json'] },
            { name: '所有文件', extensions: ['*'] }
          ],
        }).then((v) => {
          g.path = v.filePath;
          //如果用户选择了路径，则重新调用保存
          if(!CommonUtils.isNullOrEmpty(g.path))
            this.saveDoc(g, callback);
          else if(typeof callback == 'function') callback(false);
        }).catch(() => {
          if(typeof callback == 'function') callback(false);
        })
        return;
      }
      //保存文件
      logger.log('Saving : ' + g.path);
      this.$Message.loading({ content: '正在保存中，请稍后...', duration: 0 });
      let str = this.parser.saveToString(this.currentDocunment, true);
      fs.writeFile(g.path, str, { encoding: 'UTF-8' }, () => {
        logger.log('Save file : ' + this.getPath(g.path) + ' success.');
        this.$Message.destroy();
        this.$Message.success('保存文档成功');
        if(typeof callback == 'function') 
          callback(true);
      });
    //网页保存
    }else{
      let str = this.parser.saveToString(this.currentDocunment, true);
      CommonUtils.exportRaw(this.currentDocunment.name + '.json', str);
      if(typeof callback == 'function') callback(true);
    }
  }
  /**
   * 保存文件
   */
  public loadFile() {
    if(this.currentRuntimeType == 'electron') {
      this.dialog.showOpenDialog(this.currentWindow, {
        title: '打开流程图文档',
        filters: [
          { name: 'JSON文件', extensions: ['json'] },
          { name: '所有文件', extensions: ['*'] }
        ],
      }).then((v) => {
        v.filePaths.forEach(element => {
          this.doLoadFile(element);
        });
      }).catch(() => {})
    }
    else {
      (<HTMLInputElement>this.$refs.OpenFileInput).value = null;
      (<HTMLInputElement>this.$refs.OpenFileInput).click(); 
    }
  }
  /**
   * 文件是否已经打开
   */
  public isFileOpened(path : string) : BlockDocunment|null {
    for (let i = 0; i < this.openedDocunments.length; i++) {
      if(this.openedDocunments[i].path == path)
        return this.openedDocunments[i];
    }
    return null;
  }

  //删除回调
  public onDeleteGraph(g : BlockGraphDocunment) {
    if(g.isMainGraph) return;

    let editor = this.getCurrentEditor(g);
    if(g == editor.currentGraph) editor.goGraph(g.parent);
    editor.doDeleteGraph(g);
  }
  //关闭回调
  public onCloseGraph(g : BlockDocunment) {
    this.closeDoc(g, null);
  }
  public onGoDoc(g : BlockDocunment) {
    if(this.currentDocunment != g) this.goDoc(g);
  }

  onDocEditorCreated(e : BlockDrawer) { 
    this.editorControls.push(e); 
    if(e.docunment == this.currentDocunment)
      this.editorControlCurrent = e.docunment.currentEditor;
  }
  onDocEditorDestroyed(e : BlockDrawer) { this.editorControls.remove(e); }
  @Watch('currentDocunment')
  onCurrentDocunmentChanged(g : BlockDocunment) { 
    if(g)
      this.editorControlCurrent = g.currentEditor;
    this.updateFileMenuState(); 
  }

  //#endregion

  //#region 调试运行控制

  private startBlock : BlockEditor = null;
  private runner : BlockRunner = null;
  private runnerStopByBreakPoint = false;
  private runningState : EditorRunningState = 'editing';
  private runningBlock : BlockEditor = null;

  private initEditorRunner() {
    this.runner = new BlockRunner();
    this.runner.onRunnerEnd = this.onRunnerEnd.bind(this);
    this.runner.onRunnerIdle = this.onRunnerIdle.bind(this);
    this.runner.onRunnerBreakPoint = this.onRunnerBreakPoint.bind(this);
  }
  private onRunnerEnd() {
    this.runningState = 'editing';
    this.runnerStopByBreakPoint = false;
    this.runner.stepMode = false;

    setTimeout(() => {
      this.editorControls.forEach(element => element.clearAllBlockDebugStyles());
    }, 300);

    console.log('[DebugRunner] 脚本已经运行完成');
  }
  private onRunnerIdle() {
  }
  private onRunnerBreakPoint(currentPort : BlockPort, block : Block) {
    this.runnerStopByBreakPoint = true;
    this.runningState = 'runningPaused';
    this.runningBlock = <BlockEditor>block;
    this.runningBlock.markBreakPointActiveState(true);
  }  

  public getRunningState()  { return this.runningState; }

  public startRun() {
    if(this.runningState == 'editing' || this.runningState == 'runningPaused') {

      //断点暂停，继续运行
      if(this.runnerStopByBreakPoint) {

        this.runner.stepMode = false;
        this.runner.start();
        this.runningState = 'running';
        this.runnerStopByBreakPoint = false;

      }else {
       
        //开始执行文档
        if(this.runner.executeStart(this.currentDocunment)){
          this.runningState = 'running';
          console.log('[DebugRunner] 开始运行脚本');
        }else {
          this.$Modal.warning({
            title: '错误',
            content: this.runner.lastError
          });
        }
      }
      return true;
    }
    return false;
  }
  public startRunAndStepNext() {
    if(this.runningState == 'editing') {
      if(this.startRun())
        this.runner.stepMode = true;
    }
  }
  public stopRun() {
    this.runner.stop();
    this.runner.clear();
    this.onRunnerEnd();
  }
  public pauseRun() {
    this.runner.stepMode = true;
  }
  public stepNext() {
    this.runner.stepMode = true;
    this.runner.start();

    if(this.runningBlock != null) {
      this.runningBlock.markBreakPointActiveState(false);
    }
  }

  public openConsole() {
    this.$Modal.info({
      title: '提示',
      content: '请按 F12 开启控制台'
    });
  }

  disableAllBreakPoint() { this.editorControlCurrent.enableOrdisableAllBreakPoint('disable') }
  enableAllBreakPoint() { this.editorControlCurrent.enableOrdisableAllBreakPoint('enable') }

  //#endregion

  showAbout() {
    
  }
  showHelp() {

  }
}

</script>

