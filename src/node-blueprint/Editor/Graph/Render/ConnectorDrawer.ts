import { threeOrderBezier } from "../../Utils/BezierUtils";

/**
 * 节点连接线编辑器绘制类
 */
export class ConnectorDrawer {

  public posData2 = new Array<number>();
  
  /**
   * 绘制连接的贝塞尔曲线
   * @param ctx 绘图
   * @param startPos 开始坐标
   * @param endPos 结束坐标
   * @param viewPort 视口
   * @param pointPrecent 移动点的位置百分比（0-1），为负数则不显示
   */
  drawConnectorBezierCurve(ctx : CanvasRenderingContext2D, 
    x1 : number, y1 : number, x2 : number, y2 : number,
    hover = false, pointPrecent = -1) : void {
    
    let yAbs = Math.abs(y2 - y1); 
    let xAbs = Math.abs(x2 - x1); 

    if(xAbs <= 1 && yAbs <= 1)
      return;

    if(yAbs === 0) yAbs=1;
    if(xAbs === 0) xAbs=1;

    const yOff = ((x2 < x1 && yAbs < 100) ? (100 / yAbs * 2) : 0);
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
    const pos = [
      x1, y1,
      x1 + xOff, y1 + yOff, 
      x2 - xOff, y2 - yOff, 
      x2, y2
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

    function renderDot(dotv : number) {
      const of = threeOrderBezier(dotv, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5], pos[6], pos[7]);

      ctx.beginPath();
      ctx.arc(of[0], of[1], 5, 0, Math.PI*2, true);
      ctx.closePath();
      ctx.fill();
    }

    if(pointPrecent >= 0) {
      const allWidth = Math.abs(x2 - x1);
      const space = allWidth / Math.floor(allWidth / 500 * 10);

      for(let i = pointPrecent * allWidth; i >= 0; i -= space) 
        renderDot(i / allWidth);
      for(let i = pointPrecent * allWidth; i < allWidth; i += space) 
        renderDot(i / allWidth);

      ctx.globalAlpha = 1;
    }
  }
}