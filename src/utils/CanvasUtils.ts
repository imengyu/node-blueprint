import { Rect } from "../model/rect";
import { Vector2 } from "../model/vector2";

export default {
  drawRoundedRect,
  drawConnectorBezierCurve,
}


/**
 * 绘制圆角矩形
 * @param ctx 
 * @param x 
 * @param y 
 * @param width 
 * @param height 
 * @param r 圆角半径
 * @param fill 是否是填充
 * @param stroke 是否是描边
 */
function drawRoundedRect(ctx : CanvasRenderingContext2D, x : number, y : number, width : number, height : number, r : number, fill ?: boolean, stroke?: boolean) {
  ctx.save(); ctx.beginPath(); // draw top and top right corner 
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + r, r); // draw right side and bottom right corner 
  ctx.arcTo(x + width, y + height, x + width - r, y + height, r); // draw bottom and bottom left corner 
  ctx.arcTo(x, y + height, x, y + height - r, r); // draw left and top left corner 
  ctx.arcTo(x, y, x + r, y, r);
  if (fill) { ctx.fill(); }
  if (stroke) { ctx.stroke(); }
  ctx.restore(); 
}
function drawConnectorBezierCurve(ctx : CanvasRenderingContext2D, startPos : Vector2, endPos : Vector2, viewPort: Rect, viewZoom : number) {
  
  let x1 = startPos.x * viewZoom, x2 = endPos.x * viewZoom, 
    y1 = startPos.y * viewZoom, y2 = endPos.y * viewZoom;

  let yAbs = Math.abs(y2 - y1); 
  let xAbs = Math.abs(x2 - x1); 

  if(yAbs==0) yAbs=1;
  if(xAbs==0) xAbs=1;

  let yOff = ((x2 < x1 && yAbs < 100) ? (100 / yAbs * 2) : 0);
  let xOff = ((xAbs < 100) ? xAbs : 100);

  ctx.beginPath();
  ctx.moveTo(x1 - viewPort.x, y1 - viewPort.y);
  ctx.bezierCurveTo(
    x1 - viewPort.x + xOff, y1 - viewPort.y + yOff, 
    x2 - viewPort.x - xOff, y2 - viewPort.y - yOff, 
    x2 - viewPort.x, y2 - viewPort.y);
  ctx.stroke();
}
