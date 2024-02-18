import { CodeLayoutGridInternal, CodeLayoutPanelInternal } from "../CodeLayout";

export class CodeLayoutSplitNPanelInternal extends CodeLayoutPanelInternal {

  public constructor() {
    super();
  }
}
export class CodeLayoutSplitNGridInternal extends CodeLayoutGridInternal {

  public constructor() {
    super('centerArea', 'text', () => {});
  }

  direction: 'vertical'|'horizontal' = 'vertical';

}

export interface CodeLayoutSplitNInstance {
  
}