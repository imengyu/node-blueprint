
<p align="center">
 <img width="240px" src="https://raw.githubusercontent.com/imengyu/node-blueprint/master/src/assets/images/logo-huge.png" align="center" alt="GitHub Readme Stats" />
 <hr>
 <p align="center">一个抄袭 Unreal Engine 蓝图的基于JS的脚本编辑和运行程序</p>
</p>

---

![image](https://github.com/imengyu/node-blueprint/raw/master/images/preview.png)

[English Readme](https://github.com/imengyu/node-blueprint/blob/master/README.en.md)
### 特性

* 轻松的拖拽单元和连线就可以编程
* 基于JavaScript，可应用于**Web平台**，开发简单
* 支持 Electron 可应用于**桌面平台**
* 支持调试，单步执行，变量查看
* 可自定义代码块，快速将您的代码嵌入
* 未来可能会开发基于C语言的解释器，甚至可以用于嵌入式设备里（不知道能不能实现）
### 简介

这是一个一个类似(抄袭)于Unreal engine 蓝图的脚本的一个设计软件， 基于HTML和JS，你可以将一些复杂的、功能性强的代码封装为可重复调用的一个个功能单元，用简单易懂的流程脚本蓝图来组织、调用他们，可实现用流程蓝图来控制程序的运行，用户可以不大懂编程，也可对程序进行高自定义的、精细的控制。

#### 有什么用? 我想象的应用场景

某些应用场景，用户对程序要有高度自定义的需求，例如控制数据采集处理操作；或是对设备控制要能自定义动作，但用户却不懂编程的情况。你可以将自己的设备或是业务代码封装为一个个可调用的单元，处理参数、事件等等，并写好文档，可让用户基于简单的流程图进行自定义调用，自定义处理数据等等。用户只需要在流程图上进行拖拽连连线，即可对自己想要的操作流程进行自定义。

#### 安装以及运行方式

目前暂无发行版本。不过您可以先尝试调试版本。

* 项目安装：

```
npm install
```

目前支持两种平台，Electron 和 Web，启动方式：

* Web 平台：

```
npm run serve
# 也可以直接运行
npm start
# 编译成功之后访问 localhost:8080
```

* Electron 平台：

```
# 首先运行构建命令
npm run build-electron-dev
# 等待上面的命令编译完成之后，然后再开启一个新的终端，运行：
npm run electron-dev
# 然后程序就开始运行了
```
#### 开发

**⚠ 这个项目还没开发完备和成熟，最好不要用于任何生产的项目中！⚠**

目前只有作者一个人用爱在开发。。。如果你也对这个感兴趣的话，可以随时来找我哦，（**大佬们又帅又有才华，帮帮弱小可爱的作者吧🙂**），
wechart： imyzc_dream_or_chase，我们可以一起探讨一下这个项目的前景和应用问题。如果有什么疑问，我会尽力解答你。

如果你很想使用这个项目在生产环境中，我会尽力帮助你完善项目和接入改进（可能需要一点点回报）🌈。

### 使用方法

1. 运行程序
2. 打开后在主页点击“新建流程图”或者点击菜单“文件”>“新建”。
   ![image](https://github.com/imengyu/node-blueprint/raw/master/images/help1.jpg)
3. 默认文档有两个单元，一个是入口，一个是出口。在图表中右键按住可以移动视图。
   ![image](https://github.com/imengyu/node-blueprint/raw/master/images/help2.jpg)
4. 点击左边工具栏的“+”按钮或是在图表中点击右键可以弹出添加单元菜单，在里面选择你需要添加的，可以点击一次，是添加到鼠标位置，按住并拖动可以添加到自定义位置。
   ![image](https://github.com/imengyu/node-blueprint/raw/master/images/help3.jpg)
5. 每个单元都有自己的端口，左边是入口，右边是出口。三角形是执行端口，程序是依据它来走的；圆形是数据端口，数据根据它来流动
   ![image](https://github.com/imengyu/node-blueprint/raw/master/images/help4.jpg)
6. 点击工具栏的绿色三角形可以进行调试，（目前没有调试输出，不过你可以使用浏览器自带调试工具查看输出和调试信息）。<br>
   点击工具栏的蓝色箭头表示单步调试，每运行一步就会暂停下来，图表中会显示程序的走向，您可以把鼠标移动到端口上面，这样会显示端口当前的数据值。
   ![image](https://github.com/imengyu/node-blueprint/raw/master/images/help5.jpg)
7. 目前功能只有这么多了，其他的，发挥你的想象力吧
### 许可

本项目使用 [MIT](https://github.com/imengyu/node-blueprint/blob/master/LICENSE) 协议。
