import { EditorSettings } from "@/model/Editor/EditorSettings";
import StringUtils from "@/utils/StringUtils";
import { EditorNotifyCallback, EditorPlatformWorkAbstract } from "./EditorPlatformWorkAbstract";

export class EditorPlatformWorkWeb implements EditorPlatformWorkAbstract {

  private notifyCallback: EditorNotifyCallback = null;

  init() {
    
  };

  editorNotifyCallback(callback: EditorNotifyCallback)  {
    this.notifyCallback = callback;
  }

  writeFile(path: string, data: string, callback: () => void) {
    
  }
  readFile(path: string, callback: (data: string, err: any) => void)  {
    
  }
  windowControl(act: string) {
    
  }
  editorAction(cmd: string, ...data : any) {
    
  }
  openFileDialog(callback: (paths: string[], files : File[]) => void) {
    let input = document.createElement('input');
    input.type="file";
    input.accept="application/x-javascript";
    input.style.visibility = "hidden";
    input.style.height = "0";    
    input.onchange = () => {
      if(input.files != null && input.files.length > 0) {
        let files = new Array<File>();
        for(let i = 0; i < input.files.length; i++)
          files.push(input.files[i]);
        callback(null, files);
        document.body.removeChild(input);
      }
    };
    document.body.append(input);
    input.click();
  }
  saveFileDialog(fileName: string, callback: (path: string) => void)  {

  }
  loadSettings(settings : EditorSettings) {

  }
  saveSettings(settings : EditorSettings) {

  }
  loadRecentList(loadRecentListToMenu : (data : any) => void) {
    let str = localStorage.getItem('recentList');
    if(!StringUtils.isNullOrEmpty(str)) {
      let data = JSON.parse(str); 
      loadRecentListToMenu(data.recentList);
    }
  }
  saveRecentList(data : object) {
    localStorage.setItem('recentList', JSON.stringify(data));
  }
}

