export default {
  drawRoundedRect,
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
