import { Rect } from "../Rect";
import CanvasUtils from "../../utils/CanvasUtils";
import CommonUtils from "../../utils/CommonUtils";
import { Vector2 } from "../Vector2";
import { Connector } from "../Define/Connector";
import { BlockPort } from "../Define/Port";
import { BlockPortEditor } from "./BlockPortEditor";

export class ConnectorEditor extends Connector {

  public startPort : BlockPortEditor = null;
  public endPort : BlockPortEditor = null;
  public selected = false;
  public hover = false;
  public actived = false;
  public forceActive = false;
  public drawPos = false;
  public currentRunner = null;
  public valText = '';
  public inited = false;

  public static flexableCoonSource = 1;
  public flexableCoonIndex = 0;

  private rect : Rect = new Rect();
  private dotPos = -1;
  private valTextRows = [];
  private valTextWidth = 0;
  private valTextHeight = 0;
  private activeCount = 0;
  private activeMaxCount = 2;

  public testInRect(pos : Vector2, viewZoom: number) {
    let startPos = this.startPort.editorData.getPosition();
    let endPos = this.endPort.editorData.getPosition();

    let x1 = startPos.x * viewZoom - 1, x2 = endPos.x * viewZoom + 2, 
    y1 = startPos.y * viewZoom - 1, y2 = endPos.y * viewZoom + 2;

    this.rect.Set(x1, y1, x2 - x1, y2 - y1);
    return this.rect.testInRect(pos);
  }
  public testRectCross(rect : Rect, viewZoom: number) {
    let startPos = this.startPort.editorData.getPosition();
    let endPos = this.endPort.editorData.getPosition();

    let x1 = startPos.x * viewZoom, x2 = endPos.x * viewZoom, 
    y1 = startPos.y * viewZoom, y2 = endPos.y * viewZoom;

    this.rect.Set(x1, y1, x2 - x1, y2 - y1);
    return this.rect.testRectCross(rect);
  }

  public updateValueText(val : string) {
    this.valTextWidth = 0;
    this.valText = '传递值：' + val;
    this.valTextRows = [];
  }
  public active(port : BlockPort) {
    this.actived = true;
    this.activeCount = 0;
    this.dotPos = 0.8;

    if(port && !port.paramType.isExecute()) 
      this.updateValueText(port.getValue(port.parent.currentRunningContext));
  }
  public clearActive() {
    this.actived = false;
    this.dotPos = -1;
  }

  public drawLineInPos(ctx : CanvasRenderingContext2D, viewPort: Rect, viewZoom : number, startPos : Vector2, endPos : Vector2) {

    let x1 = startPos.x * viewZoom, x2 = endPos.x * viewZoom, 
    y1 = startPos.y * viewZoom, y2 = endPos.y * viewZoom;

    if(viewPort.testInRectXY(x1, y1) || viewPort.testInRectXY(x2, y2)) 
    {
      if(this.selected || this.hover) ctx.lineWidth = 3;
      else ctx.lineWidth = 1.5;

      if(this.drawPos) {
        ctx.fillText(x1.toFixed(2) + ',' + y1.toFixed(2), x1 + 60 - viewPort.x, y1 + 20 - viewPort.y);
        ctx.fillText(x2.toFixed(2) + ',' + y2.toFixed(2), x2 - 66 - viewPort.x, y2 + 30 - viewPort.y);
      }

      if(this.actived) {
        //Drawdot
        this.dotPos += 0.01;
        if(this.dotPos >= 1) {
          if(this.activeCount > this.activeMaxCount) {
            this.dotPos = -1;
            this.actived = false;
          }else {
            if(!this.currentRunner.stepMode)
              this.activeCount ++;
            this.dotPos = 0;
          }
        }
      }

      if(!CommonUtils.isNullOrEmpty(this.startPort.editorData.elDot.style.color)) {
        ctx.strokeStyle = this.startPort.editorData.elDot.style.color;
        ctx.fillStyle = this.startPort.editorData.elDot.style.color;
      } else {
        ctx.strokeStyle = '#efefef';
        ctx.fillStyle = ctx.strokeStyle;
      }

      CanvasUtils.drawConnectorBezierCurve(ctx, x1, y1, x2, y2, viewPort, this.hover, this.dotPos, this.activeCount >= this.activeMaxCount);
      
      //Draw value
      if(this.actived || this.hover) {
        if(this.valTextWidth == 0){
          let m = ctx.measureText(this.valText);
          if(m.width > 300){
            let line = m.width / 300;
            this.valTextWidth = 300;
            this.valTextHeight = 15 * line;
            let temp = '';
            for(var a = 0; a < this.valText.length; a++){
              if(ctx.measureText(temp).width < 300){
                ;
              }
              else{
                this.valTextRows.push(temp);
                temp = "";
              }
              temp += this.valText[a];
            }
          }
          else {
            this.valTextWidth = m.width;
            this.valTextHeight = 15;
            this.valTextRows.push(this.valText);
          }
        }
        if(this.valText != "") {
          let x = x1 + (x2 - x1) / 2 - this.valTextWidth / 2, y = y1 + (y2 - y1) / 2;
          CanvasUtils.drawTextBox(ctx, x, y, this.valTextWidth, this.valTextHeight, 14, viewPort, this.valTextRows, 3, 5);
        }
      }
    }
  }

  public draw(ctx : CanvasRenderingContext2D, viewPort: Rect, viewZoom : number) {

    let startPos = this.startPort.editorData.getPosition();
    let endPos = this.endPort.editorData.getPosition();

    this.drawLineInPos(ctx, viewPort, viewZoom, startPos, endPos);
  }
}