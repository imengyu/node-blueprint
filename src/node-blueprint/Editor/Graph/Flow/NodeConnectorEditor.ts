import { NodeConnector, type INodeConnectorDefine } from "@/node-blueprint/Base/Flow/Node/NodeConnector";
import { Vector2 } from "@/node-blueprint/Base/Utils/Base/Vector2";
import { Rect } from "@/node-blueprint/Base/Utils/Base/Rect";
import { ConnectorDrawer } from "../Render/ConnectorDrawer";
import type { ChunkInstance } from "../Cast/ChunkedPanel";
import type { NodePortEditor } from "./NodePortEditor";
import type { NodeGraphEditorViewport } from "../NodeGraphEditor";
import { threeOrderBezier } from "../../Utils/BezierUtils";

let _debug = false;

/**
 * 节点连接线编辑器类
 */
export class NodeConnectorEditor extends NodeConnector {

  constructor(define?: INodeConnectorDefine) {
    super(define);
  }

  public static setRenderDebugInfo(on: boolean) {
    _debug = on;
  }

  public hover = false;
  public hoverChecked = false;
  public selected = false;

  public chunkInfo : ChunkInstance|null = null;
  public state : 'normal'|'active'|'error' = 'normal';

  private drawer = new ConnectorDrawer();
  private rect = new Rect();
  private startPos = new Vector2();
  private endPos = new Vector2();
  private startColor = '#efefef';
  private endColor = '#efefef';
  private colorGradient : null|CanvasGradient = null;
  private colorGradientNeedCreate = false;
  private dotPos = 0;

  public forceSetPos(_startPos: Vector2|undefined, _endPos: Vector2|undefined) {
    if (_startPos)
      this.startPos.set(_startPos);
    if (_endPos)
      this.endPos.set(_endPos);
  }
  /**
   * 检查某个点是否在连接线上
   * @param pos 要检查的点 (视口坐标)
   * @param screenPos 要检查的点 (视口坐标)
   */
  public testInConnector(pos: Vector2, screenPos: Vector2) : boolean {
    const x1 = this.rect.x;
    const x2 = this.rect.getRight();
    const xPec = (pos.x - x1) / (x2 - x1);
    if(xPec >= 0 && xPec <= 1) {
      const p = this.drawer.posData2;
      const pp = threeOrderBezier(xPec, p[0], p[1], p[2], p[3], p[4], p[5], p[6], p[7]);
      const o = Math.abs(pp[1] - screenPos.y);
      return o <= 20;
    }
    return false;
  }
  /**
   * 更新区位信息
   */
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

      if (this.colorGradient)
        this.colorGradientNeedCreate = true;
    }
    return this.rect;
  }
  /**
   * 当端口类型更改之后，同步更新连接线颜色
   */
  public updatePortValue() : void {
    if(this.startPort && this.endPort) {
      this.startColor = (this.startPort as NodePortEditor).getTypeColor();
      this.endColor = (this.endPort as NodePortEditor).getTypeColor();
      if(this.startColor === this.endColor) {
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

  private tempPoint1 = new Vector2();
  private tempPoint2 = new Vector2();
  private tempRect = new Rect();

  public render(viewPort : NodeGraphEditorViewport, ctx : CanvasRenderingContext2D) : void {

    viewPort.viewportPointToEditorPoint(this.startPos, this.tempPoint1);
    viewPort.viewportPointToEditorPoint(this.endPos, this.tempPoint2);

    //鼠标悬浮时线加粗
    if(this.hover) ctx.lineWidth = 3;
    else if(this.selected) ctx.lineWidth = 3;
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
      if(this.startPort !== null) {

        //渐变的创建
        if(this.colorGradientNeedCreate) {
          this.colorGradientNeedCreate = false;
          this.colorGradient = ctx.createLinearGradient(
            this.tempPoint1.x, this.tempPoint1.y, 
            this.tempPoint2.x, this.tempPoint2.y, 
          );
          this.colorGradient.addColorStop(0.2,this.startColor);
          this.colorGradient.addColorStop(0.8, this.endColor);
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
    this.drawer.drawConnectorBezierCurve(ctx, this.tempPoint1.x, this.tempPoint1.y, this.tempPoint2.x, this.tempPoint2.y, this.hover, this.dotPos, false);
 
    //绘制调试信息
    if (_debug) {
      this.tempRect.setFrom2Point(this.tempPoint1, this.tempPoint2);
      ctx.fillText(this.uid, this.tempRect.x + this.tempRect.w / 2, this.tempRect.y - 50);
    }
  }
}