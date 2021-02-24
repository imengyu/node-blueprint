import { EditorSettings } from "@/model/Editor/EditorSettings";
import SettingsServiceInstance from "@/sevices/SettingsService";
import { BrowserWindow } from "electron";
import { EditorNotifyCallback, EditorPlatformWorkAbstract } from "./EditorPlatformWorkAbstract";

//Get nodejs require function
var _require = (<any>global)['__ORIGINAL_NODEJS_REQUIRE__'];
var fs : any = null;
var electron : any = null; 

if(typeof _require === 'function') {
  //Load this moduls from local file
  fs = require('fs');
  electron = require('electron');
}

/**
 * 编辑器依赖 Electron 的方法
 */
export class EditorPlatformWorkElectron implements EditorPlatformWorkAbstract {

  ipc : Electron.IpcRenderer = null;
  dialog : Electron.Dialog = null;
  remote : Electron.Remote = null;

  currentWindow : BrowserWindow = null;
  currentAppPath = '';

  private notifyCallback: EditorNotifyCallback = null;

  init() {
    if(!electron || !fs)
      return;

    this.ipc = electron.ipcRenderer;
    this.remote = electron.remote;
    this.dialog = this.remote.dialog;
    this.currentWindow = this.remote.getCurrentWindow();
    this.updateWindowIsMaxState(this.currentWindow.isMaximized());
    this.currentWindow.setMinimumSize(710, 500);
    this.currentAppPath = process.cwd();
    this.ipc.on("main-window-act", (event, arg) => {
      if (arg == "show-exit-dialog") 
        this.windowControl('close');
    });
    this.ipc.on('selected-json', (event, arg, path) => {
      if(!path || path.length == 0)
        return;
      if(arg.type=='chooseOneImageAndCallback'){

      }
    });
    this.ipc.send('main-act-main-standby', true);
  };

  private updateWindowIsMaxState(state : boolean) {
    if(this.notifyCallback)
      this.notifyCallback('windowIsMax', state);
  }

  editorNotifyCallback(callback: EditorNotifyCallback)  {
    this.notifyCallback = callback;
  }

  writeFile(path: string, data: string, callback: () => void) {
    fs.writeFile(path, data, { encoding: 'utf-8' }, callback);
  }
  readFile(path: string, callback: (data: string, err: any) => void)  {
    if(!fs.existsSync(path)) {
      callback(null, '文件 ' + path + ' 不存在');
    } else fs.readFile(path, { encoding: 'utf-8' }, (data: any, err: any) => {
      callback(data, err);
    });
  }
  windowControl(act: string) {
    switch(act) {
      case 'close':
        this.notifyCallback('quitSaveCallback', null, () => {
          this.ipc.send("main-act-quit");
        });
        break;
      case 'min':
        this.currentWindow.minimize();
        this.updateWindowIsMaxState(this.currentWindow.isMaximized());
        break;
      case 'max':
        this.currentWindow.maximize();
        this.updateWindowIsMaxState(this.currentWindow.isMaximized());
        break;
      case 'restore':
        this.currentWindow.restore();
        this.updateWindowIsMaxState(this.currentWindow.isMaximized());
        break;
    }
  }
  editorAction(cmd: string, ...data : any) {
    this.ipc.send(cmd, data)
  }
  openFileDialog(callback: (paths: string[], files : File[]) => void) {
    this.dialog.showOpenDialog(this.currentWindow, {
      title: '打开',
      filters: [
        { name: 'JSON文件', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] }
      ],
    }).then((v) => {
      callback(v.filePaths, null);
    }).catch(() => {})
  }
  saveFileDialog(fileName: string, callback: (path: string) => void)  {
    this.dialog.showSaveDialog(this.currentWindow, {
      title: '保存 ' + fileName + ' 到文件',
      filters: [
        { name: 'JSON文件', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] }
      ],
    }).then((v) => {
      if(!v.canceled)
        callback(v.filePath);
    }).catch(() => {})
  }

  
  saveSettings(settings : EditorSettings) {
    let size = this.currentWindow.getSize();
    settings.lastIsMaxed = this.currentWindow.isMaximized();
    settings.lastWindowWidth = size[0];
    settings.lastWindowHeight = size[1];
    SettingsServiceInstance.setSettingsBoolean('lastIsMaxed', settings.lastIsMaxed);
    SettingsServiceInstance.setSettingsNumber('lastWindowWidth', settings.lastWindowWidth);
    SettingsServiceInstance.setSettingsNumber('lastWindowHeight', settings.lastWindowHeight);
  }
  loadSettings(settings : EditorSettings) {
    let screenSize = electron.remote.screen.getPrimaryDisplay().size;
    let targetWindowSize = { x: settings.lastWindowWidth, y: settings.lastWindowHeight };
    if(targetWindowSize.x > screenSize.width) targetWindowSize.x = screenSize.width;
    if(targetWindowSize.y > screenSize.height) targetWindowSize.y = screenSize.height;
    if(targetWindowSize.x < 710) targetWindowSize.x = 710;
    if(targetWindowSize.y < 500) targetWindowSize.y = 500;

    if(settings.lastIsMaxed)
      this.currentWindow.maximize();
    this.currentWindow.setSize(targetWindowSize.x, targetWindowSize.y, false);
    this.updateWindowIsMaxState(this.currentWindow.isMaximized());
  }
  loadRecentList(loadRecentListToMenu : (data : any) => void) {
    fs.readFile(this.currentAppPath + '/recent.json', {}, (err : any, data : any) => {
      if(data &&data.length > 0) {
        let j = JSON.parse(data.toString());
        if(j) loadRecentListToMenu(j.recentList);
      }
    });
  }
  saveRecentList(data : object) {
    fs.writeFileSync(this.currentAppPath + '/recent.json', JSON.stringify(data))
  }
}

