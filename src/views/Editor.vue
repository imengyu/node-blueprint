<template>
  <div>
    <div class="toolbar">
      <div class="button icon" title="新建"><i class="iconfont icon-file-1"></i></div>
      <div class="button icon" title="打开"><i class="iconfont icon-folder-"></i></div>
      <div class="button icon" title="保存"><i class="iconfont icon-save"></i></div>
      <div class="button" @click="test2">上</div>
      <div class="button" @click="test1">下</div>
      <div class="button" @click="test3">add</div>
      
      <div class="separator"></div>
      <div class="button icon" title="缩小" @click="zoomOut"><i class="iconfont icon-zoom-out"></i></div>
      <div class="block">{{viewScale}}%</div>
      <div class="button icon" title="放大" @click="zoomIn"><i class="iconfont icon-zoom"></i></div>
      <div class="button" @click="zoomReset">原始大小</div>
      <div class="separator"></div>
      <div :class="'button icon'+(mouseLeftMove?'':' active')" title="鼠标用来选择组件" @click="mouseLeftMove=false"><i class="iconfont icon-yidong_huaban1"></i></div>
      <div :class="'button icon'+(mouseLeftMove?' active':'')" title="鼠标用来移动视图" @click="mouseLeftMove=true"><i class="iconfont icon-shou"></i></div>
    </div>
    <div class="main">
      <div id="editorHost" class="editor" :style="{ 
        right: propWidth+'px',
        cursor: (isDragView ? 'grabbing' : (mouseLeftMove ? 'grab' : 'default'))
      }">
        <canvas id="editor" oncontextmenu="return false">
          你的浏览器不支持 canvas，请升级你的浏览器
        </canvas>
        <div id="blockHost" class="flow-block-host" :style="{ 
          left: -viewPort.x + 'px', top: -viewPort.y + 'px' ,
          userSelect: (isMultiSelecting ? 'none' : 'unset'),
        }">

        </div>
      </div>
      <div class="prop" :style="{ width: propWidth+'px' }">

      </div>
    </div>
  </div>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { State } from 'vuex-class'
import { Block } from '../model/block'
import { Vector2 } from "../model/vector2";
import { Rect } from "../model/rect";
import { BlockRegData } from "../model/blockdef";

@Component
export default class Editor extends Vue {
  name = "App";

  toolBarHeight = 45;
  propWidth = 300;

  /**
   * 元素控制
   */

  blocks : Array<Block> = [];


  editor : HTMLCanvasElement = null;
  editorHost : HTMLDivElement = null;
  ctx : CanvasRenderingContext2D = null;
  blockHost : HTMLDivElement = null;

  /**
   * 视口控制
   */

  viewRealSize = {
    w: 0,
    h: 0
  }

  viewPort : Rect = new Rect(1024, 1024, 0, 0);
  viewScale = 100;

  recalcViewPort() {
    this.viewPort.w = this.viewRealSize.w * (2 - this.viewScale / 100);
    this.viewPort.h = this.viewRealSize.h * (2 - this.viewScale / 100);
  }

  /**
   * 缩放控制
   */

  zoomIn() {
    if(this.viewScale < 200) 
      this.viewScale += 10;
    this.recalcViewPort();
  }
  zoomOut() {
    if(this.viewScale > 50) 
      this.viewScale -= 10;
    this.recalcViewPort();
  }
  zoomReset() {
    this.viewScale = 100;
    this.recalcViewPort();
  }


  /**
   * 绘制控制
   */

  drawId = 0;

  drawStop() {
    cancelAnimationFrame(this.drawId);
  }
  draw() {

	  this.ctx.clearRect(0, 0, this.viewRealSize.w, this.viewRealSize.h);

    this.drawGrid();
    this.drawMultiSelBox();

    //Debug text
    this.ctx.fillText("viewPort : " + this.viewPort.x + "," + this.viewPort.y, 30, 20);
    this.ctx.fillText("mouseDownPos : " + this.mouseDownPos.x + "," + this.mouseDownPos.y, 30, 30);
    this.ctx.fillText("multiSelectRect : " + this.multiSelectRect.x + " , " + this.multiSelectRect.y +" , "+ this.multiSelectRect.w + " , " + this.multiSelectRect.h, 30, 40);

    this.drawId = requestAnimationFrame(this.draw);
  }

  gridSize = 20;

  /**
   * 绘制网格
   */
  drawGrid() {
    
    let showGridSize = this.viewScale / 100 * this.gridSize;
    let gridOffx = this.viewPort.x % showGridSize;
    let gridOffy = this.viewPort.y % showGridSize;
    let count = 0;

    this.ctx.lineWidth = 1;

    count = Math.floor(this.viewPort.x / showGridSize) ;

    for(let i = -gridOffx,
        end = i + this.viewRealSize.w; i <= end;i += showGridSize) {

      count++;

      if(count % 5 == 0)this.ctx.strokeStyle = "#aaa";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "#e8e8e8";

      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.viewRealSize.h);
      this.ctx.closePath();
      this.ctx.stroke();


    }
    count = Math.floor(this.viewPort.y / showGridSize);

    for(let i = -gridOffy, end = i + this.viewRealSize.h; i <= end;i += showGridSize) {

      count++; 

      if(count % 5 == 0) this.ctx.strokeStyle = "#aaa"; 
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "#e8e8e8";

      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.viewRealSize.w, i);
      this.ctx.closePath();
      this.ctx.stroke();      
    }
  }

  /**
   * 绘制多选的框框
   */
  drawMultiSelBox() {
    if(this.isMultiSelecting) {
      this.ctx.fillStyle = "rgba(36, 114, 200, 0.4)";
      this.ctx.fillRect(this.mouseDownPos.x, this.mouseDownPos.y, 
          this.mouseCurrentPos.x - this.mouseDownPos.x, this.mouseCurrentPos.y - this.mouseDownPos.y);
      this.ctx.strokeStyle = "rgba(79, 184, 254)";
      this.ctx.strokeRect(this.mouseDownPos.x, this.mouseDownPos.y, 
          this.mouseCurrentPos.x - this.mouseDownPos.x, this.mouseCurrentPos.y - this.mouseDownPos.y)
    }
  }

  // 节点管理
  //=======================

  allBlocks = {};

  registerBlock(blockdef : BlockRegData) {
    if(this.getRegisteredBlock(blockdef.guid)) {
      console.warn("[registerBlock] Block guid " + blockdef.guid + " alreday registered !");
      return;
    }
    this.allBlocks[blockdef.guid] = blockdef;
  }
  getRegisteredBlock(guid : string) {
    return this.allBlocks[guid];
  }
  unregisterBlock(guid : string) {
    this.allBlocks[guid] = undefined;
  }



  // 逻辑控制
  //=======================

  isMultiSelecting = false;
  isMoveBlock = false;
  isDragView = false;

  isMultiSelected = false;
  isMoveedBlock = false;

  // 鼠标逻辑控制
  //=======================

  multiSelectRect = new Rect();
  mouseLeftMove = false;

  mouseDowned = false;
  mouseDownPos : Vector2 = new Vector2();
  mouseDownViewPortPos : Vector2 = new Vector2();
  mouseDownBlockPos : Vector2 = new Vector2();
  mouseCurrentPos : Vector2 = new Vector2();
  mouseCurrentPosInViewPort : Vector2 = new Vector2();

  unSelectAllBlocks() {
    for(var i=0;i<this.blocks.length;i++) this.blocks[i].updateSelectStatus(false);
  }

  updateMousePos(e : MouseEvent) {
    this.mouseCurrentPos.x = e.x;
    this.mouseCurrentPos.y = e.y - this.toolBarHeight;
    this.mouseCurrentPosInViewPort.x = this.viewPort.x + e.x;
    this.mouseCurrentPosInViewPort.y = this.viewPort.y + e.y - this.toolBarHeight;
  }

  onMouseDown(e : MouseEvent) {
    this.mouseDowned = true;
    this.mouseDownPos.x = e.x;
    this.mouseDownPos.y = e.y - this.toolBarHeight;
    this.updateMousePos(e);

    this.isMultiSelected = false;
    this.isMoveedBlock = false;

    this.mouseDownViewPortPos.x = this.viewPort.x;
    this.mouseDownViewPortPos.y = this.viewPort.y;
    
    if(e.buttons == 1) {
      //多选
      if(this.mouseLeftMove) {
        //移动视图
        this.isDragView = true;

      } else {
        this.isMultiSelecting = true;
        this.multiSelectRect.setPos(this.mouseCurrentPosInViewPort);
      }
    }else if(e.buttons == 2) {
      //移动视图
      this.isDragView = true;
    }

    document.addEventListener('mousemove', this.onMouseMove.bind(this));
  }
  onMouseUp(e : MouseEvent) {

    if(!this.isMultiSelected) {
      this.unSelectAllBlocks();
    }

    this.mouseDowned = false;
    this.isMoveBlock = false;
    this.isMultiSelecting = false;
    this.isDragView = false;
    
    this.updateMousePos(e);

    document.removeEventListener('mousemove', this.onMouseMove.bind(this));
  }
  onMouseMove(e : MouseEvent) {
    this.updateMousePos(e);

    if(this.mouseDowned) { 
      if(this.isMultiSelecting) {
        //多选
        this.multiSelectRect.Set(undefined, undefined,
            this.mouseCurrentPosInViewPort.x - this.multiSelectRect.x, 
            this.mouseCurrentPosInViewPort.y - this.multiSelectRect.y);

        for(var i=0;i<this.blocks.length;i++) {
          this.blocks[i].updateSelectStatus(this.blocks[i].getRect().testRectCross(this.multiSelectRect));
        }

        this.isMultiSelected = true;

      }else if(this.isDragView) {
        //移动视图
        this.viewPort.x = this.mouseDownViewPortPos.x - (this.mouseCurrentPos.x - this.mouseDownPos.x);
        this.viewPort.y = this.mouseDownViewPortPos.y - (this.mouseCurrentPos.y - this.mouseDownPos.y);
        if(this.viewPort.x < 0) this.viewPort.x = 0;
        if(this.viewPort.y < 0) this.viewPort.y = 0;
        this.recalcViewPort();
      }
    } 
  }
  onMouseWhell(e : MouseEvent) {

  }

  // 测试
  //=======================

  test2() {
    this.viewPort.y--;
    this.recalcViewPort();
  }  
  test1() {
    this.viewPort.y++;
    this.recalcViewPort();
  }
  test3() {
    this.addBlock(new Block(this.getRegisteredBlock("DDDB2039-9876-15D1-3410-FCD04941C750")), this.viewPort.calcCenter());
  }

  initDebug() {
    this.registerBlock({
      guid: "DDDB2039-9876-15D1-3410-FCD04941C750",
      name: "Test block",
      description: "This is a single block. Useage: unknow.",
      logo: "",
      logoRight: "",
      logoBottom: "",
      category: '',
      author: 'imengyu',
      version: '2.0',
      ports : [
        {
          name: "入口",
          description: '默认入口节点',
          direction: 'input'
        },
        {
          name: "出口",
          description: '默认出口节点',
          direction: 'output'
        },
      ],
      parameters :[],
      onPortActive : (block, port) => {},
      onParameterUpdate : (block, port) => {},
    });
  }

  // 块控制
  //=======================


  addBlock(block : Block, position : Vector2, connectToPort ?: any) {
    this.blocks.push(block);

    block.create(this.blockHost);
    block.setPos(position);
    
  }
  deleteBlock(block : Block) {
    block.destroy(this.blockHost);

    this.blocks.remove(block);
  }


  // 整体控制
  //=======================

  onWindowSizeChanged() {
    this.viewRealSize.w = this.editor.offsetWidth;
    this.viewRealSize.h = this.editor.offsetHeight;

    let editorHost = <HTMLCanvasElement>document.getElementById("editorHost");
    this.editor.width = editorHost.offsetWidth;
    this.editor.height = editorHost.offsetHeight;
  }
  init() {  
    this.editorHost = <HTMLDivElement>document.getElementById("editor");
    this.editor = <HTMLCanvasElement>document.getElementById("editor");
    this.blockHost = <HTMLDivElement>document.getElementById("blockHost");
    this.ctx = this.editor.getContext("2d");
    this.editorHost.addEventListener('mousedown', this.onMouseDown);
    this.editorHost.addEventListener('mouseup', this.onMouseUp);
    this.editorHost.addEventListener('wheel', this.onMouseWhell);
    this.initDebug();
  }
  destroy() {
    this.editorHost.removeEventListener('mousedown', this.onMouseDown);
    this.editorHost.removeEventListener('mouseup', this.onMouseUp);
    this.editorHost.removeEventListener('wheel', this.onMouseWhell);
  }

  mounted() {

    window.addEventListener('resize', () => this.onWindowSizeChanged);

    this.init();
    this.onWindowSizeChanged();
    this.recalcViewPort();
    this.draw();
  }
  beforeDestroy() {
    this.drawStop();
    this.destroy();
    window.removeEventListener('resize', () => this.onWindowSizeChanged);
  }

}
</script>

<style lang="scss">

$toolbar-height: 45px;

.toolbar {
  position: absolute;
  height: $toolbar-height;
  left: 0;
  right: 0;
  top: 0;
  background-color: #f7f7f7;
  border: 1px solid #eeefff;
  display: flex;
  justify-content: flex-start;
  align-items: center;
  user-select: none;

  > div {
    height: $toolbar-height;
    line-height: $toolbar-height;
  }
  .button {
    text-align: center;
    display: inline-block;
    padding: 5px 8px;
    cursor: pointer;
    font-size: 18px;
    user-select: none;

    &.icon {
      width: $toolbar-height;
      font-size: 23px;
    }

    &:hover, &.active {
      background-color: #dfdfdf;
    }
    &:focus {
      opacity: 0.8;
    }
  }
  .separator {
    display: inline-block;
    width: 1px;
    height: 33px;
    margin: 4px 3px 0 3px;
    background-color: #eeefff;
  }
  .block {
    display: inline-block;
    padding: 5px 8px;
  }
}

.main {
  display: block;
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  top: $toolbar-height;

  #editor {
    width: 100%;
    height: 100%;
  }
  .editor {
    display: block;
    position: absolute;
    background-color: #ffffff;
    left: 0;
    top: 0;
    bottom: 0;
    right: 0;
  }
  .prop {
    position: absolute;
    background-color: #f7f7f7;
    border: 1px solid #eeefff;
    top: 0;
    bottom: 0;
    right: 0;
  }


}
</style>

