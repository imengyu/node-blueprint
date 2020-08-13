<template>
  <div>
    <!--进入遮罩-->
    <div :class="'editor-intro'+(showIntro?' show':'')" v-show="showIntroE">
      <h1>Easy blueprint</h1>
      <div>简单可视化脚本蓝图编辑器</div>
    </div>
    <!--菜单栏-->
    <MenuBar :menus="menuMain">
      <div class="editor-breadcrumb" style="margin-left:18px">
        <div v-for="(graph, i) in graphBreadcrumb" :key="i" :class="(i==graphBreadcrumb.length-1?'last':'')+(graph.isCurrent?' current':'')">
          <span v-if="graph.isCurrent">{{graph.text}}</span>
          <a v-else href="javascript:;" @click="goGraph(graph.graph)">{{graph.text}}</a>
        </div>
      </div>
    </MenuBar>
    <!--工具栏-->
    <div class="editor-toolbar">

      <div :class="'button icon'+(mouseLeftMove?'':' active')" title="鼠标用来选择组件" @click="mouseLeftMove=false"><i class="iconfont icon-yidong_huaban1"></i></div>
      <div :class="'button icon'+(mouseLeftMove?' active':'')" title="鼠标用来移动视图" @click="mouseLeftMove=true"><i class="iconfont icon-shou"></i></div>
      <div class="separator"></div>
      
      <div class="button icon" title="添加单元" @click="showAddBlockPanelBar($event.currentTarget)"><i class="iconfont icon-pluss-2"></i></div>
      <div class="button icon" title="删除选中" :disabled="!isSelectedBlock" @click="showDeleteModalClick()"><i class="iconfont icon-trash"></i></div>

      <div class="separator"></div>

      <div v-if="runningState=='editing'||runningState=='runningPaused'" class="button icon green" 
        :title="runningState=='runningPaused'?'继续运行':'开始调试'" @click="startRun">
        <i class="iconfont icon-play"></i>
      </div>
      <div v-if="runningState=='editing'" class="button icon blue" title="开始单步调试" @click="startRunAndStepNext">
        <i class="iconfont icon-play-next"></i>
      </div>
      <div v-if="runningState=='runningPaused'" class="button icon green" title="运行下一步" @click="stepNext">
        <i class="iconfont icon-play-next"></i>
      </div>
      <div v-if="runningState=='running'" class="button icon yellow" title="暂停调试" @click="pauseRun">
        <i class="iconfont icon-pause"></i>
      </div>
      <div v-if="runningState=='running'||runningState=='runningPaused'" class="button icon red" title="停止调试" @click="stopRun">
        <i class="iconfont icon-close-2"></i>
      </div>

      <div class="separator"></div>

      <div class="button icon" title="打开控制台" @click="openConsole"><i class="iconfont icon-terminal"></i></div>
    
    </div>
    <!--添加单元弹出窗口-->
    <AddPanel v-show="showAddBlockPanel" 
      ref="AddBlockPanel"
      :show="showAddBlockPanel"
      :allBlocksGrouped="allBlocksGrouped" 
      :showPos="showAddBlockPanelPos"
      :style="{ maxHeight: showAddBlockPanelMaxHeight + 'px' }"
      :filterByPortDirection="filterByPortDirection"
      :filterByPortType="filterByPortType" 
      :filterByPortCustomType="filterByPortCustomType" 
      @onBlockItemClick="onBlockAddItemClick"
      @onClose="showAddBlockPanel=false" />
    <!--添加单元弹出窗口-->
    <ChooseTypePanel
      ref="ChooseTypePanel"
      :show="showChooseTypePanel"
      :showPos="showChooseTypePanelPos"
      :style="{ maxHeight: showChooseTypePanelMaxHeight + 'px' }"
      @onItemClick="onChooseTypeItemClick"
      @onClose="showChooseTypePanel=false" />
    
    <!--主编辑器-->
    <div class="editor-main">
      <Split v-model="splitOff">
        <!--流图编辑器-->
        <BlockDrawer slot="left" ref="BlockDrawer"
          :runner="runner"
          :settings="settings"
          :mouseLeftMove="mouseLeftMove"
          @update-select-state="updateSelectState"
          @update-add-block-panel-filter="updateAddBlockPanelFilter"
          @show-add-block-panel-at-pos="showAddBlockPanelAt"
          @clear-add-block-panel-filter="clearAddBlockPanelFilter"
          @update-clipboard-state="(v) => isClipboardFilled = v"
          @update-multi-selecting="(v) => isMultiSelecting = v"
          @update-block-owner-data="(d) => blockOwnerData = d"
        ></BlockDrawer>
        <!--属性栏-->
        <div slot="right" class="prop">
          <Split v-model="split2" mode="vertical">
            <div slot="top" class="prop-host">
              <BlockProp v-if="!isMultiSelecting && selectedBlock" :block="selectedBlock"></BlockProp>
              <ConnectorProp v-else-if="!isMultiSelecting && selectedConnector" :connector="selectedConnector"></ConnectorProp>
            </div>
            <div slot="bottom" class="prop-host">
              <DocunmentProp v-if="currentDocunment && currentGraph == currentDocunment.mainGraph" 
                :doc="currentDocunment"
                @on-open-graph="goGraph"
                @choose-graph-variable-type="onChooseGraphVariableType"

              ></DocunmentProp>
              <GraphProp v-else-if="currentGraph" 
                :graph="currentGraph"
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
    <input ref="OpenFileInput" type="file" accept="application/x-javascript" @change="onOpenFileInputChanged" />

  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from 'vuex-class'
import { Block } from '../model/Define/Block'
import { Vector2 } from "../model/Vector2";
import { Rect } from "../model/Rect";
import { BlockRegData, BlockParameterTypeRegData, BlockParameterEnumRegData } from "../model/Define/BlockDef";
import { BlockPort } from "../model/Define/Port";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { BlockFileParser } from "../model/WorkProvider/BlockFileParser";

import BaseBlocks from "../model/Blocks/BaseBlocks";
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
import { BlockPortType, BlockParameterType, BlockPortDirection } from "../model/Define/Port";
import { BlockRunner, BlockRunLoopData } from "../model/WorkProvider/Runner";
import { BlockDocunment, BlockGraphDocunment } from "../model/Define/BlockDocunment";
import { EditorSettings } from "../model/Editor/EditorSettings";
import { MenuOptions, MenuItem } from "../types/vue-contextmenujs";
import ConnectorProp from "../components/ConnectorProp.vue";
import BlockDrawer from "../components/BlockDrawer.vue";
import MenuBar, { MenuData, MenuSeparator } from "../components/MenuBar.vue";
import GraphProp from "../components/GraphProp.vue";
import DocunmentProp from "../components/DocunmentProp.vue";
import ChooseTypePanel from "../components/ChooseTypePanel.vue";

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
  }
})
export default class Editor extends Vue {
  name = "App";

  mouseLeftMove = false;
  splitOff = 0.8;
  split2 = 0.28;

  showIntro = true;
  showIntroE = true;

  menuMain : Array<MenuData> = [];
  menuItemStartRun : MenuData = null;
  menuItemStopRun : MenuData = null;
  menuItemStepNext : MenuData = null;
  menuItemStartRunAndStepNext : MenuData = null;
  menuItemCut : MenuData = null;
  menuItemCopy : MenuData = null;
  menuItemPatse : MenuData = null;
  menuItemDelete : MenuData = null;

  menuBlock : MenuOptions = null;
  menuBlockItemPatse : MenuItem = null;

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
    this.menuBlockItemPatse.disabled = !this.isClipboardFilled;
  }

  initMenu() {
    this.menuItemStartRun = new MenuData('启动调试', () => this.startRun(), '');
    this.menuItemStopRun = new MenuData('停止调试', () => this.stopRun(), '', false, false);
    this.menuItemStepNext = new MenuData('单步调试', () => this.stepNext(), '');
    this.menuItemStartRunAndStepNext = new MenuData('单步前进', () => this.startRunAndStepNext(), '', false, false);

    this.menuItemCut = new MenuData('剪切', () => {}, 'Ctrl+X');
    this.menuItemCopy = new MenuData('复制', () => {}, 'Ctrl+C');
    this.menuItemPatse = new MenuData('粘贴', () => {}, 'Ctrl+V');
    this.menuItemDelete = new MenuData('删除', () => this.showDeleteModalClick(), 'Delete');

    this.menuMain = [
      new MenuData('文件', [
        new MenuData('新建文件', () => this.newFile()),
        new MenuData('打开...', () => this.loadFile()),
        new MenuData('保存... ', () => this.saveFile(), 'Ctrl+S'),
        new MenuData('导出JSON', () => this.newFile()),
      ]),
      new MenuData('编辑', [
        new MenuData('撤销', () => {}, 'Ctrl+Z'),
        new MenuData('重做', () => {}, 'Ctrl+Y'),
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
        new MenuData('放大', () => this.editorControl.zoomIn()),
        new MenuData('100%', () => { this.editorControl.zoomUpdate(100) }),
        new MenuData('缩小', () => this.editorControl.zoomOut()),
        new MenuSeparator(),
        new MenuData('绘制调试信息', (menu) => {
          menu.checked = this.settings.drawDebugInfo = !this.settings.drawDebugInfo;
        }, '', this.settings.drawDebugInfo, true),
        new MenuData('切换开发者工具', () => {})
      ]),
      new MenuData('调试', [
        this.menuItemStartRun,
        this.menuItemStopRun,
        new MenuSeparator(),
        this.menuItemStepNext,
        this.menuItemStartRunAndStepNext,
        new MenuSeparator(),
        new MenuData('启用所有断点', () => {}, ''),
        new MenuData('禁用所有断点', () => {}, ''),
      ]),
      new MenuData('帮助', [
        new MenuData('使用文档', () => {}, ''),
        new MenuData('关于', () => {}, ''),
      ]),
    ];

    this.menuBlockItemPatse = { 
      label: "粘贴" ,
      disabled: !this.isClipboardFilled
    };
    this.menuBlock = {
      items: [
        { label: "删除", onClick: () => this.editorControl.deleteSelectedBlocks() },
        { label: "剪切" },
        { label: "复制" },
        this.menuBlockItemPatse,
        { label: "刷新节点", divided: true },
        { label: "断开连接" },
        { label: "对齐", children: [
          { label: "左对齐" },
          { label: "上对齐" },
          { label: "右对齐" },
          { label: "下对齐" },
        ] },
      ],
    };
  }
  showBlockMenu() { this.$contextmenu(this.menuBlock);  }
  showDeleteModalClick() { this.editorControl.showDeleteModalClick() }

  graphBreadcrumb : Array<{
    text: string,
    graph: BlockGraphDocunment,
    isCurrent: boolean,
  }> = [];

  blockOwnerData = null;

  @Watch('currentGraph')
  loadGraphBreadcrumb(v : BlockGraphDocunment) {
    if(v == null || this.currentDocunment == null) this.graphBreadcrumb.empty();
    else {
      this.graphBreadcrumb.empty();
      this.graphBreadcrumb.push({
        text: v.name,
        graph: v,
        isCurrent: true
      });
      let loop = (graph : BlockGraphDocunment) => {
        this.graphBreadcrumb.unshift({
          text: graph.name,
          graph: graph,
          isCurrent: false
        });
        if(graph.parent != null) loop(graph.parent);
      };
      if(v.parent != null) loop(v.parent);
    }
  } 

  //子模块状态信息
  isSelectedBlock = false;
  isClipboardFilled = false;
  isMultiSelecting = false;

  selectedBlock = null;
  selectedConnector = null;

  updateSelectState(s) {
    this.isSelectedBlock = s;
  
    if(!this.isMultiSelecting) {
      this.selectedBlock = this.editorControl.getOneSelectedBlock();
      this.selectedConnector = this.editorControl.getOneSelectedConnector();
    }else {
      this.selectedBlock = null;
      this.selectedConnector = null;
    }
  }

  //#region 添加单元菜单

  @Watch('showAddBlockPanel') 
  onShowAddBlockPanelChanged(newV) {
    if(!newV && this.editorControl.isConnectingToNew) 
      this.editorControl.endConnectToNew();
  }

  public allBlocksGrouped = [];

  onBlockAddItemClick(block : BlockRegData) {
    this.showAddBlockPanel = false;
    this.editorControl.userAddBlock(block);
  }

  //添加单元弹出

  showAddBlockPanelPos = new Vector2();
  showAddBlockPanel = false;
  showAddBlockPanelMaxHeight = 500;

  filterByPortDirection : BlockPortDirection = null;
  filterByPortType : BlockParameterType = null;
  filterByPortCustomType : string = '';

  updateAddBlockPanelFilter(filter) {
    this.filterByPortDirection = filter.filterByPortDirection;
    this.filterByPortType = filter.filterByPortType;
    this.filterByPortCustomType = filter.filterByPortCustomType;
    this.addBlockPanelDoFilter();
  }
  clearAddBlockPanelFilter() {
    this.filterByPortDirection = null;
    this.filterByPortType = null;
    this.filterByPortCustomType = null;
    (<AddPanel>this.$refs.AddBlockPanel).clearFilter();
  }
  addBlockPanelDoFilter() {
    setTimeout(() => (<AddPanel>this.$refs.AddBlockPanel).doFilter(), 150);
  }
  public showAddBlockPanelAt(pos : Vector2) {
    this.showAddBlockPanelPos = pos;
    this.showAddBlockPanel = true;
    this.showAddBlockPanelMaxHeight = this.editorControl.getViewPort().h - pos.y;
    if(this.showAddBlockPanelMaxHeight > 500) this.showAddBlockPanelMaxHeight = 500;
    else if(this.showAddBlockPanelMaxHeight < 222) {
      this.showAddBlockPanelPos.y -= 222 - this.showAddBlockPanelMaxHeight;
      this.showAddBlockPanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.AddBlockPanel).focus();
  }
  showAddBlockPanelBar(e : HTMLElement) {
    this.clearAddBlockPanelFilter();
    
    if(this.showAddBlockPanel) this.showAddBlockPanel = false;
    else this.showAddBlockPanelAt(new Vector2(
      e.offsetLeft + this.editorControl.toolBarWidth,
      e.offsetTop + this.editorControl.toolBarHeight + 3
    ));
  }

  //#endregion

  //#region 选择数据类型菜单

  showChooseTypePanel = false;
  showChooseTypePanelPos = new Vector2();
  showChooseTypePanelMaxHeight = 500;
  showChooseTypePanelCallback : Function = null;

  onChooseTypeItemClick(choosedType : BlockParameterTypeRegData, isBaseType : boolean) {
    if(typeof this.showChooseTypePanelCallback == 'function') {
      this.showChooseTypePanel = false;
      this.showChooseTypePanelCallback(choosedType, isBaseType);
    }
  }
  public showChooseTypePanelAt(pos : Vector2) {
    this.showChooseTypePanelPos = pos;
    this.showChooseTypePanel = true;
    this.showChooseTypePanelMaxHeight = this.editorControl.getViewPort().h - pos.y;
    if(this.showChooseTypePanelPos.x + 300 > window.innerWidth)
      this.showChooseTypePanelPos.x -= this.showChooseTypePanelPos.x + 300 - window.innerWidth;
    if(this.showChooseTypePanelMaxHeight > 500) this.showChooseTypePanelMaxHeight = 500;
    else if(this.showChooseTypePanelMaxHeight < 222) {
      this.showChooseTypePanelPos.y -= 222 - this.showChooseTypePanelMaxHeight;
      this.showChooseTypePanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.ChooseTypePanel).focus();
  }

  onChooseGraphVariableType(v, pos : Vector2) {
    this.showChooseTypePanelCallback = v;
    this.showChooseTypePanelAt(pos);
  }

  //#endregion

  //#region 设置加载与读取

  settings : EditorSettings = {
    gridShow: true,
    drawDebugInfo: false,
  }

  private loadSettings() {
    this.settings.drawDebugInfo = SettingsServiceInstance.getSettingsBoolean('drawDebugInfo', false);
    this.settings.gridShow = SettingsServiceInstance.getSettingsBoolean('gridShow', true);
  }
  private saveSettings() {
    SettingsServiceInstance.setSettingsBoolean('drawDebugInfo', this.settings.drawDebugInfo);
    SettingsServiceInstance.setSettingsBoolean('gridShow', this.settings.gridShow);
  }
       
  //#endregion

  //#region 初始化

  editorControl : BlockDrawer = null;
  
  private init() {  

    //获取子控件实例
    setTimeout(() => this.editorControl = <BlockDrawer>this.$refs.BlockDrawer, 100);

    this.parser = new BlockFileParser();

    this.loadSettings();
    this.initMenu();
    this.initEditorRunner();
    this.initEditorWorkProvider();
  
    BlockServiceInstance.init();
    BlockServiceInstance.isEditorMode = true;
    BlockServiceInstance.allBlocksGrouped = this.allBlocksGrouped;
    BaseBlocks.register();
    ParamTypeServiceInstance.init();
    BlockServiceInstance.updateBlocksList();

    setTimeout(() => {
      this.showIntro = false;
      setTimeout(() => this.showIntroE = false, 300);
      this.newFile();
    }, 1000)
  }
  private destroy() {
    this.saveSettings();
    this.runner = null;
  
  }

  mounted() {
    this.init();
    window.onbeforeunload = () => {
      this.saveSettings();
      if(this.currentFileChanged)
        return "确认离开当前页面吗？未保存的数据将会丢失";
      return undefined;
    };
  }
  beforeDestroy() {
    this.destroy();
    window.onbeforeunload = null;
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
  public currentDocunment : BlockDocunment = null;
  public currentGraph : BlockGraphDocunment = null;
  public currentFileChanged = false;

  private setFileChanged() { 
    this.currentFileChanged = true; 
  }
  private doNewFile() {
    this.currentFileChanged = true;
    this.currentDocunment = new BlockDocunment('新文档');
    this.currentDocunment.isEditor = true;
    this.currentDocunment.mainGraph.isEditor = true;
    this.currentGraph = this.currentDocunment.mainGraph;
    this.editorControl.loadDocunment(this.currentDocunment);
    this.editorControl.drawGraph(this.currentGraph);
  }
  private doLoadFile() { 
    (<HTMLInputElement>this.$refs.OpenFileInput).value = null;
    (<HTMLInputElement>this.$refs.OpenFileInput).click(); 
  }
  private onOpenFileInputChanged() {
    let input = (<HTMLInputElement>this.$refs.OpenFileInput);
    if(input.files.length > 0) {
      let reader = new FileReader();
      reader.readAsText(input.files[0], 'UTF-8');
      reader.onload = (e) => {
        let content = e.target.result;
        try {
          this.currentDocunment = new BlockDocunment();
          this.parser.loadFromString(content.toString(), this.currentDocunment, true);
          this.currentGraph = this.currentDocunment.mainGraph;

          this.editorControl.loadDocunment(this.currentDocunment);
          this.editorControl.drawGraph(this.currentGraph);
        }
        catch(e) {
          this.$Modal.error({
            title: '加载文档失败',
            content: '发生了错误：' + e
          });
          this.doNewFile();
          console.error(e);
        }
      };
    }
  }

  public goGraph(g : BlockGraphDocunment) {
    if(g != this.currentGraph) {
      this.currentGraph = g;
      this.editorControl.drawGraph(this.currentGraph);
    }
  }
  public onDeleteGraph(g : BlockGraphDocunment) {
    if(g.isMainGraph) return;
    if(g == this.currentGraph) this.goGraph(g.parent);
    this.editorControl.doDeleteGraph(g);
  }


  public newFile() {
    if(this.currentFileChanged) {
      this.showDropChangesModal = true;
      this.dropChangesCallback = this.doNewFile;
    }
    else this.doNewFile();
  }
  public saveFile() {
    let str = this.parser.saveToString(this.currentDocunment, true);
    CommonUtils.exportRaw(this.currentDocunment.name + '.json', str);
  }
  public loadFile() {
    if(this.currentFileChanged) {
      this.showDropChangesModal = true;
      this.dropChangesCallback = this.doLoadFile;
    }
    else this.doLoadFile();
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

    setTimeout(() => this.editorControl.clearAllBlockDebugStyles(), 300);

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

        //查找入口单元
        this.startBlock = this.editorControl.getOneBlockByGUID(BaseBlocks.getScriptBaseBlockIn().guid);
        if(this.startBlock == null) {
          this.$Modal.info({
            title: '错误',
            content: '没有找到入口单元，无法运行脚本<br>请先添加一个入口单元'
          });
          return false;
        }

        //变量初始化以仅参数
        this.editorControl.updateAllBlockPrams();

        //激活入口单元
        this.runner.push(this.startBlock.outputPorts['00000000'], 'connector');
        this.runner.start();
        this.runningState = 'running';

        console.log('[DebugRunner] 开始运行脚本');
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

  disableAllBreakPoint() {
    
  }
  enableAllBreakPoint() {
    
  }
  //#endregion


}

</script>

