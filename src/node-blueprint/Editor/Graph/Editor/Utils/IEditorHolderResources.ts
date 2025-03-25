export interface IEditorHolderResources<C> {
  getHolderContext(): C|null;
}

export class EditorHolder<C> {

  private holder: C|null = null;

  hold(holder: C) {
    if (this.holder)
      throw new Error('EditorHolder already hold a context');
    this.holder = holder; 

    return () => {
      this.holder = null;
    };
  }
  getHolderContext(): C|null {
    return this.holder;
  }
}