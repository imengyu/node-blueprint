<template>
  <div class="window" oncontextmenu="return false">
    <!--进入遮罩-->
    <div :class="'editor-intro' + (showIntro ? ' show' : '')" v-show="showIntroE">
      <h1>Easy blueprint</h1>
      <div>简单可视化脚本蓝图编辑器</div>
    </div>

    <!--添加单元弹出窗口-->
    <AddPanel
      v-show="showAddBlockPanel"
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
      @onClose="showAddBlockPanel = false"
    />
    <!--添加单元弹出窗口-->
    <ChooseTypePanel
      ref="ChooseTypePanel"
      :show="showChooseTypePanel"
      :showPos="showChooseTypePanelPos"
      :canbeExecute="showChooseTypePanelCanbeExecute"
      :style="{ maxHeight: showChooseTypePanelMaxHeight + 'px' }"
      @onItemClick="onChooseTypeItemClick"
      @onClose="showChooseTypePanel = false"
    />

    <!--菜单栏-->
    <MenuBar :menus="menuMain" class="editor-main-menu-bar window-title-bar">
      <template slot="icon">
        <div class="editor-icon">
          <img src="../assets/images/logo-huge-light.svg" />
        </div>
      </template>
      <template v-if="showControlButtons" slot="end">
        <div class="window-controls-container">
          <div class="window-icon-bg" @click="windowControl('min')" title="最小化">
            <div class="window-icon window-minimize"></div>
          </div>
          <div
            v-if="windowIsMax"
            class="window-icon-bg window-icon-unmaximize"
            @click="windowControl('restore')"
            title="还原"
          >
            <div class="window-icon window-max-restore window-unmaximize"></div>
          </div>
          <div
            v-else
            class="window-icon-bg window-icon-maximize"
            @click="windowControl('max')"
            title="最大化"
          >
            <div class="window-icon window-max-restore window-maximize"></div>
          </div>
          <div
            class="window-icon-bg window-close-bg"
            @click="windowControl('close')"
            title="关闭"
          >
            <div class="window-icon window-close"></div>
          </div>
        </div>
      </template>
    </MenuBar>
    <!--主停靠容器-->
    <DockHost class="editor-main" ref="dockLayout">

      <!--空页-->
      <template slot="mainEmptyView">
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
                <a href="javascript:;" :title="item" @click="doLoadFile(item)">{{
                  getPath(item)
                }}</a>
              </li>
            </ul>
          </div>
        </div>
      </template>

      <DockPanel
        key="hello"
        title="欢迎使用"
        iconClass="iconfont icon-pig"
        insertTo="areaLeft"
      >
        <h1>欢迎使用</h1>
      </DockPanel>
      <!--属性编辑器-->
      <DockPanel key="Props" title="属性" iconClass="iconfont icon-new_custom19" :tabLeftOffset="31">
        <PropTab>
          <PropTabPanel title="单元属性" iconClass="iconfont icon-vector" class="prop-host">
            <BlockProp 
              v-if="!isMultiSelecting && selectedBlock"
              class="prop"
              :block="selectedBlock"
            ></BlockProp>
          </PropTabPanel>
          <PropTabPanel title="图表属性" iconClass="iconfont icon-board" class="prop-host">
            <GraphProp 
              v-if="currentDocunment && currentDocunment.currentGraph"
              class="prop"
              :graph="currentDocunment.currentGraph"
              :blockOwnerData="blockOwnerData"
              @on-open-graph="goGraph"
              @on-delete-graph="onDeleteGraph"
              @choose-graph-variable-type="onChooseGraphVariableType"
            ></GraphProp>
          </PropTabPanel>
        </PropTab>
      </DockPanel>
      <DockPanel key="DocProps" title="文档属性" iconClass="iconfont icon-file-" class="prop-host">
        <DocunmentProp
          class="prop"
          v-if="currentDocunment && currentDocunment.currentGraph == currentDocunment.mainGraph"
          :doc="currentDocunment"
          :blockOwnerData="blockOwnerData"
          @on-open-graph="goGraph"
          @on-delete-graph="onDeleteGraph"
          @choose-graph-variable-type="onChooseGraphVariableType"
        ></DocunmentProp>
        <PropNotAvailable v-else title="文档属性" />
      </DockPanel>
      <!--主编辑器-->
      <DockPanel
        v-for="doc in openedDocunments"
        :key="'Doc_' + doc.uid"
        :title="doc.name"
        iconClass="iconfont icon-edit-"
        insertTo="areaMain"
        :closeable="true"
        :tabLeftOffset="51"
        @on-close="onEditorMainTabClose"
      >
        <!--工具栏-->
        <div class="editor-toolbar">
          <div
            :class="'tool-item button icon' + (mouseLeftMove ? '' : ' active')"
            title="鼠标用来选择组件"
            @click="mouseLeftMove = false"
          >
            <i class="iconfont icon-yidong_huaban1"></i>
          </div>
          <div
            :class="'tool-item button icon' + (mouseLeftMove ? ' active' : '')"
            title="鼠标用来移动视图"
            @click="mouseLeftMove = true"
          >
            <i class="iconfont icon-shou"></i>
          </div>

          <div class="separator"></div>

          <div v-show="currentDocunment">
            <div
              class="tool-item button icon"
              title="添加单元"
              @click="showAddBlockPanelBar($event.currentTarget)"
            >
              <i class="iconfont icon-pluss-2"></i>
            </div>
            <div
              class="tool-item button icon"
              title="删除选中"
              :disabled="!isSelectedBlock"
              @click="showDeleteModalClick()"
            >
              <i class="iconfont icon-trash"></i>
            </div>

            <div class="separator"></div>

            <div
              v-if="runningState == 'editing' || runningState == 'runningPaused'"
              class="tool-item button icon green"
              :title="runningState == 'runningPaused' ? '继续运行' : '开始调试'"
              @click="startRun"
            >
              <i class="iconfont icon-play"></i>
            </div>
            <div
              v-if="runningState == 'editing'"
              class="tool-item button icon blue"
              title="开始单步调试"
              @click="startRunAndStepNext"
            >
              <i class="iconfont icon-play-next"></i>
            </div>
            <div
              v-if="runningState == 'runningPaused'"
              class="tool-item button icon green"
              title="运行下一步"
              @click="stepNext"
            >
              <i class="iconfont icon-play-next"></i>
            </div>
            <div
              v-if="runningState == 'running'"
              class="tool-item button icon yellow"
              title="暂停调试"
              @click="pauseRun"
            >
              <i class="iconfont icon-pause"></i>
            </div>
            <div
              v-if="runningState == 'running' || runningState == 'runningPaused'"
              class="tool-item button icon red"
              title="停止调试"
              @click="stopRun"
            >
              <i class="iconfont icon-close-2"></i>
            </div>

            <div class="separator"></div>
          </div>

          <div class="tool-item button icon" title="打开控制台" @click="openConsole">
            <i class="iconfont icon-terminal"></i>
          </div>
        </div>
        <GraphBreadcrumb 
          :currentDocunment="doc"
          :currentGraph="doc.currentGraph"
          @on-go-graph="goGraph"
          />
        <!--流图编辑器-->
        <BlockDrawer
          :ref="'BlockDrawer_' + doc.uid"
          :runner="runner"
          :settings="settings"
          :mouseLeftMove="mouseLeftMove"
          :docunment="doc"
          @update-select-state="updateSelectState"
          @update-add-block-panel-filter="updateAddBlockPanelFilter"
          @show-add-block-panel-at-pos="showAddBlockPanelAt"
          @clear-add-block-panel-filter="clearAddBlockPanelFilter"
          @update-clipboard-state="(v) => (isClipboardFilled = v)"
          @update-multi-selecting="(v) => (isMultiSelecting = v)"
          @update-block-owner-data="(d) => (blockOwnerData = d)"
          @choose-custom-type="onChooseCustomType"
          @on-show-input-right-menu="showInputRightMenu"
          @on-want-save="saveDoc(doc)"
          @on-open-graph="goGraph"
          @on-created="onDocEditorCreated"
          @on-destroyed="onDocEditorDestroyed"
        ></BlockDrawer>
      </DockPanel>
    </DockHost>
    <!--对话框-->
    <div>
      <el-dialog :visible.sync="showDropChangesModal" title="文件保存提示">
        <div style="text-align: center">
          <i class="pi pi-exclamation-triangle p-mr-3" style="font-size: 2rem" />
          你希望丢弃当前文档的更改吗？<br />
          注意，未保存的更改将丢失！
        </div>
        <template slot="footer" class="dialog-footer">
          <el-button @click="showDropChangesModal = false">返回</el-button>
          <el-button type="danger" @click="dropChangesCallback(false);showDropChangesModal = false;">丢弃更改</el-button>
          <el-button type="success" @click="dropChangesCallback(true);showDropChangesModal = false;">保存更改</el-button>
        </template>
      </el-dialog>
      <!--加载失败对话框-->
      <el-dialog :visible.sync="showLoadFailedModal" title="加载文档失败">
        {{ showLoadFailedModalContent }}
        <template #footer>
          <el-button autofocus @click="showLoadFailedModal = false">确定</el-button>
        </template>
      </el-dialog>
      <!--运行失败对话框-->
      <el-dialog :visible.sync="showRunFailedModal" title="执行错误">
        {{ showRunFailedModalContent }}
        <template #footer>
          <el-button autofocus @click="showRunFailedModal = false">确定</el-button>
        </template>
      </el-dialog>
      <!--开发者工具提示对话框-->
      <el-dialog :visible.sync="showDevtoolsTipModal" title="提示">
        请按 <span class="badge badge-secondary">F12</span> 开启控制台
        <template #footer>
          <el-button autofocus @click="showDevtoolsTipModal = false">确定</el-button>
        </template>
      </el-dialog>
      <!--Alert 对话框-->
      <el-dialog v-for="(dialog, i) in alertModals" :key="i" :visible.sync="dialog.display" :title="dialog.title">
        <i
          v-if="dialog.level === 'error'"
          class="iconfont icon-error- p-mr-3"
          style="font-size: 2rem; color: #f21207"
        />
        <i
          v-else-if="dialog.level === 'warning'"
          class="pi pi-exclamation-triangle p-mr-3"
          style="font-size: 2rem"
        />
        <i
          v-else-if="dialog.level === 'info'"
          class="iconfont icon-info-1 p-mr-3"
          style="font-size: 2rem; color: #1e90ff"
        />
        {{ dialog.text }}
        <template #footer>
          <el-button @click="onAlertModalClose(dialog)" autofocus>确定</el-button>
        </template>
      </el-dialog>
      <!--关于对话框-->
      <el-dialog :visible.sync="showAboutModal" title="关于 Node Blueprint">
        <div class="editor-about">
          <img src="../assets/images/logo-huge-light.svg" width="270" />
          <p>这是一个可视化蓝图（流程图）程序编辑器</p>
          <hr>
          <div class="v">
            <span class="t">版本：</span>
            <span>0.1.0</span>
          </div>
          <div class="v">
            <span class="t">环境版本：</span>
            <span></span>
          </div>
        </div>
        <template #footer>
          <el-button autofocus @click="showAboutModal = false">确定</el-button>
        </template>
      </el-dialog>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Vue, Watch } from "vue-property-decorator";
import { Block, BlockSupportPlatform } from "../model/Define/Block";
import { Vector2 } from '../model/Vector2'
import { BlockRegData, BlockParameterTypeRegData } from "../model/Define/BlockDef";
import { BlockPort } from "../model/Define/Port";
import { BlockFileParser } from "../model/WorkProvider/BlockFileParser";

import CommonUtils from "../utils/CommonUtils";
import BlockCategory from "../components/BlockEditor/BlockCategory.vue";
import BlockProp from "../components/PropEditor/BlockProp.vue";
import AddPanel from "../components/Panel/AddPanel.vue";
import BlockServiceInstance from "../sevices/BlockService";
import ParamTypeServiceInstance from "../sevices/ParamTypeService";
import DebugWorkProviderInstance from "../model/WorkProvider/DebugWorkProvider";
import SettingsServiceInstance from "../sevices/SettingsService";
import { BlockEditor } from "../model/Editor/BlockEditor";
import { BlockPortDirection } from "../model/Define/Port";
import { BlockRunner } from "../model/WorkProvider/Runner";
import { BlockDocunment, BlockGraphDocunment } from "../model/Define/BlockDocunment";
import { EditorSettings } from "../model/Editor/EditorSettings";
import { MenuItem, MenuData, MenuSeparator } from "../model/Menu";
import { BlockParameterType } from "../model/Define/BlockParameterType";
import ConnectorProp from "../components/PropEditor/ConnectorProp.vue";
import BlockDrawer from "../components/BlockEditor/BlockDrawer.vue";
import MenuBar from "../components/MenuBar.vue";
import GraphProp from "../components/PropEditor/GraphProp.vue";
import DocunmentProp from "../components/PropEditor/DocunmentProp.vue";
import PropNotAvailable from "../components/PropEditor/PropNotAvailable.vue";
import ChooseTypePanel, { ChooseTypePanelCallback, } from "../components/Panel/ChooseTypePanel.vue";
import GraphBreadcrumb from "../components/GraphBreadcrumb.vue";
import DockHost from "../components/DockLayout/DockHost.vue";
import DockPanel from "../components/DockLayout/DockPanel.vue";
import PropTab from "../components/Tab/PropTab.vue";
import PropTabPanel from "../components/Tab/PropTabPanel.vue";
import BlockRegister from "../model/Blocks/Utils/BlockRegister";
import HtmlUtils from "../utils/HtmlUtils";
import StringUtils from "../utils/StringUtils";
import logger from "../utils/Logger";
import { EditorPlatformWorkAbstract } from "./Platform/EditorPlatformWorkAbstract";
import { EditorPlatformWorkWeb } from "./Platform/EditorPlatformWorkWeb";
import { EditorPlatformWorkElectron } from "./Platform/EditorPlatformWorkElectron";
import { Connector } from "@/model/Define/Connector";
import { BlockEditorOwner } from "@/model/Editor/BlockEditorOwner";
import { FilterByPortData } from "./BlockEditor/BlockEditorWorker.vue";
import { DockPanelData } from "./DockLayout/DockData";
import { Rect } from "@/model/Rect";
import { MessageBoxData } from "element-ui/types/message-box";

export class EditorShortCutKey {
  public key: string;
  public alt = false;
  public conntrol = false;
  public shift = false;
  public callback: Function;

  public constructor(
    key: string,
    callback: Function,
    alt = false,
    conntrol = false,
    shift = false
  ) {
    this.key = key;
    this.callback = callback;
    this.alt = alt;
    this.conntrol = conntrol;
    this.shift = shift;
  }
}
export type EditorRunningState = "editing" | "running" | "runningPaused";

@Component({
  components: {
    BlockCategory: BlockCategory,
    AddPanel: AddPanel,
    MenuBar: MenuBar,
    BlockProp: BlockProp,
    ConnectorProp: ConnectorProp,
    BlockDrawer: BlockDrawer,
    GraphProp: GraphProp,
    DocunmentProp: DocunmentProp,
    ChooseTypePanel: ChooseTypePanel,
    GraphBreadcrumb: GraphBreadcrumb,
    DockHost: DockHost,
    DockPanel: DockPanel,
    PropNotAvailable,
    PropTabPanel,
    PropTab,
  },
})
export default class Editor extends Vue {
  name = "App";

  mouseLeftMove = false;

  showIntro = true;
  showIntroE = true;
  showControlButtons = false;

  //#region 主菜单

  menuMain: Array<MenuData> = [];
  menuItemStartRun: MenuData = null;
  menuItemStopRun: MenuData = null;
  menuItemStepNext: MenuData = null;
  menuItemStartRunAndStepNext: MenuData = null;
  menuItemCut: MenuData = null;
  menuItemCopy: MenuData = null;
  menuItemPatse: MenuData = null;
  menuItemDelete: MenuData = null;
  menuItemSave: MenuData = null;
  menuItemExportJson: MenuData = null;
  menuItemRecent: MenuData = null;

  @Watch("runningState")
  updateRunMenuStates() {
    this.menuItemStartRun.enable =
      this.runningState == "editing" || this.runningState == "runningPaused";
    this.menuItemStartRun.name =
      this.runningState == "runningPaused" ? "继续运行" : "启动调试";
    this.menuItemStopRun.enable = this.runningState != "editing";
    this.menuItemStepNext.enable = this.runningState != "editing" && this.runner.stepMode;
    this.menuItemStartRunAndStepNext.enable = this.runningState == "editing";
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
    this.menuItemStartRun = new MenuData("启动调试", () => this.startRun(), "F5");
    this.menuItemStopRun = new MenuData(
      "停止调试",
      () => this.stopRun(),
      "Shift+F5",
      false,
      false
    );
    this.menuItemStepNext = new MenuData("单步调试", () => this.stepNext(), "F10");
    this.menuItemStartRunAndStepNext = new MenuData(
      "单步前进",
      () => this.startRunAndStepNext(),
      "F10",
      false,
      false
    );

    this.menuItemCut = new MenuData(
      "剪切",
      () => this.editorControlCurrent.clipboardCutSelect(),
      "Ctrl+X"
    );
    this.menuItemCopy = new MenuData(
      "复制",
      () => this.editorControlCurrent.clipboardCopySelect(),
      "Ctrl+C"
    );
    this.menuItemPatse = new MenuData(
      "粘贴",
      () => this.editorControlCurrent.clipboardPaste(),
      "Ctrl+V"
    );
    this.menuItemDelete = new MenuData(
      "删除",
      () => this.showDeleteModalClick(),
      "Delete"
    );

    this.menuItemRecent = new MenuData("打开最近文件", [
      new MenuSeparator(),
      new MenuData("清除最近打开文件", () => {
        this.recentList.empty();
        this.flushRecentList();
      }),
    ]);

    this.menuItemSave = new MenuData(
      "保存...",
      () => {
        this.saveDoc(this.currentDocunment);
      },
      "Ctrl+S",
      false,
      false
    );
    this.menuItemExportJson = new MenuData(
      "导出JSON",
      () => this.saveJson(this.currentDocunment),
      "",
      false,
      false
    );

    this.menuMain = [
      new MenuData(
        "文件",
        [
          new MenuData("新建文件", () => this.newFile()),
          new MenuData("打开...", () => this.loadFile()),
          this.menuItemRecent,
          new MenuSeparator(),
          this.menuItemSave,
          this.menuItemExportJson,
        ].concat(
          this.currentRuntimeType == "electron"
            ? [
                new MenuSeparator(),
                new MenuData("退出", () => this.windowControl("close")),
              ]
            : []
        )
      ),
      new MenuData("编辑", [
        new MenuData("撤销", () => this.undo(), "Ctrl+Z"),
        new MenuData("重做", () => this.redo(), "Ctrl+Y"),
        new MenuSeparator(),
        this.menuItemCut,
        this.menuItemCopy,
        this.menuItemPatse,
        this.menuItemDelete,
      ]),
      new MenuData("视图", [
        new MenuData(
          "显示网格",
          (menu) => {
            menu.checked = this.settings.gridShow = !this.settings.gridShow;
          },
          "",
          this.settings.gridShow,
          true
        ),
        new MenuSeparator(),
        new MenuData("放大", () => this.editorControlCurrent.zoomIn()),
        new MenuData("100%", () => {
          this.editorControlCurrent.zoomUpdate(100);
        }),
        new MenuData("缩小", () => this.editorControlCurrent.zoomOut()),
        new MenuSeparator(),
        new MenuData(
          "绘制调试信息",
          (menu) => {
            menu.checked = this.settings.drawDebugInfo = !this.settings.drawDebugInfo;
          },
          "",
          this.settings.drawDebugInfo,
          true
        ),
      ]),
      new MenuData("调试", [
        this.menuItemStartRun,
        this.menuItemStopRun,
        new MenuSeparator(),
        this.menuItemStepNext,
        this.menuItemStartRunAndStepNext,
        new MenuSeparator(),
        new MenuData("启用所有断点", () => this.disableAllBreakPoint(), ""),
        new MenuData("禁用所有断点", () => this.enableAllBreakPoint(), ""),
      ]),
      new MenuData(
        "帮助",
        [
          new MenuData("使用文档", () => this.showHelp(), ""),
          new MenuData("关于", () => this.showAbout(), ""),
        ].concat(
          this.currentRuntimeType == "electron"
            ? [
                new MenuSeparator(),
                new MenuData(
                  "切换开发者工具",
                  () => this.platformWork.editorAction("main-act-toggle-devtools"),
                  "Ctrl+Shift+I"
                ),
                new MenuData(
                  "强制重载页面",
                  () => this.platformWork.editorAction("main-act-reload"),
                  "Ctrl+R"
                ),
              ]
            : []
        )
      ),
    ];

    window.addEventListener(
      "contextmenu",
      (e) => {
        if (HtmlUtils.isEleEditable(<HTMLElement>e.target)) {
          this.showInputRightMenu(new Vector2(e.x, e.y), <HTMLInputElement>e.target);
          e.preventDefault();
        }
      },
      false
    );

    //添加键盘快捷键
    if (this.currentRuntimeType == "electron") {
      this.keyShutCuts.addOnce(
        new EditorShortCutKey(
          "KeyI",
          () => {
            this.platformWork.editorAction("main-act-toggle-devtools");
          },
          false,
          true,
          true
        )
      );
      this.keyShutCuts.addOnce(
        new EditorShortCutKey(
          "KeyR",
          () => {
            this.platformWork.editorAction("main-act-reload");
          },
          false,
          true,
          false
        )
      );
    }
  }
  showDeleteModalClick() {
    this.editorControlCurrent.showDeleteModalClick();
  }
  showInputRightMenu(screenPos: Vector2, ele: HTMLInputElement) {
    let selection = document.getSelection().toString();
    let menuItems = <MenuItem[]>[
      {
        label: "剪切",
        onClick: () => {
          ele.focus();
          document.execCommand("cut");
        },
        disabled: StringUtils.isNullOrEmpty(selection),
      },
      {
        label: "复制",
        onClick: () => {
          ele.focus();
          document.execCommand("copy");
        },
        disabled: StringUtils.isNullOrEmpty(selection),
      },
      {
        label: "粘贴",
        onClick: () => {
          ele.focus();
          document.execCommand("paste");
        },
        divided: true,
      },
      {
        label: "全选",
        onClick: () => {
          ele.focus();
          document.execCommand("seletcAll");
        },
      },
      {
        label: "删除",
        onClick: () => {
          ele.focus();
          document.execCommand("delete");
        },
        disabled: StringUtils.isNullOrEmpty(selection),
      },
    ];

    this.$contextmenu({
      x: screenPos.x,
      y: screenPos.y,
      items: menuItems,
      zIndex: 100,
      customClass: "menu-context",
    });
  }

  //键盘快捷键

  keyShutCuts: Array<EditorShortCutKey> = [];

  initShutCuts() {
    window.addEventListener("keypress", this.onWindowKey);
  }
  deleteShutCuts() {
    this.keyShutCuts.empty();
    window.removeEventListener("keypress", this.onWindowKey);
  }
  onWindowKey(e: KeyboardEvent) {
    for (let i = this.keyShutCuts.length - 1; i >= 0; i--) {
      let k = this.keyShutCuts[i];
      if (
        k.key == e.code &&
        e.altKey == k.alt &&
        e.shiftKey == k.shift &&
        e.ctrlKey == k.conntrol
      )
        k.callback();
    }
  }

  //#endregion

  //公共方法

  public redo() {
    this.editorControlCurrent.redo();
  }
  public undo() {
    this.editorControlCurrent.undo();
  }

  blockOwnerData: BlockEditorOwner = null;

  //子模块状态信息
  isSelectedBlock = false;
  isClipboardFilled = false;
  isMultiSelecting = false;

  selectedBlock: Block = null;
  selectedConnector: Connector = null;

  updateSelectState(s: boolean) {
    this.isSelectedBlock = s;

    if (!this.isMultiSelecting) {
      this.selectedBlock = this.editorControlCurrent.getOneSelectedBlock();
      this.selectedConnector = this.editorControlCurrent.getOneSelectedConnector();
    } else {
      this.selectedBlock = null;
      this.selectedConnector = null;
    }
  }

  //#region 添加单元菜单

  @Watch("showAddBlockPanel")
  onShowAddBlockPanelChanged(newV: boolean) {
    if (!newV && this.editorControlCurrent.isConnectingToNew)
      this.editorControlCurrent.endConnectToNew();
  }

  public allBlocksGrouped: any = [];

  onBlockAddItemClick(block: BlockRegData) {
    this.showAddBlockPanel = false;
    this.editorControlCurrent.userAddBlock(block);
  }

  //添加单元弹出

  showAddBlockPanelPos = new Vector2();
  showAddBlockPanel = false;
  showAddBlockPanelMaxHeight = 500;
  addBlockPanelAddDirectly = false;

  filterByPortDirection: BlockPortDirection = null;
  filterByPortType: BlockParameterType = null;
  filterByPortKeyType: BlockParameterType = null;
  filterSrcPort: BlockPort = null;
  filterByPortCustomType: string = "";

  updateAddBlockPanelFilter(filter: FilterByPortData) {
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
  public showAddBlockPanelAt(
    viewPort: Rect,
    pos: Vector2,
    showAddDirectly = true
  ) {
    this.showAddBlockPanelPos.Set(pos);
    this.showAddBlockPanel = true;
    this.showAddBlockPanelMaxHeight = viewPort.h - pos.y;
    this.addBlockPanelAddDirectly = showAddDirectly;
    if (this.showAddBlockPanelMaxHeight > 500) this.showAddBlockPanelMaxHeight = 500;
    else if (this.showAddBlockPanelMaxHeight < 222) {
      this.showAddBlockPanelPos.y -= 222 - this.showAddBlockPanelMaxHeight;
      this.showAddBlockPanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.AddBlockPanel).focus();
  }
  showAddBlockPanelBar(e: HTMLElement) {
    if (this.currentDocunment != null) {
      this.editorControlCurrent.setNoAddBlockInpos();
      this.clearAddBlockPanelFilter();

      if (this.showAddBlockPanel) this.showAddBlockPanel = false;
      else {
        let absolutePosX = HtmlUtils.getLeft(e);
        let absolutePosY = HtmlUtils.getTop(e);
        this.showAddBlockPanelAt(
          new Rect(0,0,this.$el.clientWidth,this.$el.clientHeight),
          new Vector2(
            absolutePosX + 43,
            absolutePosY + 3
          ),
          false
        );
      }
    }
  }

  //#endregion

  //#region 选择数据类型菜单

  showChooseTypePanel = false;
  showChooseTypePanelPos = new Vector2();
  showChooseTypePanelMaxHeight = 500;
  showChooseTypePanelCanbeExecute = true;
  showChooseTypePanelCallback: ChooseTypePanelCallback = null;

  onChooseTypeItemClick(choosedType: BlockParameterTypeRegData, isBaseType: boolean) {
    if (typeof this.showChooseTypePanelCallback == "function") {
      this.showChooseTypePanel = false;
      this.showChooseTypePanelCallback(choosedType, isBaseType);
    }
  }
  public showChooseTypePanelAt(
    editorControl: BlockDrawer,
    pos: Vector2,
    canbeExecute: boolean
  ) {
    this.showChooseTypePanelPos.Set(pos);
    this.showChooseTypePanel = true;
    this.showChooseTypePanelCanbeExecute = canbeExecute;
    this.showChooseTypePanelMaxHeight = editorControl.getViewPort().h - pos.y;
    if (this.showChooseTypePanelPos.x + 300 > window.innerWidth)
      this.showChooseTypePanelPos.x -=
        this.showChooseTypePanelPos.x + 300 - window.innerWidth;
    if (this.showChooseTypePanelMaxHeight > 500) this.showChooseTypePanelMaxHeight = 500;
    else if (this.showChooseTypePanelMaxHeight < 222) {
      this.showChooseTypePanelPos.y -= 222 - this.showChooseTypePanelMaxHeight;
      this.showChooseTypePanelMaxHeight = 222;
    }
    (<AddPanel>this.$refs.ChooseTypePanel).focus();
  }

  onChooseCustomType(
    pos: Vector2,
    callback: ChooseTypePanelCallback,
    canbeExecute: boolean
  ) {
    this.showChooseTypePanelCallback = callback;
    this.showChooseTypePanelAt(this.editorControlCurrent, pos, canbeExecute);
  }
  onChooseGraphVariableType(
    v: ChooseTypePanelCallback,
    pos: Vector2,
    canbeExecute: boolean
  ) {
    this.showChooseTypePanelCallback = v;
    this.showChooseTypePanelAt(this.editorControlCurrent, pos, canbeExecute);
  }

  //#endregion

  //#region 设置加载与读取

  settings: EditorSettings = {
    gridShow: true,
    drawDebugInfo: false,
    propViewWidth1: 0.8,
    propViewWidth2: 0.28,
    lastIsMaxed: false,
    lastWindowWidth: 0,
    lastWindowHeight: 0,
  };

  private loadSettings() {
    this.settings.drawDebugInfo = SettingsServiceInstance.getSettingsBoolean(
      "drawDebugInfo",
      false
    );
    this.settings.gridShow = SettingsServiceInstance.getSettingsBoolean("gridShow", true);
    this.settings.propViewWidth1 = SettingsServiceInstance.getSettingsNumber(
      "propViewWidth1",
      this.settings.propViewWidth1
    );
    this.settings.propViewWidth2 = SettingsServiceInstance.getSettingsNumber(
      "propViewWidth2",
      this.settings.propViewWidth2
    );
    this.settings.lastIsMaxed = SettingsServiceInstance.getSettingsBoolean(
      "lastIsMaxed",
      this.settings.lastIsMaxed
    );
    this.settings.lastWindowWidth = SettingsServiceInstance.getSettingsNumber(
      "lastWindowWidth",
      this.settings.lastWindowWidth
    );
    this.settings.lastWindowHeight = SettingsServiceInstance.getSettingsNumber(
      "lastWindowHeight",
      this.settings.lastWindowHeight
    );

    if (this.currentRuntimeType == "electron")
      this.platformWork.loadSettings(this.settings);
  }
  private saveSettings() {
    SettingsServiceInstance.setSettingsBoolean(
      "drawDebugInfo",
      this.settings.drawDebugInfo
    );
    SettingsServiceInstance.setSettingsBoolean("gridShow", this.settings.gridShow);
    SettingsServiceInstance.setSettingsNumber(
      "propViewWidth1",
      this.settings.propViewWidth1
    );
    SettingsServiceInstance.setSettingsNumber(
      "propViewWidth2",
      this.settings.propViewWidth2
    );

    if (this.currentRuntimeType == "electron")
      this.platformWork.saveSettings(this.settings);
  }

  private loadDockData() {
    let def = require("../assets/cfgs/dock-default.json");
    let data: any = SettingsServiceInstance.getSettings("dockData", "");
    if (StringUtils.isNullOrEmpty(data)) data = def;
    else data = JSON.parse(data);

    setTimeout(() => {
      (<DockHost>this.$refs.dockLayout).setData(data);
    }, 200);
  }
  private saveDockData() {
    let data = (<DockHost>this.$refs.dockLayout).getSaveData();
    SettingsServiceInstance.setSettings("dockData", JSON.stringify(data));
  }

  //#endregion

  //#region 最近文件

  private recentList: Array<string> = [];

  private loadRecentList() {
    this.platformWork.loadRecentList((data: any) => {
      if (data) {
        this.recentList = data.recentList || [];
        this.recentList.forEach((s) => {
          this.menuItemRecent.childs.unshift(new MenuData(s, () => this.doLoadFile(s)));
        });
      }
    });
  }
  private saveRecentList() {
    this.platformWork.saveRecentList({
      recentList: this.recentList,
    });
  }
  private addToRecentList(s: string) {
    if (!this.recentList.contains(s)) {
      if (this.recentList.length >= 9) this.recentList.pop();
      this.recentList.unshift(s);
      this.menuItemRecent.childs.unshift(new MenuData(s, () => this.doLoadFile(s)));
      this.saveRecentList();
    }
  }
  private getPath(s: string) {
    return StringUtils.getFileName(s);
  }
  private flushRecentList() {
    for (let i = this.menuItemRecent.childs.length - 3; i >= 0; i++)
      this.menuItemRecent.childs.remove(i);
    this.recentList.forEach((l) => {
      this.menuItemRecent.childs.unshift(new MenuData(l, () => this.doLoadFile(l)));
    });
  }

  //#endregion

  //#region 初始化

  private currentRuntimeType: BlockSupportPlatform = "web";
  private platformWork: EditorPlatformWorkAbstract = null;

  private init() {
    let baseLoading = document.getElementById("base-loading");
    if (baseLoading) HtmlUtils.hideElement(baseLoading);

    if (process.env.EDITOR_ENV == "electron") {
      console.log('Running in electron');
      this.showControlButtons = true;
      this.currentRuntimeType = "electron";
      this.platformWork = new EditorPlatformWorkElectron();

      window.onbeforeunload = () => {
        this.saveSettings();
      };
    } else if (
      process.env.EDITOR_ENV == "web" ||
      StringUtils.isNullOrEmpty(process.env.EDITOR_ENV)
    ) {
      this.currentRuntimeType = "web";
      this.platformWork = new EditorPlatformWorkWeb();

      window.onbeforeunload = () => {
        this.saveSettings();
        return "确认离开当前页面吗？未保存的数据将会丢失";
      };
    }

    this.platformWork.init();
    this.platformWork.editorNotifyCallback((type, data, callback) => {
      switch(type) {
        case 'windowIsMax':
          this.windowIsMax = data;
          break;
        case 'quitSaveCallback':
          if(this.anyDocNotSave()) {
            this.$confirm("在退出之前你希望保存所有文件的修改吗？\n如果你不保存，你对文件的修改都将丢失！点击右上角的“×”取消退出程序。", "保存提示", {
              type: 'warning',
              cancelButtonText: '不保存退出',
              confirmButtonText: '保存并退出',
              cancelButtonClass: 'el-button--danger',
            }).then((d : MessageBoxData) => {
              if(d === 'confirm')
                this.closeAndSaveAllDoc(() => callback());
            }).catch((d : MessageBoxData) => {
              if(d === 'cancel') 
                callback();
            });
          } else callback();
          break;
      }
    })
    this.parser = new BlockFileParser();

    this.loadSettings();
    this.initMenu();
    this.initEditorRunner();
    this.initEditorWorkProvider();
    this.loadRecentList();

    BlockServiceInstance.init();
    BlockServiceInstance.setIsEditorMode(true);
    BlockServiceInstance.setAllBlocksGrouped(this.allBlocksGrouped);
    BlockServiceInstance.setCurrentPlatform(this.currentRuntimeType);
    BlockRegister.registerAll();
    ParamTypeServiceInstance.init();
    BlockServiceInstance.updateBlocksList();

    this.initShutCuts();

    setTimeout(() => {
      this.showIntro = false;
      this.loadDockData();
      setTimeout(() => (this.showIntroE = false), 300);
    }, 1000);
  }
  private destroy() {
    this.deleteShutCuts();
    this.saveSettings();
    this.saveRecentList();
    this.saveDockData();
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

  //#region Electron窗口附加控制

  windowIsMax = false;

  windowControl(act: string) {
    this.platformWork.windowControl(act);
  }

  //#endregion

  //#region 编辑器功能提供者
  //=======================

  alertModals: Array<AlertDialogData> = [];

  onAlertModalClose(dialog: AlertDialogData) {
    dialog.display = false;
    if (typeof dialog.callback === "function") dialog.callback();
    this.alertModals.remove(dialog);
  }

  initEditorWorkProvider() {
    let _this = this;
    DebugWorkProviderInstance.ModalProvider = (
      level: string,
      title: string,
      text: string,
      okCallback: VoidFunction
    ) => {
      this.alertModals.push({
        title: title,
        text: text,
        level: level,
        callback: okCallback,
        display: true,
      });
    };
    DebugWorkProviderInstance.ConfirmModalProvider = (
      title: string,
      text: string,
      okCallback: () => void,
      cancelCallback: () => void
    ) => {
      this.$confirm(text, title, {
        type: 'warning'
      })
      .then(() => okCallback())
      .catch(() => cancelCallback());
    };
  }

  //#endregion

  //#region 文件保存写入控制

  showDropChangesModal = false;
  dropChangesCallback = (save : boolean) => {};
  showLoadFailedModal = false;
  showLoadFailedModalContent = "";

  public parser: BlockFileParser = null;

  private editorControlCurrent: BlockDrawer = null;
  private editorControls: Array<BlockDrawer> = [];

  public openedDocunments: Array<BlockDocunment> = [];
  public currentDocunment: BlockDocunment = null;

  private newFile() {
    let doc = new BlockDocunment("新文档");
    doc.isEditor = true;
    doc.mainGraph.isEditor = true;
    doc.currentGraph = doc.mainGraph;
    this.goDoc(doc);

    let that = this;
    setTimeout(() => that.goGraph(doc.mainGraph), 500);
  }

  private getCurrentEditor(g: BlockGraphDocunment) {
    return <BlockDrawer>(<any>this.$refs["BlockDrawer_" + g.docunment.uid])[0];
  }
  private getCurrentDocEditor(g: BlockDocunment) {
    return <BlockDrawer>(<any>this.$refs["BlockDrawer_" + g.uid])[0];
  }
  private getOpenedDocunmentsByUid(uid: string) {
    for(let i = 0; i < this.openedDocunments.length; i++) {
      if(this.openedDocunments[i].uid === uid) 
        return this.openedDocunments[i];
    }
    return null;
  }

  public goDoc(g: BlockDocunment) {
    if (g != this.currentDocunment) {
      this.currentDocunment = g;
      if (!this.openedDocunments.contains(g)) this.openedDocunments.push(g);
    }
  }
  public goGraph(g: BlockGraphDocunment) {
    this.getCurrentEditor(g).goGraph(g);
  }

  public anyDocNotSave() {
    for(let i = 0; i < this.openedDocunments.length; i++) {
      if(this.openedDocunments[i].fileChanged) 
        return true;
    }
    return false;
  }
  public closeAndSaveAllDoc(callback: Function) {
    let close = () => {
      if (this.openedDocunments.length > 0) {
        this.closeDoc(this.openedDocunments[0], (con: boolean) => {
          if (con) close();
          else callback(false);
        });
      } else callback(true);
    };
    close();
  }
  public closeDoc(g: BlockDocunment, callback?: Function) {
    let doClose = (g: BlockDocunment) => {
      let oldIndex = this.openedDocunments.indexOf(g);
      this.openedDocunments.remove(g);
      if (this.currentDocunment == g) {
        this.currentDocunment =
          oldIndex > 0
            ? this.openedDocunments[oldIndex - 1]
            : this.openedDocunments.length > 0
            ? this.openedDocunments[0]
            : null;
      }
      if (typeof callback == "function") callback(true);
      logger.log("Docunment " + g.name + " closed.");
    };
    if (this.openedDocunments.contains(g)) {
      if (g.fileChanged) {
        this.$confirm("你想保存文件 " + g.name + " 的修改吗？\n如果你不保存，你对此文件的修改都将丢失！点击右上角的“×”取消关闭。", "保存提示", {
          type: 'warning',
          cancelButtonText: '不保存关闭',
          confirmButtonText: '保存并关闭',
          cancelButtonClass: 'el-button--danger',
        }).then((d : MessageBoxData) => {
          if(d === 'confirm') {
            this.saveDoc(g, (saved: boolean) => {
              if (saved) doClose(g);
            });
          } else if(d === 'close')
            if (typeof callback == "function") callback(false);
        }).catch((e : MessageBoxData) => {
          
          if(e === 'cancel') 
            doClose(g);
        });
      } else doClose(g);
    }
  }

  /**
   * 导出文档到json
   */
  public saveJson(g: BlockDocunment) {
    
  }
  /**
   * 保存文档
   */
  public saveDoc(g: BlockDocunment, callback?: Function) {
    //保存基础数据
    this.getCurrentDocEditor(g).saveViewPort();

    //electron
    if (this.currentRuntimeType == "electron") {
      //如果文件路径为空，则询问用户保存位置
      if (CommonUtils.isNullOrEmpty(g.path)) {
        this.platformWork.saveFileDialog(g.name, (path) => {
          if (path) {
            g.path = path;
            this.saveDoc(g, callback); //如果用户选择了路径，则重新调用保存
          }
        });
        return;
      }
      //保存文件
      logger.log("Saving : " + g.path);

      //加载提示
      let toast = this.$toasted.show("正在保存中，请稍后...", {
        duration: null,
        closeOnSwipe: false,
        position: "top-center",
      });

      let str = this.parser.saveToString(this.currentDocunment, true);
      this.platformWork.writeFile(g.path, str, () => {
        logger.log("Save file : " + this.getPath(g.path) + " success.");
        if (typeof callback == "function") callback(true);

        toast.goAway();
        g.fileChanged = false;
        this.$toasted.success("保存文档成功", { duration: 1000, position: 'top-center' });
      });

      //网页保存
    } else if (this.currentRuntimeType == "web") {
      let str = this.parser.saveToString(this.currentDocunment, true);
      CommonUtils.exportRaw(this.currentDocunment.name + ".json", str);
      g.fileChanged = false;
      if (typeof callback == "function") callback(true);
    }
  }
  /**
   * 打开文件
   */
  public loadFile() {
    this.platformWork.openFileDialog((paths, files) => {
      if (paths) {
        paths.forEach((path) => {
          //添加到最近列表
          this.addToRecentList(path);
          //加载文件
          this.doLoadFile(path);
        });
      } else if (files) {
        files.forEach((file) => {
          let reader = new FileReader();
          //加载文件
          reader.readAsText(file, "UTF-8");
          reader.onload = (e) => {
            this.doLoadFileToGraph(e.target.result.toString(), file.path || file.name);
          };
        });
      }
    });
  }

  private doLoadFile(path: string) {
    let g = this.isFileOpened(path);
    if (g == null) {
      //加载提示
      let toast = this.$toasted.show("文档正在载入中，请稍后...", {
        duration: null,
        closeOnSwipe: false,
        position: "top-center",
      });

      //读取文件
      logger.log("Loading file : " + path);

      this.platformWork.readFile(path, (err, data) => {
        toast.goAway(); //关闭土司
        if (err) {
          logger.error("Load file failed : " + path + "\n" + err);
          this.showLoadFailedModal = true;
          this.showLoadFailedModalContent = "加载错误：" + err;
        } else this.doLoadFileToGraph(data, path);
      });
    } else {
      this.goDoc(g);
      setTimeout(() => {
        this.goGraph(g.mainGraph);
      }, 100);
    }
  }
  private doLoadFileToGraph(data: string, path: string) {
    let errRet = (e: string) => {
      this.showLoadFailedModal = true;
      this.showLoadFailedModalContent = e;
    };
    let doc = new BlockDocunment();
    let ret = null;
    try {
      doc.path = path;
      ret = this.parser.loadFromString(data, doc, true);
    } catch (e) {
      errRet("发生了错误：" + e);
      console.error(e);
      logger.error("File load failed : " + e);
      return;
    }
    if (ret === -1) errRet("加载的文件是一个空文件");
    else if (ret === -2) errRet("加载的文件是不是有效的JSON格式，这表示文件可能已经损坏");
    else {
      this.goDoc(doc);

      //跳转
      setTimeout(() => this.goGraph(doc.mainGraph), 400);

      logger.log("File loaded : " + this.getPath(path));
    }
  }

  /**
   * 文件是否已经打开
   */
  public isFileOpened(path: string): BlockDocunment | null {
    for (let i = 0; i < this.openedDocunments.length; i++) {
      if (this.openedDocunments[i].path == path) return this.openedDocunments[i];
    }
    return null;
  }

  //关闭回调
  public onEditorMainTabClose(data: DockPanelData) {
    let uid = data.key.substring(4);
    let doc = this.getOpenedDocunmentsByUid(uid);
    if(doc) this.closeDoc(doc);
  }
  //删除回调
  public onDeleteGraph(g: BlockGraphDocunment) {
    if (g.isMainGraph) return;

    let editor = this.getCurrentEditor(g);
    if (g == editor.getCurrentGraph()) editor.goGraph(g.parent);
    editor.doDeleteGraph(g);
  }
  public onGoDoc(g: BlockDocunment) {
    if (this.currentDocunment != g) this.goDoc(g);
  }

  onDocEditorCreated(e: BlockDrawer) {
    this.editorControls.push(e);
    if (e.docunment == this.currentDocunment)
      this.editorControlCurrent = e.docunment.currentEditor;
  }
  onDocEditorDestroyed(e: BlockDrawer) {
    this.editorControls.remove(e);
  }
  @Watch("currentDocunment")
  onCurrentDocunmentChanged(g: BlockDocunment) {
    if (g) this.editorControlCurrent = g.currentEditor;
    this.updateFileMenuState();
  }

  //#endregion

  //#region 调试运行控制

  private startBlock: BlockEditor = null;
  private runner: BlockRunner = null;
  private runnerStopByBreakPoint = false;
  private runningState: EditorRunningState = "editing";
  private runningBlock: BlockEditor = null;

  private initEditorRunner() {
    this.runner = new BlockRunner();
    this.runner.onRunnerEnd = this.onRunnerEnd.bind(this);
    this.runner.onRunnerIdle = this.onRunnerIdle.bind(this);
    this.runner.onRunnerBreakPoint = this.onRunnerBreakPoint.bind(this);
  }
  private onRunnerEnd() {
    this.runningState = "editing";
    this.runnerStopByBreakPoint = false;
    this.runner.stepMode = false;

    setTimeout(() => {
      this.editorControls.forEach((element) => element.clearAllBlockDebugStyles());
    }, 300);

    console.log("[DebugRunner] 脚本已经运行完成");
  }
  private onRunnerIdle() {}
  private onRunnerBreakPoint(currentPort: BlockPort, block: Block) {
    this.runnerStopByBreakPoint = true;
    this.runningState = "runningPaused";
    this.runningBlock = <BlockEditor>block;
    this.runningBlock.markBreakPointActiveState(true);
  }

  public getRunningState() {
    return this.runningState;
  }

  showRunFailedModal = false;
  showRunFailedModalContent = "";

  public startRun() {
    if (this.runningState == "editing" || this.runningState == "runningPaused") {
      //断点暂停，继续运行
      if (this.runnerStopByBreakPoint) {
        this.runner.stepMode = false;
        this.runner.start();
        this.runningState = "running";
        this.runnerStopByBreakPoint = false;
      } else {
        //开始执行文档
        if (this.runner.executeStart(this.currentDocunment)) {
          this.runningState = "running";
          console.log("[DebugRunner] 开始运行脚本");
        } else {
          this.showRunFailedModal = true;
          this.showRunFailedModalContent = this.runner.lastError;
        }
      }
      return true;
    }
    return false;
  }
  public startRunAndStepNext() {
    if (this.runningState == "editing") {
      if (this.startRun()) this.runner.stepMode = true;
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

    if (this.runningBlock != null) {
      this.runningBlock.markBreakPointActiveState(false);
    }
  }

  showDevtoolsTipModal = false;

  public openConsole() {
    if (this.currentRuntimeType == "electron")
      this.platformWork.editorAction("main-act-toggle-devtools");
    else {
      this.showDevtoolsTipModal = true;
    }
  }

  disableAllBreakPoint() {
    this.editorControlCurrent.enableOrdisableAllBreakPoint("disable");
  }
  enableAllBreakPoint() {
    this.editorControlCurrent.enableOrdisableAllBreakPoint("enable");
  }

  //#endregion

  showAboutModal = false;

  showAbout() { this.showAboutModal = true; }
  showHelp() {}
}

interface AlertDialogData {
  title: string;
  text: string;
  level: string;
  callback: VoidFunction;
  display: boolean;
}
</script>
