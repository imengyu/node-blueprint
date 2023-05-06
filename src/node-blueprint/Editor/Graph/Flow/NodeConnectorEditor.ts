import { NodeConnector } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { ConnectorDrawer } from "../Render/ConnectorDrawer";
import type { ChunkInstance } from "../Cast/ChunkedPanel";
import type { NodePortEditor } from "./NodePortEditor";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";
import { threeOrderBezier } from "../../Utils/BezierUtils";

/**
 * 节点连接线编辑器类
 */
export class NodeConnectorEditor extends NodeConnector {

  constructor() {
    super();
    this.updatePortValue();
  }

  public hover = false;
  public hoverChecked = false;
  public selected = false;

  public chunkInfo : ChunkInstance|null = null;
  public state : 'normal'|'active'|'error' = 'normal';

  private drawer = new ConnectorDrawer();
  private rect = new Rect();
  private rectCast = new Rect();
  private startPos = new Vector2();
  private endPos = new Vector2();
  private startColor = '#efefef';
  private endColor = '#efefef';
  private colorGradient : null|CanvasGradient = null;
  private colorGradientNeedCreate = false;
  private dotPos = 0;

  /**
   * 检查某个点是否在连接线上
   * @param pos 要检查的点
   * @param viewScale 视图缩放系数
   */
  public testInConnector(pos : Vector2, viewScale: number) : boolean {

    if(!this.startPort || !this.endPort)
      return false;

    const startPos = (this.startPort as NodePortEditor).getPortPositionViewport();
    const endPos = (this.endPort as NodePortEditor).getPortPositionViewport();
    const x1 = startPos.x * viewScale - 1, x2 = endPos.x * viewScale + 2, 
      y1 = startPos.y * viewScale - 1, y2 = endPos.y * viewScale + 2;

    this.rectCast.set(x1, y1, x2 - x1, y2 - y1);
    this.rectCast.expand(5);
    if(this.rectCast.testInRect(pos)) {
      const xPec = (pos.x - x1) / (x2 - x1);
      if(xPec >= 0 && xPec <= 1) {
        const p = this.drawer.posData2;
        const pp = threeOrderBezier(xPec, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
        const o = Math.abs(pp[1] - pos.y);
        return o <= 20;
      }
    }
    return false;
  }
  public updateRegion() : Rect {
    if(this.startPort && this.endPort) {
      this.startPos = (this.startPort as NodePortEditor).getPortPositionViewport();
      this.endPos = (this.endPort as NodePortEditor).getPortPositionViewport();
      this.rect = Rect.makeBy2Point(this.rect, this.startPos, this.endPos);
      //扩大一些区域方便鼠标选择
      this.rect.x -= 3;
      this.rect.y -= 3;
      this.rect.w += 6;
      this.rect.h += 6;
    }
    return this.rect;
  }
  public updatePortValue() : void {
    if(this.startPort && this.endPort) {
      this.startColor = (this.startPort as NodePortEditor).getTypeColor();
      this.endColor = (this.endPort as NodePortEditor).getTypeColor();
      if(this.startColor == this.endColor) {
        this.colorGradient = null;
        this.colorGradientNeedCreate = false;
      }
      else this.colorGradientNeedCreate = true;
    } else {
      this.startColor = '#efefef';
      this.endColor = '#efefef';
      this.colorGradient = null;
      this.colorGradientNeedCreate = false;
    }
  }
  public render(viewPort : NodeGraphEditorViewport, ctx : CanvasRenderingContext2D) : void {

    const scale = viewPort.scale;
    const x1 = this.startPos.x * scale, x2 = this.endPos.x * scale, 
      y1 = this.startPos.y * scale, y2 = this.endPos.y * scale;

    //鼠标悬浮时线加粗
    if(this.hover) ctx.lineWidth = 3;
    else if(this.selected) ctx.lineWidth = 2.5;
    else ctx.lineWidth = 2;

    //移动线上的点
    if(this.state === 'active') {
      this.dotPos += 0.01;
      if(this.dotPos >= 1) 
        this.dotPos = 0;
    } else if(this.state === 'error') {
      this.dotPos = -1;

      ctx.strokeStyle = '#d71345';
      ctx.fillStyle = ctx.strokeStyle;

    } else if(this.state === 'normal') {
      this.dotPos = -1;

      //设置绘制颜色
      if(this.startPort != null) {

        //渐变的创建
        if(this.colorGradientNeedCreate) {
          this.colorGradientNeedCreate = false;
          this.colorGradient = ctx.createLinearGradient(0, 0, this.rect.w, 0);
          this.colorGradient.addColorStop(0, this.startColor);
          this.colorGradient.addColorStop(1, this.endColor);
        } else if(this.colorGradient) {
          ctx.strokeStyle = this.colorGradient;
          ctx.fillStyle = this.colorGradient;
        } else {
          ctx.strokeStyle = this.startColor;
          ctx.fillStyle = this.startColor;
        }
      } else {
        ctx.strokeStyle = '#efefef';
        ctx.fillStyle = ctx.strokeStyle;
     }
    }

    //绘制
    this.drawer.drawConnectorBezierCurve(ctx, x1, y1, x2, y2, viewPort, this.hover, this.dotPos, false);
  }
}