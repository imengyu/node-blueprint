import { Rect } from "../Rect";
import CanvasUtils from "../../utils/CanvasUtils";
import CommonUtils from "../../utils/CommonUtils";
import { Vector2 } from "../Vector2";
import { Connector } from "../Define/Connector";
import { BlockPort } from "../Define/Port";
import { BlockPortEditor } from "./BlockPortEditor";
import MathUtils from "../../utils/MathUtils";
import { ConnectorDrawer } from "./ConnectorDrawer";
import { BlockRunner } from "../Runner/Runner";

export class ConnectorEditor extends Connector {

  public startPort : BlockPortEditor = null;
  public endPort : BlockPortEditor = null;
  public selected = false;
  public hover = false;
  public actived = false;
  public forceActive = false;
  public currentRunner : BlockRunner = null;
  public valText = '';
  public inited = false;

  private drawer = new ConnectorDrawer();

  public static flexableCoonSource = 1;
  public flexableCoonIndex = 0;

  private rect : Rect = new Rect();
  private dotPos = -1;
  private valTextRows : string[] = [];
  private valTextWidth = 0;
  private valTextHeight = 0;
  private activeCount = 0;
  private activeMaxCount = 2;

  /**
   * 检查某个点是否在连接线上
   * @param pos 要检查的点
   * @param viewZoom 视图缩放系数
   */
  public testInConnector(pos : Vector2, viewZoom: number) : boolean {
    let startPos = this.startPort.editorData.getPosition();
    let endPos = this.endPort.editorData.getPosition();

    let x1 = startPos.x * viewZoom - 1, x2 = endPos.x * viewZoom + 2, 
    y1 = startPos.y * viewZoom - 1, y2 = endPos.y * viewZoom + 2;

    this.rect.Set(x1, y1, x2 - x1, y2 - y1);
    this.rect.expand(5);
    if(this.rect.testInRect(pos)) {
      let xPec = (pos.x - x1) / (x2 - x1);
      if(xPec >= 0 && xPec <= 1) {
        let p = this.drawer.posData2;
        let pp = MathUtils.threeOrderBezier(xPec, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
        let o = Math.abs(pp[1] - pos.y);
        return o <= 20;
      }
    }
    return false;
  }
  /**
   * 刷新连接线上的数字
   * @param val 数字
   */
  public updateValueText(val : string) {
    this.valTextWidth = 0;
    this.valText = '传递值：' + val;
    this.valTextRows = [];
  }
  /**
   * 转为激活状态
   * @param port 端口
   */
  public active(port : BlockPort) {
    this.actived = true;
    this.activeCount = 0;
    this.dotPos = 0.8;

    if(port && !port.paramType.isExecute()) 
      this.updateValueText(port.getValue(port.parent.currentRunningContext));
  }
  /**
   * 清空激活状态
   */
  public clearActive() {
    this.actived = false;
    this.dotPos = -1;
  }



  private drawLineInPos(ctx : CanvasRenderingContext2D, x1 : number, x2 : number, y1 : number, y2 : number, viewPort: Rect, viewZoom : number) {

    if(viewPort.testInRectXY(x1, y1) || viewPort.testInRectXY(x2, y2))  {

      //鼠标悬浮时线加粗
      if(this.selected || this.hover || this.actived) ctx.lineWidth = 3;
      else ctx.lineWidth = 1.5;

      //移动线上的点
      if(this.actived) {
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

      //绘制
      this.drawer.drawConnectorBezierCurve(ctx, x1, y1, x2, y2, viewPort, viewZoom, this.hover, this.dotPos, this.activeCount >= this.activeMaxCount);
    }
  }

  /**
   * 绘制
   * @param ctx Canvas上下文
   * @param viewPort 视口
   * @param viewZoom 视口缩放系数
   */
  public draw(ctx : CanvasRenderingContext2D, viewPort: Rect, viewZoom : number) {

    let startPos = this.startPort.editorData.getPosition();
    let endPos = this.endPort.editorData.getPosition();
    let centerPos = MathUtils.calcVectorCenter(startPos, endPos);

    let x1 = startPos.x * viewZoom, x2 = endPos.x * viewZoom, 
      y1 = startPos.y * viewZoom, y2 = endPos.y * viewZoom;

    //绘制样式
    if(this.startPort.editorData.elDot != null && !CommonUtils.isNullOrEmpty(this.startPort.editorData.elDot.style.color)) {
      ctx.strokeStyle = this.startPort.editorData.elDot.style.color;
      ctx.fillStyle = this.startPort.editorData.elDot.style.color;
    } else {
      ctx.strokeStyle = '#efefef';
      ctx.fillStyle = ctx.strokeStyle;
    }

    //绘制线条
    this.drawLineInPos(ctx, x1, x2, y1, y2, viewPort, viewZoom);

    //绘制鼠标移动到上面
    if(this.hover || this.selected) {
      //绘制鼠标移动到上面时的点
      ctx.beginPath();
      ctx.arc(centerPos.x - 2.5, centerPos.y - 2.5, 5, 0, Math.PI*2, true);
      ctx.closePath();
      ctx.fill();

      //绘制参数显示
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