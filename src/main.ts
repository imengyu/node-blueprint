import electron, { app, BrowserWindow, dialog, shell, session } from 'electron'
import path from "path"
import url from 'url'
import fs from 'fs'
import process from 'process'
import child_process from 'child_process'
import Electron from 'electron'

const Menu = electron.Menu;
const Tray = electron.Tray;
const ipc = electron.ipcMain;
const exec = child_process.exec;

var appTray : Electron.Tray = null;
var appQuit = false
var appIco : Electron.NativeImage = null;
var appDir = process.cwd().replace(/\\/g, '/') ;
var appCanQuit = false;

var mainWindow : Electron.BrowserWindow = null;
var crashedWindow : Electron.BrowserWindow = null;
 
async function createMainWindow () {
  appIco = Electron.nativeImage.createFromPath(path.posix.join(appDir, require('./assets/images/logo.ico')));
  
  console.log('createMainWindow');

  mainWindow = new BrowserWindow({
    minWidth: 710,
    minHeight: 500,
    frame: false,
    transparent: false,
    fullscreen: false,
    resizable: true,
    show: false,
    icon: appIco,
    webPreferences: {
      webSecurity: false, 
      nodeIntegration: true,
      enableRemoteModule: true,
    },
  })
  mainWindow.setMenu(null)

  mainWindow.webContents.on('render-process-gone', (event, detail) => {
    genErrorReport();
    showCrashedWindow();
    destroyMainWindow();
  });
  mainWindow.webContents.on('devtools-reload-page', () => {
    if(!mainWindow.isMinimized()) mainWindow.restore();
    if(!mainWindow.isFocused()) mainWindow.focus();
  });
  mainWindow.on('closed', () =>  {
    if(appTray != null) {
      appTray.destroy();
      appTray = null;
    }
    mainWindow = null
  })
  mainWindow.on('unresponsive', () => {
    dialog.showMessageBox(mainWindow, {
      type: 'info',
      message: '软件可能卡住了，需要一些时间让其完成工作。',
      title: '抱歉，软件出现了一些故障',
      detail: '如果它长时间没有响应，可能是软件故障。您可以尝试强制重新加载页面',
      noLink: true,
      buttons: [ '等待其响应', '强制重新加载页面' ],
    }).then((value) => {
      if(value.response == 1) {
        mainWindow.reload();
      }
    })
  });
  mainWindow.on('close',(e) => {  
    if(!appQuit){
      e.preventDefault();
      mainWindow.hide();
    } 
  });
  mainWindow.once('ready-to-show', () => mainWindow.show())
  
  
  //await mainWindow.webContents.session.loadExtension('D:/Programming/WebProjecs/Blueprint/dist/development/extensions/vue-devtools');
  //await session.defaultSession.loadExtension('D:/Programming/WebProjecs/Blueprint/dist/development/extensions/vue-devtools');

  await mainWindow.loadURL(getPagePath('renderer.html'));
  if(process.env.NODE_ENV == 'development')  {
    mainWindow.webContents.once('devtools-opened', () => mainWindow.focus());
    mainWindow.webContents.openDevTools();
  }

  createMainMenu();
}
function createMainMenu() {
  var trayMenuTemplate = [
    {
      label: '显示主界面',
      click: function () { mainWindow.show(); mainWindow.focus();  }
    },
    {
      label: '退出',
      click: function () { 
        if(appCanQuit) {
          mainWindow.show(); 
          mainWindow.webContents.send('main-window-act', 'show-exit-dialog');
        }else {
          dialog.showMessageBox(mainWindow, {
            message: '是否要退出程序',
            noLink: true,
            buttons: [ '取消', '退出' ]
          }).then((value) => {
            if(value.response == 1) {
              appQuit = true;
              app.quit();
            }
          }).catch(() => {})
        }
      }
    }
  ];
  const contextMenu = Menu.buildFromTemplate(trayMenuTemplate);

  appTray = new Tray(appIco);
  appTray.setToolTip('Blueprint');
  appTray.setContextMenu(contextMenu);
  appTray.on('click', () => mainWindow.show())
}
function destroyMainWindow() {
  appQuit = true;
  appCanQuit = false;
  mainWindow.removeAllListeners();
  mainWindow.close();
  mainWindow = null;
}
function recreateWindow(event, submitErrReport : boolean) {
  if(mainWindow == null) createMainWindow(); 
  if(submitErrReport) submitErrorReport();
  if(crashedWindow != null) crashedWindow.close();
}


/**
 * Get page path at dist
 * @param basePath 
 * @param hash 
 */
function getPagePath(basePath : string, hash? : string) {
  return url.format({
    pathname: path.join(appDir, basePath),
    protocol: 'file:',
    slashes: true,
    hash: hash
  })
}

function showCrashedWindow() {
  crashedWindow = new BrowserWindow({
    width: 560, 
    height: 410,
    frame: true,
    transparent: false,
    fullscreen: false,
    resizable: false,
    minimizable: false,
    icon: appIco,
    webPreferences: {
      webSecurity: false,
      nodeIntegration: true,
      disableBlinkFeatures: "",
    },
  })
  crashedWindow.setMenu(null)
  crashedWindow.loadURL(getPagePath('crashed.html'));
  crashedWindow.on('close', () => crashedWindow = null);
}
function genErrorReport() {

}
function submitErrorReport() {

}

//Inits

function initBasePath(callback : () => void) {
  
  appDir = appDir.replace(/\\/g, '/');
  if(fs.existsSync(appDir + '/dist/index.html')) appDir = appDir + '/dist/';
  else if(fs.existsSync(appDir + '/dist/development/index.html')) appDir = appDir + '/dist/development/';
  else if(fs.existsSync(appDir + '/resources/app/index.html')) appDir = appDir + '/resources/app/';
  else if(fs.existsSync(appDir + '/resources/app.asar')) appDir = appDir + '/resources/app.asar/';
  
  callback();
}
function initApp() {

  app.on('ready', async () => { 
    
      //installVueDevTools
      try {
        
        let devtoolsPath = appDir + 'extensions/vue-devtools';
        console.log('devtoolsPath: ' + devtoolsPath);

        if(fs.existsSync(devtoolsPath)) 
          await session.defaultSession.loadExtension(devtoolsPath).then((e) => {
            console.log('vue-devtools Extension : ' + e.id);
          }).catch((e) => {
            console.error(e);
          })
      }catch(e) {
        console.error(e);
      }

    try { await createMainWindow(); }
    catch(e) {
      dialog.showErrorBox("发生了错误", "抱歉，应用发生了一个错误，现在应用将会关闭\n" + e);
      app.exit(-1);
    }
  })
  app.on('window-all-closed', () =>  {
    // On OS X it is common for applications and their menu bar
    // to stay active until the user quits explicitly with Cmd + Q
    if (process.platform !== 'darwin') app.quit()
  })
  app.on('activate', () =>  {
    // On OS X it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (mainWindow === null) createMainWindow()
  })
  app.on('web-contents-created', (event, contents) => {

    let errCount = 0;

    contents.on('did-fail-load', (event, errorCode, errorDescription, validatedURL, isMainFrame, frameProcessId, frameRoutingId) => {
      
      if(contents == mainWindow.webContents)
        appCanQuit = false;
      
      let failedPageUrl = getPagePath('neterr.html');
      errCount ++;
      if(errCount < 10 && contents.getURL() != failedPageUrl) {
        contents.loadURL(failedPageUrl);
        contents.executeJavaScript('document.getElementById(\'global-error-info-code\').innerText = \''+errorDescription+'('+errorCode+')\'');
      }else {
        dialog.showErrorBox('发生了错误', '加载页面时发生错误\nURL: ' + 
          validatedURL + '\n错误代码: ' + errorDescription + ' (' + errorCode + ')');
      }
    });

    contents.on('will-navigate', (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl)
      if(parsedUrl.protocol == 'file:') {
        console.log('navigate to file : ' + parsedUrl.pathname);
      }else if(parsedUrl.protocol == 'http:' || parsedUrl.protocol == 'https:') {
        event.preventDefault();
        dialog.showMessageBox(mainWindow, {
          title: '打开外部链接',
          message: '您是否需要在浏览器中打开外部链接？',
          detail: '目标链接：' + navigationUrl,
          buttons: [ '在浏览器中打开此页面', '取消打开' ]
        }).then((value) => {
          if(value.response == 0) shell.openExternal(navigationUrl)
        }).catch(() => {});
      }
    });
    contents.on('new-window', async (event, navigationUrl) => {
      const parsedUrl = new URL(navigationUrl);
      if(parsedUrl.protocol != 'devtools:' && parsedUrl.protocol != 'file:'){
        console.log(parsedUrl);
        event.preventDefault();
        shell.openExternal(navigationUrl)
      }
    })
  })
}
function initIpcs() {

  ipc.on('main-open-file-dialog-image', (event, arg) => {
    var properties = ['openFile'];
    dialog.showOpenDialog(mainWindow, {
      properties: <any>properties,
      title: '选择图片文件',
      filters: [
        { name: '图像文件', extensions: ['bmp', 'jpg', 'png'] },
        { name: '所有文件', extensions: ['*'] }
      ],
    }).then((value) => {
      if (value) event.sender.send('selected-image', arg, value.filePaths)
    }).catch((e) => console.log(e))
  })
  ipc.on('main-open-file-dialog-json', (event, arg) => {
    var properties = ['openFile'];
    dialog.showOpenDialog(mainWindow, {
      properties: <any>properties,
      title: '选择 JSON 数据文件',
      filters: [
        { name: 'JSON 数据文件', extensions: ['json'] },
        { name: '所有文件', extensions: ['*'] }
      ],
    }).then((value) => {
      if (value) event.sender.send('selected-json', arg, value.filePaths)
    }).catch((e) => console.log(e))
  })
  ipc.on('main-save-file-dialog-json', (event, arg) => {
    dialog.showSaveDialog(mainWindow, {
      title: '保存 JSON 数据文件',
      filters: [
        { name: arg.filename ? arg.filename : 'JSON 数据文件', extensions: ['json'] }
      ]
    }).then((value) => {
      if (arg) arg.isSave = true;
      if (value) event.sender.send('selected-json', arg, value.filePath)
    }).catch((e) => console.log(e));
  })
  ipc.on('main-act-recreate', recreateWindow);
  ipc.on('main-act-main-standby', (event, arg) => appCanQuit = arg);
  ipc.on('main-act-quit', (event, arg) => { appQuit = true; app.quit(); });
  ipc.on('main-act-reload', (event) => {
    if(mainWindow && event.sender == mainWindow.webContents) 
      mainWindow.webContents.loadURL(getPagePath('index.html'))
  });
  ipc.on('main-act-toggle-devtools', (event) => {
    if(mainWindow)
      if(mainWindow.webContents.isDevToolsOpened()) mainWindow.webContents.closeDevTools();
      else mainWindow.webContents.openDevTools();
  });
  ipc.on('main-act-run-shell', (event, arg) => {
    let workerProcess
    //console.log('run command : ' + arg.command);
    workerProcess = exec(arg.command)
    workerProcess.stdout.on('data', function (data) {
      event.sender.send('shell-data', arg, data)
    });
  });
}

//Init start
try {
  initBasePath(() => {
    initApp();
    initIpcs();
  })
}catch(e) {
  dialog.showErrorBox("发生了错误", "抱歉，应用发生了一个错误，现在应用将会关闭\n" + e);
  app.exit(-1);
}
