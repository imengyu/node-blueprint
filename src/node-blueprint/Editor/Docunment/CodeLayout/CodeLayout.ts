import { reactive, type VNode } from "vue";
import { LateClass } from "./Composeable/LateClass";
import type { CodeLayoutLangDefine } from "./Language";

/**
 * Layout Type Definition
 */
export interface CodeLayoutConfig {
  primarySideBarSwitchWithActivityBar: boolean,
  primarySideBarPosition: 'left'|'right',
  primarySideBarWidth: number,
  primarySideBarMinWidth: number,
  secondarySideBarWidth: number,
  secondarySideBarMinWidth: number,
  bottomPanelHeight: number,
  bottomPanelMinHeight: number,
  bottomAlignment: 'left'|'center'|'right'|'justify',
  activityBarPosition: 'side'|'top'|'hidden',
  panelHeaderHeight: number,
  panelMinHeight: number,
  titleBar: boolean,
  titleBarShowCustomizeLayout: boolean,
  activityBar: boolean,
  primarySideBar: boolean,
  secondarySideBar: boolean,
  bottomPanel: boolean,
  statusBar: boolean,
  menuBar: boolean,

  //Events

  onResetDefault?: () => void;
  onStartDrag?: (panel: CodeLayoutPanelInternal) => boolean;
  onEndDrag?: (panel: CodeLayoutPanelInternal) => void;
  onDropToGrid?: (panel: CodeLayoutPanelInternal, grid: CodeLayoutGrid) => boolean;
  onDropToPanel?: (
    reference: CodeLayoutPanelInternal,
    referencePosition: CodeLayoutDragDropReferencePosition, 
    panel: CodeLayoutPanelInternal, 
    dropTo: 'normal'|'empty'|'tab-header'|'activiy-bar'
  ) => boolean;
  onGridFirstDrop?: (grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) => CodeLayoutPanelInternal;
  onGridEmpty?: (grid: CodeLayoutGrid) => void;
  onNoAutoShinkTabGroup?: (group: CodeLayoutPanelInternal) => void,
  onNoAutoShinkNormalGroup?: (group: CodeLayoutPanelInternal) => void,
}
/**
 * Language Layout Definition
 */
export interface CodeLayoutLangConfig {
  /**
   * Language of component
   */
  lang: string,
  /**
   * Override some strings of current language.
   * 
   * * The complete list can be viewed in source code Language/en.ts
   */
  stringsOverride?: Partial<CodeLayoutLangDefine>,
}

/**
 * Default CodeLayoutConfig
 */
export const defaultCodeLayoutConfig : CodeLayoutConfig = {
  primarySideBarSwitchWithActivityBar: true,
  primarySideBarPosition: "left",
  primarySideBarWidth: 20,
  primarySideBarMinWidth: 170,
  activityBarPosition: "side",
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
  secondarySideBar: false,
  bottomPanel: true,
  statusBar: true,
  menuBar: true,
}

//用户接口定义

export type CodeLayoutGrid = 'primarySideBar'|'secondarySideBar'|'bottomPanel'|'centerArea'|'none';

export type CodeLayoutPanelCloseType = 'unSave'|'close'|'none';

/**
 * Instance of CodeLayout.
 * 
 * Can use like this:
 * ```
 * const codeLayout = ref<CodeLayoutInstance>(); 
 * codeLayout.value.addGroup(...);
 * ```
 */
export interface CodeLayoutInstance {
  /**
   * Get panel instance by name.
   * @param name The pance name.
   */
  getPanelByName(name: string): CodeLayoutPanelInternal | undefined,
  /**
   * Add top level group to layout.
   * @param panel Group define.
   * @param target Target grid.
   * @returns Group instance.
   */
  addGroup: (panel: CodeLayoutPanel, target: CodeLayoutGrid) => CodeLayoutPanelInternal;
  /**
   * Remove top level group from layout.
   * @param panel Group instance.
   */
  removeGroup(panel: CodeLayoutPanelInternal): void;
  /**
   * Get the internal root grid instance.
   * @param target Grid name.
   */
  getRootGrid(target: CodeLayoutGrid): CodeLayoutGridInternal,
  /**
   * Force relayout all group.
   * @returns 
   */
  relayoutAll: () => void;
  /**
   * Force relayout a group.
   * @param name Group name.
   */
  relayoutGroup(name: string): void;
  /**
   * Save current layout to JSON data.
   */
  saveLayout(): any;
  /**
   * Clear all panels.
   */
  clearLayout(): void;
  /**
   * Load the previous layout from JSON data, will clear all panels,
   * instantiatePanelCallback will sequentially call all panels, where you can process panel data.
   * @param json json data from `saveLayout`.
   * @param instantiatePanelCallback process layout data panel.
   */
  loadLayout(json: any, instantiatePanelCallback: (data: CodeLayoutPanel) => CodeLayoutPanel): void;
}

//内部类定义

export interface CodeLayoutPanelHosterContext {
  panelInstances: Map<string, CodeLayoutPanelInternal>;
  removePanelInternal(panel: CodeLayoutPanelInternal): undefined|CodeLayoutPanelInternal;
  closePanelInternal(panel: CodeLayoutPanelInternal): void;
}

export class CodeLayoutPanelInternal extends LateClass implements CodeLayoutPanel {

  public constructor(context: CodeLayoutPanelHosterContext) {
    super();
    this.context = context;
  }

  context: CodeLayoutPanelHosterContext;
  /**
   * Title of this panel.
   * 
   * * Display in header.
   */
  title = '';
  /**
   * Name of this panel.
   * 
   * You can obtain an instance of a panel using this name in the `CodeLayout.getPanelByName` instance method. 
   * 
   * * This name needs to be unique in a CodeLayout/SplitLayout.
   */
  name = '';
  /**
   * Open state of this panel.
   * 
   * * Only used in CodeLayout. 
   * In SplitLayout, all panels are always in open state.
   */
  open = false;
  /**
   * Set user can resize this panel.
   * 
   * * Only used in CodeLayout.
   */
  resizeable = false;
  visible = true;
  showBadge = true;
  /**
   * Size of this panel.
   * 
   * * In CodeLayout, it's pixel size.
   * * In SplitLayout, it's percentage size.
   */
  size = 0;
  /**
   * Child panel of this grid.
   */
  children : CodeLayoutPanelInternal[] = [];
  /**
   * Active child of this grid.
   * 
   * * Use in Tab
   */
  activePanel: CodeLayoutPanelInternal|null = null;
  /**
   * Parent grid instance of this panel.
   */
  parentGroup: CodeLayoutPanelInternal|null = null;
  /**
   * Parent toplevel grid name of this panel.
   */
  parentGrid: CodeLayoutGrid = 'none';
 
  tooltip?: string;
  badge?: string|(() => VNode)|undefined;
  accept?: CodeLayoutGrid[];
  preDropCheck?: (
    dropPanel: CodeLayoutPanel, 
    targetGrid: CodeLayoutGrid,
    referencePanel?: CodeLayoutPanel|undefined,
    referencePosition?: CodeLayoutDragDropReferencePosition|undefined,
  ) => boolean;
  tabStyle?: CodeLayoutPanelTabStyle;
  noAutoShink = false;
  noHide = false;
  minSize?: number|undefined;
  startOpen?: boolean|undefined;
  iconLarge?: string|(() => VNode)|undefined;
  iconSmall?: string|(() => VNode)|undefined;
  closeType: CodeLayoutPanelCloseType = 'none';
  actions?: CodeLayoutActionButton[]|undefined;
  data?: any = undefined;

  //Public

  /**
   * Add child panel to this grid.
   * @param panel Child panel
   * @param startOpen Is the sub panel in an open state
   * @returns Child panel instance
   */
  addPanel(panel: CodeLayoutPanel, startOpen = false) {
    const panelInternal = panel as CodeLayoutPanelInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);
    if (this.context.panelInstances.has(panelInternal.name))
      throw new Error(`A panel named ${panel.name} already exists`);
  
    const panelResult = reactive(new CodeLayoutPanelInternal(this.context));
    Object.assign(panelResult, panel);
    panelResult.open = panel.startOpen ?? false;
    panelResult.size = panel.size ?? 0;
    panelResult.accept = panel.accept ?? this.accept;
    panelResult.parentGrid = this.parentGrid;
    this.addChild(panelResult as CodeLayoutPanelInternal);
  
    if (startOpen || panel.startOpen)
      panelResult.openPanel();
  
    this.context.panelInstances.set(panelInternal.name, panelResult as CodeLayoutPanelInternal);
  
    return panelResult;
  }
  /**
   * Remove panel from this group.
   * @param panel Panel instance.
   * @returns 
   */
  removePanel(panel: CodeLayoutPanelInternal) {
    if (panel.parentGroup !== this)
      throw new Error(`Panel ${panel.name} is not child of this group !`);
    this.context.removePanelInternal(panel);
    this.context.panelInstances.delete(panel.name);
    return panel;
  }
  /**
   * Open this panel.
   * @param closeOthers 
   */
  openPanel(closeOthers = false) {
    if (this.parentGroup) {
      const group = this.parentGroup;
      group.activePanel = this;
      if (closeOthers)
        group.children.forEach(p => p.open = false);
      this.open = true;
    } else {
      throw new Error(`Panel ${this.name} has not in any container, can not active it.`);
    } 
  }
  /**
   * Close this panel.
   */
  closePanel() {
    if (this.parentGroup) {
      const group = this.parentGroup;
      this.parentGroup.reselectActiveChild();
      group.open = false;
    } else {
      throw new Error(`Panel ${this.name} has not in any container, can not active it.`);
    } 
  }
  /**
   * Toggle open state of this panel.
   * @returns Return new open state
   */
  togglePanel() {
    if (this.parentGroup) {
      const group = this.parentGroup;
      this.parentGroup.activePanel = this;
      group.open = !group.open;
      return group.open;
    } else {
      throw new Error(`Panel ${this.name} has not in any container, can not active it.`);
    } 
  }

  /**
   * Remove the current panel/grid from its parent and 
   * trigger automatic shrink/merge operations.
   * @returns 
   */
  removeSelfWithShrink() {
    return this.context.removePanelInternal(this);
  }
  /**
   * Set activePanel.
   * @param child 
   */
  setActiveChild(child: CodeLayoutPanelInternal) {
    this.activePanel = child;
  }
  /**
   * Auto set activePanel.
   */
  reselectActiveChild() {
    this.activePanel = this.children.find((p) => p.visible) || null;
  }
  /**
   * Set parent activePanel to self.
   */
  activeSelf() {
    if (this.parentGroup)
      this.parentGroup.activePanel = this;
  }
  /**
   * Get grid hoster container size (pixel).
   * @returns 
   */
  getContainerSize() {
    return this.lastRelayoutSize;
  }
  /**
   * Notify hoster container force relayot.
   */
  notifyRelayout() {
    this.pushLateAction('notifyRelayout');
  }
  /**
   * Notify hoster container there has new grids was added and needs to relayout.
   * 
   * * This method is called internally, and generally you do not need to use this method.
   * @param panels New panels
   * @param referencePanel Drop grid.
   */
  relayoutAllWithNewPanel(panels: CodeLayoutPanelInternal[], referencePanel?: CodeLayoutPanelInternal) {
    this.pushLateAction('relayoutAllWithNewPanel', panels, referencePanel);
  }
  /**
   * Notify hoster container there has grids was removed and needs to relayout.
   * 
   * * This method is called internally, and generally you do not need to use this method.
   * @param panel Removed panel.
   */
  relayoutAllWithRemovePanel(panel: CodeLayoutPanelInternal) {
    this.pushLateAction('relayoutAllWithRemovePanel', panel);
  }
  /**
   * Notify hoster container to relayout when container size changed.
   * 
   * * This method is called internally, and generally you do not need to use this method.
   * @param resizedContainerSize 
   */
  relayoutAllWithResizedSize(resizedContainerSize: number) {
    this.pushLateAction('relayoutAllWithResizedSize', resizedContainerSize);
  }

  //Internal
  //These methods is called internally, and you do not need to use them.

  addChild(child: CodeLayoutPanelInternal, index?: number) {
    if (this.name === child.name)
      throw new Error('Try add self');
    if (typeof index === 'number')
      this.children.splice(index, 0, child);
    else
      this.children.push(child);
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
    if (!this.activePanel)
      this.activePanel = child;
  }
  addChilds(childs: CodeLayoutPanelInternal[], startIndex?: number) {
    if (typeof startIndex === 'number')
      this.children.splice(startIndex, 0, ...childs);
    else
      this.children.push(...childs);
    for (const child of childs) {
      if (this.name === child.name)
        throw new Error('Try add self');
      child.parentGroup = this;
      child.parentGrid = this.parentGrid;
    }
    if (!this.activePanel)
      this.activePanel = this.children[0];
  }
  removeChild(child: CodeLayoutPanelInternal) {
    this.children.splice(this.children.indexOf(child), 1);
    child.parentGroup = null;
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (child.name === this.activePanel?.name)
      this.reselectActiveChild();
  }
  replaceChild(oldChild: CodeLayoutPanelInternal, child: CodeLayoutPanelInternal) {
    this.children.splice(
      this.children.indexOf(oldChild), 
      1, 
      child);   
    oldChild.parentGroup = null;
    //如果被删除面板是激活面板，则选另外一个面板激活
    if (this.activePanel?.name === oldChild.name)
      this.activePanel = child;
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  hasChild(child: CodeLayoutPanelInternal) {
    return this.children.includes(child);
  }

  lastRelayoutSize = 0;
  lastLayoutSizeCounter = 0;

  getIsTabContainer() {
    return this.tabStyle === 'text' || this.tabStyle === 'icon';
  }
  getIsTopGroup() {
    return !this.parentGroup
  }
  getIsInTab() {
    return this.parentGroup?.getIsTabContainer() ?? false;
  }
  getParent() : CodeLayoutPanelInternal|null {
    return this.parentGroup;
  }
  getIndexInParent() {
    if (this.parentGroup)
      return this.parentGroup.children.indexOf(this) ?? 0;
    return this.getParent()?.children.indexOf(this) ?? 0;
  }
  getLastChildOrSelf() {
    return this.children.length > 0 ? 
      this.children[this.children.length - 1] 
      : this;
  }
  getFlatternChildOrSelf() {
    return this.children.length > 0 ? this.children : [ this ];
  }

  toJson() : any {
    return {
      name: this.name,
      open: this.open,
      resizeable: this.resizeable,
      visible: this.visible,
      showBadge: this.showBadge,
      size: this.size,
      children: this.children.map(p => p.toJson()),
    }
  }
  loadFromJson(json: any)  {
    this.name = json.name;
    this.open = json.open;
    this.resizeable = json.resizeable;
    this.visible = json.visible;
    this.showBadge = json.showBadge;
    this.size = json.size;
  }
}
export class CodeLayoutGridInternal extends CodeLayoutPanelInternal {

  public constructor(
    name: CodeLayoutGrid,
    tabStyle: CodeLayoutPanelTabStyle,
    context: CodeLayoutPanelHosterContext,
    onSwitchCollapse: (open: boolean) => void,
  ) {
    super(context);
    this.name = name;
    this.tabStyle = tabStyle;
    this.parentGrid = name;
    this.onSwitchCollapse = onSwitchCollapse;
  }

  private onSwitchCollapse?: (open: boolean) => void;

  /**
   * Expand or collapse the current grid.
   * @param open 
   */
  collapse(open: boolean) {
    this.onSwitchCollapse?.(open);
  }
}

export type CodeLayoutPanelTabStyle = 'none'|'single'|'text'|'icon'|'hidden';

/**
 * Panel User Type Definition
 */
export interface CodeLayoutPanel {
  /**
   * Title of this panel.
   * 
   * * Display in header.
   */
  title: string;
  /**
   * Tooltip of this panel.
   */
  tooltip?: string;
  /**
   * Name of this panel.
   * 
   * You can obtain an instance of a panel using this name in the `CodeLayout.getPanelByName` instance method. 
   * 
   * * This name needs to be unique in a CodeLayout/SplitLayout.
   */
  name: string;
  /**
   * Badge of this panel.
   */
  badge?: string|(() => VNode)|undefined;
  /**
   * Show panel?
   * 
   * * Only used in CodeLayout.
   */
  visible?: boolean;
  /**
   * Show badge?
   */
  showBadge?: boolean;

  /**
   * Set which grids the current panel can be dragged and dropped onto.
   */
  accept?: CodeLayoutGrid[];
  /**
   * Custom check callback before this panel drop.
   * @param dropPanel The panel being prepared for drop.
   * @param targetGrid Target grid.
   * @param referencePanel Drop reference panel.
   * @param referencePosition Place position relative to the reference panel.
   * @returns Return true to allow user drop, false to reject.
   */
  preDropCheck?: (
    dropPanel: CodeLayoutPanel, 
    targetGrid: CodeLayoutGrid,
    referencePanel?: CodeLayoutPanel|undefined,
    referencePosition?: CodeLayoutDragDropReferencePosition|undefined,
  ) => boolean;

  /**
   * Set tab style of this grid.
   * 
   * * Only used in CodeLayout.
   * 
   * Tab style:
   * * none: No tab control.
   * * single: Used internal.
   * * text: Tab control and header only show text.
   * * icon: Tab control and header only show icon.
   * * hidden: Has tab control but tab header was hidden.
   * 
   * Default: 'none'
   */
  tabStyle?: CodeLayoutPanelTabStyle;
  /**
   * Set whether the current grid triggers its own remove/merge 
   * operation after all subpanels/grids are removed.
   * 
   * Set to true will keep grid display, even if it does not have child panels/grids.
   * 
   * Default: false
   */
  noAutoShink?: boolean;
  /**
   * Set whether users cannot hide this panel.
   * 
   * * Only used in CodeLayout.
   * 
   * Default: false
   */
  noHide?: boolean;
  /**
   * Size of this panel.
   * 
   * * In CodeLayout, it's pixel size.
   * * In SplitLayout, it's percentage size.
   */
  size?: number|undefined;
  /**
   * Min size of this gird/panel. (In pixel)
   */
  minSize?: number|undefined;
  /**
   * Is the sub panel in an open state when added to a grid.
   * 
   * * Only used in CodeLayout.
   */
  startOpen?: boolean|undefined;
  /**
   * Icon of this panel (Large, render in ActionBar).
   */
  iconLarge?: string|(() => VNode)|undefined;
  /**
   * Icon of this panel (Small, render in TabBar, Header).
   */
  iconSmall?: string|(() => VNode)|undefined;
  /**
   * Set close button type of this panel.
   * 
   * * Only used in SplitLayout.
   * 
   * Type:
   * * unSave: A dot remind users that file are not save (⚪).
   * * close: Normal close button (X).
   * * none: No close button.
   * 
   * Default: 'none'
   */
  closeType?: CodeLayoutPanelCloseType|undefined;
  /**
  * Custom user actions.
  * 
  * * Only used in CodeLayout.
  */
  actions?: CodeLayoutActionButton[]|undefined;
  /**
   * Custom data attached to the current panel.
   */
  data?: any;
}
/**
 * Panel Action button Type Definition
 */
export interface CodeLayoutActionButton {
  name?: string,
  /**
   * Render this action button by yourself.
   */
  render?: (() => VNode)|undefined,
  icon?: string|(() => VNode),
  text?: string,
  tooltip?: string,
  tooltipDirection?: 'left'|'top'|'right'|'bottom',
  /**
   * Click callback
   * @returns 
   */
  onClick?: () => void,
}

//运行时类型定义
export type CodeLayoutDragDropReferencePosition = ''|'up'|'down'|'left'|'right'|'center'|'';

export interface CodeLayoutContext {
  dragDropToGrid: (grid: CodeLayoutGrid, panel: CodeLayoutPanelInternal) => void,
  dragDropToPanelNear: (
    reference: CodeLayoutPanelInternal, 
    referencePosition: CodeLayoutDragDropReferencePosition, 
    panel: CodeLayoutPanelInternal, 
    dropTo: 'normal'|'empty'|'tab-header'|'activiy-bar',
  ) => void,
  relayoutAfterToggleVisible: (panel: CodeLayoutPanelInternal) => void,
  relayoutTopGridProp: (grid: CodeLayoutGrid, visible: boolean) => void,
  instance: CodeLayoutInstance;
}
