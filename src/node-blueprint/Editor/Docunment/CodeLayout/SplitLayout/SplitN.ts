import { reactive } from "vue";
import { CodeLayoutGridInternal, CodeLayoutPanelInternal, type CodeLayoutPanelHosterContext, type CodeLayoutPanel, type CodeLayoutDragDropReferencePosition } from "../CodeLayout";

export class CodeLayoutSplitNPanelInternal extends CodeLayoutPanelInternal {

  public constructor(context: CodeLayoutPanelHosterContext) {
    super(context);
    this.open = true;
  }

  openPanel(): void {
    throw new Error('SplitLayout panel can only close');
  }
  closePanel(): void {
    this.context.closePanelInternal(this);
  }
}

export interface CodeLayoutSplitNGrid extends Omit<CodeLayoutPanel, 'title'> {
  canMinClose?: boolean;
  direction?: 'vertical'|'horizontal';
}

export class CodeLayoutSplitNGridInternal extends CodeLayoutGridInternal implements CodeLayoutSplitNGrid {

  public constructor(context: CodeLayoutPanelHosterContext) {
    super('centerArea', 'text', context, () => {});
    this.open = true;
  }

  canMinClose = false;
  direction: 'vertical'|'horizontal' = 'vertical';
  childGrid : CodeLayoutSplitNGridInternal[] = [];

  //Public

  addGrid(panel: CodeLayoutSplitNGrid) {
    const panelInternal = panel as CodeLayoutSplitNGridInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);
    if (this.context.panelInstances.has(panelInternal.name))
      throw new Error(`A panel named ${panel.name} already exists`);
  
    const panelResult = reactive(new CodeLayoutSplitNGridInternal(this.context));
    Object.assign(panelResult, panel);
    panelResult.open = panel.startOpen ?? false;
    panelResult.size = panel.size ?? 0;
    panelResult.accept = panel.accept ?? this.accept;
    panelResult.parentGrid = this.parentGrid;
    this.addChildGrid(panelResult as CodeLayoutSplitNGridInternal);
    this.context.panelInstances.set(panelInternal.name, panelResult as CodeLayoutSplitNGridInternal);
    return panelResult as CodeLayoutSplitNGridInternal;
  }
  removeGrid(panel: CodeLayoutSplitNGrid) {
    const panelInternal = panel as CodeLayoutSplitNGridInternal;
    if (panelInternal.parentGroup !== this)
      throw new Error(`Panel ${panel.name} is not child of this group !`);
    this.removeChildGrid(panelInternal);
    this.context.panelInstances.delete(panelInternal.name);
    return panel;
  }
  addPanel(panel: CodeLayoutPanel) {
    const panelInternal = panel as CodeLayoutPanelInternal;
    
    if (panelInternal.parentGroup)
      throw new Error(`Panel ${panel.name} already added to ${panelInternal.parentGroup.name} !`);
    if (this.context.panelInstances.has(panelInternal.name))
      throw new Error(`A panel named ${panel.name} already exists`);
  
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

  addChildGrid(child: CodeLayoutSplitNGridInternal, index?: number) {
    if (this.name === child.name)
      throw new Error('Try add self');
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
      if (this.name === child.name)
        throw new Error('Try add self');
      child.parentGroup = this;
      child.parentGrid = this.parentGrid;
    }
  }
  removeChildGrid(child: CodeLayoutSplitNGridInternal) {
    this.childGrid.splice(this.childGrid.indexOf(child), 1);
    child.parentGroup = null;
  }
  replaceChildGrid(oldChild: CodeLayoutSplitNGridInternal, child: CodeLayoutSplitNGridInternal) {
    this.children.splice(
      this.children.indexOf(oldChild), 
      1, 
      child);   
    oldChild.parentGroup = null;
    child.parentGroup = this;
    child.parentGrid = this.parentGrid;
  }
  hasChildGrid(child: CodeLayoutSplitNGridInternal) {
    return this.childGrid.includes(child);
  }

}

export interface CodeLayoutSplitNInstance {
  getRootGrid() : CodeLayoutSplitNGridInternal;
}

export interface CodeLayoutSplitLayoutContext {
  dragDropToPanel(referencePanel: CodeLayoutPanelInternal, referencePosition: CodeLayoutDragDropReferencePosition, panel: CodeLayoutPanelInternal, toTab?: boolean) : void;
}