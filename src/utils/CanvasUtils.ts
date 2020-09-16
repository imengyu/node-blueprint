import { Rect } from "../model/Rect";
import { Vector2 } from "../model/Vector2";

export default {
  drawRoundedRect,
  drawConnectorBezierCurve,
  threeOrderBezier,
  drawTextBox,
  colorStrWithAlpha,
}

/**
 * 三次贝塞尔曲线(有两个控制点)求点的坐标
 * @param t 百分比 0-1
 * @param p1 起始点坐标
 * @param cp1 控制点1坐标
 * @param cp2 控制点2坐标
 * @param p2 终点坐标
 */
function threeOrderBezier(t, x1 : number, y1 : number, cx1 : number, cy1 : number, cx2 : number, cy2 : number, x2 : number, y2 : number) {
	var x =
		x1 * (1 - t) * (1 - t) * (1 - t) +
		3 * cx1 * t * (1 - t) * (1 - t) +
		3 * cx2 * t * t * (1 - t) +
		x2 * t * t * t;
	var y =
		y1 * (1 - t) * (1 - t) * (1 - t) +
		3 * cy1 * t * (1 - t) * (1 - t) +
		3 * cy2 * t * t * (1 - t) +
		y2 * t * t * t;
	return [x, y];
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
/**
 * 绘制连接的贝塞尔曲线
 * @param ctx 绘图
 * @param startPos 开始坐标
 * @param endPos 结束坐标
 * @param viewPort 视口
 * @param viewZoom 缩放级别
 * @param pointPrecent 移动点的位置百分比（0-1），为负数则不显示
 */
function drawConnectorBezierCurve(ctx : CanvasRenderingContext2D, x1 : number, y1 : number, x2 : number, y2 : number, viewPort: Rect, hover = false, pointPrecent = -1, willHide = false) {
  
  let yAbs = Math.abs(y2 - y1); 
  let xAbs = Math.abs(x2 - x1); 

  if(yAbs==0) yAbs=1;
  if(xAbs==0) xAbs=1;

  let yOff = ((x2 < x1 && yAbs < 100) ? (100 / yAbs * 2) : 0);
  let xOff = xAbs > 200 ? 200 : xAbs;

  if(x2 < x1 && xOff < 100) xOff = 100;
  else if(yAbs < 30) xOff = xAbs / 2;
  else if(xAbs <= 66 && yAbs >= 30) xOff = 100;

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
      let of = threeOrderBezier(dotv, pos[0], pos[1], pos[2], pos[3], pos[4], pos[5], pos[6], pos[7]);

      ctx.beginPath();
      ctx.arc(of[0], of[1], 5, 0, Math.PI*2, true);
      ctx.closePath();
      ctx.fill();
    });

    ctx.globalAlpha = 1;
  }
}

function drawTextBox(ctx : CanvasRenderingContext2D, x : number, y : number, textWidth : number, boxHeight : number, textHeight : number, viewPort: Rect, 
  str : string | string[], paddingTb : number, paddingLr : number) {

  ctx.fillStyle = 'rgba(0,0,0,0.5)';
  ctx.fillRect(x - viewPort.x, y - viewPort.y, textWidth + paddingLr * 2, boxHeight + paddingTb * 2);
  ctx.fillStyle = '#fff';

  if(typeof str == 'string')
    ctx.fillText(str, x - viewPort.x + paddingLr, y - viewPort.y + paddingTb + 10, textWidth);
  else {
    let i = 0;
    str.forEach(str1 => {
      ctx.fillText(str1, x - viewPort.x + paddingLr, y - viewPort.y + paddingTb + 10 + textHeight * i, textWidth);
      i++;
    });
  }
}

function colorStrWithAlpha(str : string, alpha : number) {
  if(str.startsWith('rgb(') && str.endsWith(')')) {
    let v = str.substring(4, str.length - 2);
    return 'rgba(' + v + ',' + alpha + ')';
  }else if(str.startsWith('rgba(') && str.endsWith(')')) {
    let v = str.substring(5, str.length - 2);
    v = v.substring(0, v.lastIndexOf(','));
    return v + alpha + ')';
  }else if(str.startsWith('#')) {
    let r = parseInt(str.length == 7 ? str.substring(1, 2) : str.substring(1, 1), 16);
    let g = parseInt(str.length == 7 ? str.substring(3, 2) : str.substring(2, 1), 16);
    let b = parseInt(str.length == 7 ? str.substring(5, 2) : str.substring(3, 1), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
    
  return str;
}