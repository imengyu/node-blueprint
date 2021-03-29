import { EditorSettings } from "@/model/Editor/EditorSettings";


/**
 * 编辑器依赖于平台的功能抽离
 */
export interface EditorPlatformWorkAbstract {
  init: () => void;
  writeFile: (path: string, data : string, callback: () => void) => void;
  readFile: (path: string, callback: (data : string, err : Error|string) => void) => void;

  windowControl: (act : string) => void;
  editorAction: (cmd: string, ...data : any) => void;
  editorNotifyCallback: (callback : EditorNotifyCallback) => void;

  openFileDialog: (callback: (paths: string[], files : File[]) => void) => void;
  saveFileDialog: (fileName: string,callback: (path: string) => void) => void;

  loadSettings: (settings : EditorSettings) => void;
  saveSettings: (settings : EditorSettings) => void;

  loadRecentList: (loadRecentListToMenu : (data : any) => void) => void;
  saveRecentList: (data : object) => void;
}

export type EditorNotifyCallback = (message: string, data: any, backCallback ?: Function) => void;