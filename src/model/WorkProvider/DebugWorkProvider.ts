export class DebugWorkProvider {
  public ModalProvider : (level : string, title :string, text: string, callback : () => void) => void = null;
  public ConfirmModalProvider : (title :string, text: string, okCallback : () => void, cancelCallback : () => void) => void = null;

}

let DebugWorkProviderInstance = new DebugWorkProvider();

export default DebugWorkProviderInstance;