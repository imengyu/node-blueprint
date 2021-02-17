import { Rect } from "../model/Rect";
export default {
  drawRoundedRect,
  drawTextBox,
  colorStrWithAlpha,
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
    let v = str.substring(4, str.length - 1);
    return 'rgba(' + v + ',' + alpha + ')';
  }else if(str.startsWith('rgba(') && str.endsWith(')')) {
    let v = str.substring(5, str.length - 1);
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