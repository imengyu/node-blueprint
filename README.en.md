
<p align="center">
 <img width="240px" src="https://raw.githubusercontent.com/imengyu/node-blueprint/master/src/node-blueprint/Editor/Images/Logo/logo-huge.png" align="center" alt="GitHub Readme Stats" />
 <hr>
 <p align="center">A visual script editing and running program based on JS like unreal engine blueprint</p>
</p>

---

![image](https://raw.githubusercontent.com/imengyu/node-blueprint/master/images/preview.png)

[Chinese Readme](https://github.com/imengyu/node-blueprint/blob/master/README.md)

### Features

* Easy drag unit and cable that you can programming
* Based on JavaScript, it can be applied to **web platform**, and the development is simple
* Support electron, can be applied to **desktop platform**
* Support debugging, single step execution, variable view
* Customizable code block, quickly embed your code

### Introduction

This is a visual scripting app that similar to the Blueprint of Unreal Engine, but based on HTML and JS, you can encapsulate some complex and functional codes into functional units that can be repeatedly called, then organize and call them with simple and easy to understand flow script. You can use blueprints to control the operation of the program. Users can not understand programming, and can also control the program with high definition and fine control.

#### The purpose

In some application scenarios, the user needs to have a high degree of customization for the program, such as controlling the data acquisition and processing operation; or the device control needs to be able to customize the action, but the user does not understand the programming situation. You can encapsulate your own devices or business codes into callable units, handle parameters, events, etc., and write documents, so that users can customize calls and data processing based on simple flow charts. Users only need to drag and drop the connection on the flow chart to customize the operation process they want.

#### Install and run

There is currently no release. However, you can try debugging the version first.

* Install: 

```
npm install
```

At present, it supports two platforms, electron and web: 

* Web:

```
npm run dev
# After compiling, visit localhost:5173
```

#### Development

**⚠ This project has not been fully developed and mature, do not use in any production project! ⚠**

At present, only the author is developing... If you are also interested in this, you can also help me develop it together, Thank you very much for your support!

### How to Use app

1. Run it.
2. After opening, click "New flowchart" on the home page or click "File > New File" on the menu.
   ![image](https://raw.githubusercontent.com/imengyu/node-blueprint/master/images/help1.jpg)
3. The default document has two units, one is the entry and the other is the exit. Right click and hold in the chart to move the view.
   ![image](https://raw.githubusercontent.com/imengyu/node-blueprint/master/images/help2.jpg)
4. Click the "+" button on the left toolbar or right-click in the chart to pop up the add cell menu. Select what you want to add in it. You can click once to add it to the mouse position. Press and drag to add it to the user-defined position.
   ![image](https://raw.githubusercontent.com/imengyu/node-blueprint/master/images/help3.jpg)
5. Each unit has its own port, the left is the entrance, the right is the exit. The triangle is the execution port, and the program is based on it; the circle is the data port, and the data flows according to it.<br>
   ![image](https://raw.githubusercontent.com/imengyu/node-blueprint/master/images/help4.jpg)
6. Click the green triangle on the toolbar to debug (currently there is no debug output, but you can use the browser's own debug tool to view the output and debug information). <br>
Click the blue arrow on the toolbar to indicate single step debugging. Each step will pause. The chart will show the direction of the program. You can move the mouse over the port to display the current data value of the port.
   ![image](https://raw.githubusercontent.com/imengyu/node-blueprint/master/images/help5.jpg)
7. These are the only features available now. 

### Licence

[MIT](https://github.com/imengyu/node-blueprint/blob/master/LICENSE) license is used in this project.
