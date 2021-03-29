import MathUtils from '../../utils/MathUtils'
import { Rect } from '../Rect';

export class ConnectorDrawer {

  public posData2 = new Array<number>();
  
  /**
   * 绘制连接的贝塞尔曲线
   * @param ctx 绘图
   * @param startPos 开始坐标
   * @param endPos 结束坐标
   * @param viewPort 视口
   * @param viewZoom 缩放级别
   * @param pointPrecent 移动点的位置百分比（0-1），为负数则不显示
   */
  drawConnectorBezierCurve(ctx : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number, viewPort: Rect, viewZoom: number, hover = false, pointPrecent = -1, willHide = false) {
    
    let yAbs = Math.abs(y2 - y1) * viewZoom; 
    let xAbs = Math.abs(x2 - x1) * viewZoom; 

    if(yAbs==0) yAbs=1;
    if(xAbs==0) xAbs=1;

    let yOff = ((x2 < x1 && yAbs < 100) ? (100 / yAbs * 2) : 0);
    let xOff = xAbs > 200 ? 200 : xAbs;

    if(x2 < x1 && xOff < 100) xOff = 100;
    else if(yAbs < 30) xOff = xAbs / 2;
    else if(xAbs <= 66 && yAbs >= 30) xOff = 100;

    this.posData2 = [
      x1, y1,
      x1 + xOff, y1 + yOff, 
      x2 - xOff, y2 - yOff, 
      x2, y2
    ];
    let pos = [
      x1 - viewPort.x, y1 - viewPort.y,
      x1 - viewPort.x + xOff, y1 - viewPort.y + yOff, 
      x2 - viewPort.x - xOff, y2 - viewPort.y - yOff, 
      x2 - viewPort.x, y2 - viewPort.y
    ];

    ctx.beginPath();
    ctx.moveTo(pos[0], pos[1]);
    ctx.bezierCurveTo(pos[2], pos[3], pos[4], pos[5], pos[6], pos[7]);
    ctx.stroke();

    if(hover) {
      ctx.lineWidth = 5;
      ctx.globalAlpha = 0.3;
      ctx.beginPath();
      ctx.moveTo(pos[0], pos[1]);
      ctx.bezierCurveTo(pos[2], pos[3], pos[4], pos[5], pos[6], pos[7]);
      ctx.stroke();
      ctx.globalAlpha = 1;
    }

    if(pointPrecent >= 0) {
      let allWidth = Math.abs(x2 - x1);
      let dots = [];

      for(let i = pointPrecent * allWidth; i >= 0; i -= 46) dots.push(i / allWidth);
      for(let i = pointPrecent * allWidth; i < allWidth; i += 46) dots.push(i / allWidth);

      if(pointPrecent > 0.8 && willHide)
        ctx.globalAlpha = (1 - pointPrecent) / 0.2;

      dots.forEach((dotv) => {
        let of = MathUtils.threeOrderBezier(dotv, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5], pos[6], pos[7]);

        ctx.beginPath();
        ctx.arc(of[0], of[1], 5, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
      });

      ctx.globalAlpha = 1;
    }
  }
}