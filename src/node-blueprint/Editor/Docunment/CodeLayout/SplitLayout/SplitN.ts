import { reactive, type Ref } from "vue";
import { CodeLayoutGridInternal, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext, type CodeLayoutPanel, type CodeLayoutDragDropReferencePosition } from "../CodeLayout";


export interface CodeLayoutSplitNGrid extends Omit<CodeLayoutPanel, 'title'> {
  /**
   * Set whether users can close the current panel by continuously shrinking it.
   * 
   * Default: false
   */
  canMinClose?: boolean;
}

/**
 * Panel type definition of SplitLayout.
 */
export class CodeLayoutSplitNPanelInternal extends CodeLayoutPanelInternal {

  public constructor(context: CodeLayoutPanelHosterContext) {
    super(context);
    this.open = true;
  }

  /**
   * Panel in SplitLayout always open, no need to call the open method.
   */
  openPanel(): void {
    throw new Error('SplitLayout panel can only close');
  }
  /**
   * Close this panel.
   * 
   * This method will trigger panelClose event in SplitLayout.
   */
  closePanel(): void {
    this.context.closePanelInternal(this);
  }
}
/**
 * Grid type definition of SplitLayout.
 */
export class CodeLayoutSplitNGridInternal extends CodeLayoutGridInternal implements CodeLayoutSplitNGrid {

  public constructor(context: CodeLayoutPanelHosterContext) {
    super('centerArea', 'text', context, () => {});
    this.open = true;
  }

  canMinClose = false;
  /**
   * Layout direction. 
   */
  direction: 'vertical'|'horizontal' = 'vertical';
  /**
   * Child drid of this grid.
   */
  childGrid : CodeLayoutSplitNGridInternal[] = [];

  //Public

  addGrid(panel: CodeLayoutSplitNGrid) {
    const panelInternal = panel as CodeLayoutSplitNGridInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);

  
    const panelResult = reactive(new CodeLayoutSplitNGridInternal(this.context));
    Object.assign(panelResult, panel);
    panelResult.open = panel.startOpen ?? false;
    panelResult.size = panel.size ?? 0;
    panelResult.accept = panel.accept ?? this.accept;
    panelResult.parentGrid = this.parentGrid;
    panelResult.direction = this.direction === 'vertical' ? 'horizontal' : 'vertical';
    this.addChildGrid(panelResult as CodeLayoutSplitNGridInternal);
    return panelResult as CodeLayoutSplitNGridInternal;
  }
  removeGrid(panel: CodeLayoutSplitNGrid) {
    const panelInternal = panel as CodeLayoutSplitNGridInternal;
    if (panelInternal.parentGroup !== this)
      throw new Error(`Panel ${panel.name} is not child of this group !`);
    this.removeChildGrid(panelInternal);
    return panel;
  }
  addPanel(panel: CodeLayoutPanel) {
    const panelInternal = panel as CodeLayoutPanelInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);
    if (this.context.panelInstances.has(panelInternal.name))
      throw new Error(`A panel named ${panel.name} already exists in this layout`);
  
    const panelResult = reactive(new CodeLayoutSplitNPanelInternal(this.context));
    Object.assign(panelResult, panel);
    panelResult.size = panel.size ?? 0;
    panelResult.accept = panel.accept ?? this.accept;
    this.addChild(panelResult as CodeLayoutSplitNPanelInternal);
    this.context.panelInstances.set(panelInternal.name, panelResult as CodeLayoutSplitNPanelInternal);
  
    return panelResult as CodeLayoutSplitNPanelInternal;
  }

  getContainerSize(): number {
    this.pushLateAction('getContainerSize');
    return super.getContainerSize();
  }

  //Internal
  //These methods is called internally, and you do not need to use them.

  addChildGrid(child: CodeLayoutSplitNGridInternal, index?: number) {
    if (typeof index === 'number')
      this.childGrid.splice(index, 0, child);
    else
      this.childGrid.push(child);
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  addChildGrids(childs: CodeLayoutSplitNGridInternal[], startIndex?: number) {
    if (typeof startIndex === 'number')
      this.childGrid.splice(startIndex, 0, ...childs);
    else
      this.childGrid.push(...childs);
    for (const child of childs) {
      child.parentGroup = this;
      child.parentGrid = this.parentGrid;
    }
  }
  removeChildGrid(child: CodeLayoutSplitNGridInternal) {
    this.childGrid.splice(this.childGrid.indexOf(child), 1);
    child.parentGroup = null;
  }
  replaceChildGrid(oldChild: CodeLayoutSplitNGridInternal, child: CodeLayoutSplitNGridInternal) {
    this.childGrid.splice(
      this.childGrid.indexOf(oldChild), 
      1, 
      child);   
    oldChild.parentGroup = null;
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  hasChildGrid(child: CodeLayoutSplitNGridInternal) {
    return this.childGrid.includes(child);
  }
  
  toJson() : any {
    return {
      ...super.toJson(),
      canMinClose: this.canMinClose,
      direction: this.direction,
      childGrid: this.childGrid.map(p => p.toJson()),
    }
  }
  loadFromJson(json: any): void {
    this.direction = json.direction;
    this.canMinClose = json.canMinClose;
    super.loadFromJson(json);
  }
}

/**
 * Instance of SplitLayout.
 * 
 * Can use like this:
 * ```
 * const splitLayout = ref<CodeLayoutSplitNInstance>(); 
 * const rootGrid = splitLayout.value.getRootGrid();
 * ```
 */
export interface CodeLayoutSplitNInstance {
  /**
   * Get root grid instance.
   */
  getRootGrid() : CodeLayoutSplitNGridInternal;
  /**
   * Get panel instance by name.
   * @param name The pance name.
   */
  getPanelByName(name: string): CodeLayoutPanelInternal | undefined,
  /**
   * Obtain a grid that is currently actived by user and can be used to add panels.
   */
  getActiveGird() : CodeLayoutSplitNGridInternal;

  /**
   * Active a panel.
   * @param name Panel name
   */
  activePanel(name: string): void;

  /**
   * Save current layout to JSON data.
   */
  saveLayout(): any;
  /**
   * Load the previous layout from JSON data, 
   * instantiatePanelCallback will sequentially call all panels, where you can process panel data.
   */
  loadLayout(json: any, instantiatePanelCallback: (data: CodeLayoutSplitNPanelInternal) => void): void;
}

export interface CodeLayoutSplitLayoutContext {
  currentActiveGrid: Ref<CodeLayoutSplitNGridInternal|null>,
  activeGrid(grid: CodeLayoutSplitNGridInternal) : void;
  dragDropToPanel(referencePanel: CodeLayoutPanelInternal, referencePosition: CodeLayoutDragDropReferencePosition, panel: CodeLayoutPanelInternal, toTab?: boolean) : void;
}