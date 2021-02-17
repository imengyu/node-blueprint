<template>
  <canvas ref="canvas" class="editorCanvas" @contextmenu="onContextMenu($event)" :width="viewRealSize.w" :height="viewRealSize.h">
    你的浏览器不支持 canvas，请升级你的浏览器
  </canvas>
</template>

<script lang="ts">
import { Component, Prop, Vue, Watch } from "vue-property-decorator";
import { ConnectorEditor } from "../model/Editor/ConnectorEditor";
import { Rect } from "../model/Rect";

/**
 * 编辑器背景绘制控制
 */
@Component
export default class BlockEditorCanvasDrawer extends Vue {

  @Prop({default: null}) connectors : Array<ConnectorEditor>;

  ctx : CanvasRenderingContext2D = null;
  canvas : HTMLCanvasElement = null;

  drawTick = 0;
  drawFps = 0;
  drawId = 0;
  @Prop({default: false}) drawDebugInfo : boolean;
  drawDebugInfoItems : Array<() => string> = [];

  public addDebugInfoItem(v : () => string) {
    return this.drawDebugInfoItems.push(v) - 1;
  }
  public removeDebugInfoItem(index : number) {
    this.drawDebugInfoItems.remove(index);
  }

  public drawStop() {
    cancelAnimationFrame(this.drawId);
  }
  public draw() {

    this.ctx.fillStyle = "rgb(93,93,93)";
	  this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.width);

    if(this.gridShow) 
      this.drawGrid();
    this.drawMultiSelBox();

    //Debug text
    if(this.drawDebugInfo){
      this.ctx.fillStyle = "#fff";
      this.ctx.strokeStyle = "#fff";
      
      
      let h = 20;
      this.ctx.fillText(this.drawFpsShow, 30, h);
      this.drawDebugInfoItems.forEach((k) => {
        h += 10;
        this.ctx.fillText(k(), 20, h);
      });
    }

    if(this.drawTick < Number.MAX_SAFE_INTEGER) this.drawTick++;
    else this.drawTick = 0;
    
    if(this.drawTick % 5 == 0) 
      this.drawFpsShow = "fps : " + this.drawFps.toFixed(2);
    if(this.drawTick % 50 == 0) 
      this.$emit('late-tick');

    this.drawFps = this.calculateFps();
    this.drawId = requestAnimationFrame(this.draw);
  }

  lastTime = 0;
  drawFpsShow = '';

  calculateFps() {
    var now = (+new Date), fps = 1000/(now - this.lastTime);
    this.lastTime = now;
    return fps;
  }

  @Prop({default: null}) viewPort : Rect;
  @Prop({default: 1}) viewZoom : number;
  @Prop({default: 100}) viewScale: number;
  @Prop({default: () => { return { w: 0, h: 0 } } }) viewRealSize : { w: number, h: number };
  @Prop({default: false}) isMultiSelecting : boolean;
  @Prop({default: null}) multiSelectRect : Rect;

  @Watch('viewRealSize')
  onViewRealSizeChanged() {
    if(this.canvas != null) {
      this.canvas.width = this.viewRealSize.w;
      this.canvas.height = this.viewRealSize.h;
    }
  }

  @Prop({default: true}) gridShow : boolean;
  @Prop({default: 20}) gridSize : number;

  private drawGrid() {
    
    let showGridSize = this.viewZoom * this.gridSize;
    let gridOffx = this.viewPort.x % showGridSize;
    let gridOffy = this.viewPort.y % showGridSize;
    let count = 0;

    this.ctx.lineWidth = 0.5;
    this.ctx.strokeStyle = "rgb(52,52,52)";

    count = Math.floor(this.viewPort.x / showGridSize) ;

    for(let i = -gridOffx,
        end = i + this.viewRealSize.w; i <= end;i += showGridSize) {

      count++;

      if(count % 5 == 0) this.ctx.strokeStyle = "rgb(22,22,22)";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "rgb(52,52,52)";

      this.ctx.beginPath();
      this.ctx.moveTo(i, 0);
      this.ctx.lineTo(i, this.viewRealSize.h);
      this.ctx.closePath();
      this.ctx.stroke();


    }
    count = Math.floor(this.viewPort.y / showGridSize);

    this.ctx.strokeStyle = "rgb(52,52,52)";

    for(let i = -gridOffy, end = i + this.viewRealSize.h; i <= end;i += showGridSize) {

      count++; 

      if(count % 5 == 0) this.ctx.strokeStyle = "rgb(22,22,22)";
      else if(this.viewScale < 70) continue;
      else this.ctx.strokeStyle = "rgb(52,52,52)";

      this.ctx.beginPath();
      this.ctx.moveTo(0, i);
      this.ctx.lineTo(this.viewRealSize.w, i);
      this.ctx.closePath();
      this.ctx.stroke();      
    }

  }
  private drawMultiSelBox() {
    if(this.isMultiSelecting) {
      this.ctx.fillStyle = "rgba(36, 114, 200, 0.4)";
      this.ctx.fillRect(this.multiSelectRect.x - this.viewPort.x, this.multiSelectRect.y - this.viewPort.y, this.multiSelectRect.w, this.multiSelectRect.h);
      this.ctx.strokeStyle = "rgba(79, 184, 254)";
      this.ctx.strokeRect(this.multiSelectRect.x, this.multiSelectRect.y, this.multiSelectRect.w, this.multiSelectRect.h)
    }
  }
  private onContextMenu(e : MouseEvent) {
    e.preventDefault();
    this.$emit('contextmenu', e);
    return false;
  }
  mounted() {
    setTimeout(() => {
      this.canvas = (<HTMLCanvasElement>this.$refs.canvas);
      this.ctx = this.canvas.getContext("2d");
      this.ctx.textBaseline = 'top';
      this.ctx.textAlign = 'left';
      this.ctx.font = 'Arial 14px';
      this.draw();
    }, 300);
  }
  beforeDestroy() {
    this.drawStop();
  }
}

</script>