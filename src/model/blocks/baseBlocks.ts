import { EditorInterface } from '../editor'

export default { 
  register(editor : EditorInterface) {
    editor.registerBlock({
      guid: "0324C0EC-CE44-05B8-A62D-0ECE0D19DC9F",
      name: "脚本入口",
      description: "脚本入口，程序在这里开始运行",
      logo: "",
      logoRight: "",
      logoBottom: "",
      category: '基础/脚本',
      author: 'imengyu',
      version: '2.0',
      ports : [
        {
          name: "脚本开始",
          description: '脚本在这里开始运行',
          direction: 'output',
          guid: '00000001'
        },
      ],
      parameters: [],
      onCreate: () => {},
      onPortActive : (block, port) => {},
      onParameterUpdate : (block, port) => {},
    }, false);
    editor.registerBlock({
      guid: "77885802-92C8-569B-1E7F-48938943A549",
      name: "脚本出口",
      description: "脚本出口，调用此单元结束整个脚本的运行",
      logo: "",
      logoRight: "",
      logoBottom: "",
      category: '基础/脚本',
      author: 'imengyu',
      version: '2.0',
      ports : [
        {
          name: "结束脚本",
          description: '',
          direction: 'input',
          guid: '00000001'
        },
      ],
      parameters: [],
      onCreate: () => {},
      onPortActive : (block, port) => {},
      onParameterUpdate : (block, port) => {},
    }, false);
    editor.registerBlock({
      guid: "4B6EA737-9702-A383-A268-AADC332038DF",
      name: "console.log",
      description: "打印日志",
      logo: "",
      logoRight: "",
      logoBottom: "",
      category: '基础/调试',
      author: 'imengyu',
      version: '2.0',
      ports : [
        {
          name: "入口",
          description: '',
          direction: 'input',
          guid: '00000001'
        },
        {
          name: "出口",
          description: '',
          direction: 'output',
          guid: '00000002'
        },
      ],
      parameters: [
        {
          name: "输出参数",
          description: '',
          direction: 'input',
          guid: '00000003',
          paramType: 'any',
          paramCustomType: 'any'
        },
      ],
      onCreate: () => {},
      onPortActive : (block, port) => {
        if(port.direction == 'input') {

        }
      },
      onParameterUpdate : (block, port) => {},
    }, false);
  }
}