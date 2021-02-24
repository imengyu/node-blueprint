import { Vector2 } from "../model/Vector2";

export default {
  calcVectorCenter,
  threeOrderBezier,
}

/**
 * 计算两个坐标的矩形中心点
 * @param vec1 坐标1
 * @param vec2 坐标2
 */
function calcVectorCenter(vec1 : Vector2, vec2 : Vector2) {
  
  let x1 = vec1.x, x2 = vec2.x;
  let y1 = vec1.y, y2 = vec2.y;

  let xc, yc;

  if(x1 < x2) xc = x1 + (x2 - x1) / 2;
  else xc = x2 + (x1 - x2) / 2;

  if(y1 < y2) yc = y1 + (y2 - y1) / 2;
  else yc = y2 + (y1 - y2) / 2;

  return new Vector2(xc, yc);
}
/**
 * 三次贝塞尔曲线(有两个控制点)求点的坐标
 * @param t 百分比 0-1
 * @param p1 起始点坐标
 * @param cp1 控制点1坐标
 * @param cp2 控制点2坐标
 * @param p2 终点坐标
 */
function threeOrderBezier(t : number, x1 : number, y1 : number, cx1 : number, cy1 : number, cx2 : number, cy2 : number, x2 : number, y2 : number) {
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