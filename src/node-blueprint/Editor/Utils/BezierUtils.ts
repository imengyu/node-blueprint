/**
 * 三次贝塞尔曲线(有两个控制点)求点的坐标
 * @param t 百分比 0-1
 * @param p1 起始点坐标
 * @param cp1 控制点1坐标
 * @param cp2 控制点2坐标
 * @param p2 终点坐标
 */
export function threeOrderBezier(t : number, x1 : number, y1 : number, cx1 : number, cy1 : number, cx2 : number, cy2 : number, x2 : number, y2 : number) : number[] {
	const x =
		x1 * (1 - t) * (1 - t) * (1 - t) +
		3 * cx1 * t * (1 - t) * (1 - t) +
		3 * cx2 * t * t * (1 - t) +
		x2 * t * t * t;
	const y =
		y1 * (1 - t) * (1 - t) * (1 - t) +
		3 * cy1 * t * (1 - t) * (1 - t) +
		3 * cy2 * t * t * (1 - t) +
		y2 * t * t * t;
	return [x, y];
}