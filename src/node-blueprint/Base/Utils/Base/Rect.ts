import type{ IKeyValueObject } from "../BaseTypes";
import { CreateObjectFactory, SerializableObject } from "../../Serializable/SerializableObject";
import { Vector2 } from "./Vector2";

CreateObjectFactory.addObjectFactory('Rect', () => new Rect());

/**
 * 矩形类 [Rectangle base class]
 */
export class Rect extends SerializableObject<IKeyValueObject> {
  public x = 0;
  public y = 0;
  public w = 0;
  public h = 0;

  /**
   * 创建一个矩形 [Create a rectangle instance]
   * @param x 点x轴坐标或一个点对象，使用对象时可不填写y [Point X-axis coordinate or a point object. If the object is used, the parameter Y will be ignored]
   * @param y 点y轴坐标 [Point Y-axis coordinate]
   * @param y 宽度 [Width]
   * @param y 高度 [Height]
   */
  public constructor(x?: number | Rect, y? : number, w? : number, h? : number) {
    super('Rect', undefined, {
      serializeSchemes: {
        default: {
          serializableProperties: [ 'x', 'y', 'w', 'h' ],
        },
      }
    });
    this.set(x || 0,y,w,h);
  }

  /**
   * 设置此矩形实例的值 [Set the value for this rectangle instance]
   * * 参数与构造函数相同 【The parameter is the same as the constructor】
   */
  public set(x: number | Rect, y? : number, w? : number, h? : number) : void {
    if(typeof x === "number") this.x = x;
    else if(typeof x === "object") {
      this.x = x.x;
      this.y = x.y;
      this.w = x.w;
      this.h = x.h;
    }
    if(typeof y !== "undefined") this.y = y;
    if(typeof w !== "undefined") this.w = w;
    if(typeof h !== "undefined") this.h = h;
  }

  /**
   * 检查点x是否处于当前矩形中 [Check whether point x is in the current rectangle]
   * @param x 点x轴坐标或一个点对象，使用对象时可不填写y [Point X-axis coordinate or a point object. If the object is used, the parameter Y will be ignored]
   * @param y 点y轴坐标 [Point Y-axis coordinate]
   * @returns 
   */
  public testInRect(x: Vector2|number, y = 0) : boolean {
    if(typeof x === 'object') {
      const point = x;
      return point.x >= this.getLeft() && point.y >= this.getTop() 
        && point.x <= this.getRight() && point.y <= this.getBottom();
    }
    else
      return x >= this.getLeft() && y >= this.getTop() 
        && x <= this.getRight() && y <= this.getBottom();
  }
  /**
   * 检查当前矩形是否与其他矩形相交 [Checks whether the current rectangle intersects with other rectangle]
   * @param rect 矩形 [Other rectangle]
   * @returns 
   */
  public testRectCross(rect : Rect) : boolean {

    /* 第一个中心点*/
    const a_cx = this.x + (this.w/2);
    const a_cy = this.y + (this.h/2);
    /* 第二个中心点*/
    const b_cx = rect.x + (rect.w/2);
    const b_cy = rect.y + (rect.h/2);

    return ((Math.abs(a_cx - b_cx) <= (this.w/2 + rect.w/2))
      && (Math.abs(a_cy - b_cy) <= (this.h/2 + rect.h/2)));
  }
  /**
   * 设置当前矩形的坐标 [Sets the coordinates of the current rectangle]
   * @param pointOrX 点x轴坐标或一个点对象，使用对象时可不填写y [Point X-axis coordinate or a point object. If the object is used, the parameter Y will be ignored]
   * @param y 点y轴坐标 [Point Y-axis coordinate]
   */
  public setPos(pointOrX : Vector2 | number, y?:number) {
    if(typeof pointOrX === "number"){
      this.x = pointOrX;
      this.y = y || this.y;
    } else {
      this.x = pointOrX.x;
      this.y = pointOrX.y;
    }
    return this;
  }
  /**
   * 设置当前矩形的大小 [Sets the size of the current rectangle]
   * @param sizeOrW 宽度或一个点对象，使用对象时可不填写h [Width value or a point object. If the object is used, the parameter h will be ignored]
   * @param h 
   */
  public setSize(sizeOrW : Vector2 | number, h?:number) {
    if(typeof sizeOrW === "number"){
      this.w = sizeOrW;
      this.h = h || this.h;
    } else {
      this.w = sizeOrW.x;
      this.h = sizeOrW.y;
    }
    return this;
  }

  /**
   * 将当前前矩与另外一个矩形合并成为更大的一个矩形（会更改当前矩形）
   * @param other 
   */
  public grow(other: Rect) {
    const l = Math.min(this.x, other.x);
    const t = Math.min(this.y, other.y);
    const r = Math.max(this.getRight(), other.getRight());
    const b = Math.max(this.getBottom(), other.getBottom());

    this.x = l;
    this.y = t;
    this.w = r - l;
    this.h = b - t;
  }

  /**
   * 将当前矩形按中心坐标，扩展指定 size 大小
   * 
   * Expand the current rectangle to the specified size according to the center coordinate
   * @param size 扩展大小 
   */
  public expand(size : number) : void {
    this.x -= size;
    this.y -= size;
    this.w += size * 2;
    this.h += size * 2;
  }
  /**
   * 将矩形坐标和大小放大指定倍数
   * 
   * Enlarges the rectangular coordinates and size by a specified factor
   * @param v 
   */
  public multiply(v : number) : void {
    this.x *= v;
    this.y *= v;
    this.w *= v;
    this.h *= v;
  }

  /**
   * 获取矩形右坐标，如果大小为负数，将自动翻转 【Get the right coordinate of the rectangle, if the size is negative, it will be flipped automatically】
   * @returns 
   */
  public getRight() : number { return this.w < 0 ? this.x : this.x + this.w; }
  /**
   * 获取矩形下坐标，如果大小为负数，将自动翻转 【Get the bottom coordinate of the rectangle, if the size is negative, it will be flipped automatically】
   * @returns 
   */
  public getBottom() : number { return this.h < 0 ? this.y : this.y + this.h; }
  /**
   * 获取矩形左坐标，如果大小为负数，将自动翻转 【Get the left coordinate of the rectangle, if the size is negative, it will be flipped automatically】
   * @returns 
   */
  public getLeft() : number { return this.w < 0 ? this.x + this.w : this.x; }
  /**
   * 获取矩形上坐标，如果大小为负数，将自动翻转 【Get the top coordinate of the rectangle, if the size is negative, it will be flipped automatically】
   * @returns 
   */
  public getTop() : number { return this.h < 0 ? this.y + this.h : this.y; }
  /**
   * 获取矩形坐标
   * @returns 
   */
  public getPoint() : Vector2 { 
    return new Vector2(this.x, this.y);
  }
  /**
   * 获取矩形大小
   * @returns 
   */
  public getSize() : Vector2 { 
    return new Vector2(this.w, this.h);
  }

  private center = new Vector2();

  /**
   * 计算中心点 【Calculation center point】
   * @returns 
   */
  public calcCenter() : Vector2 {
    this.center.x = this.x + this.w / 2;
    this.center.y = this.y + this.h / 2;
    return this.center;
  }

  /**
   * 转为字符串形式
   * @returns 
   */
  public toString() : string {
    return `{x=${this.x},y=${this.y},w=${this.w},h=${this.h}}`;
  }

  /**
   * 使用两个点构造当前矩形 【Construct the current rectangle with two points】
   * @param pt1 
   * @param pt2 
   * @returns 
   */
  public setFrom2Point(pt1 : Vector2, pt2 : Vector2) {
    return Rect.makeBy2Point(this, pt1, pt2);
  }

  /**
   * 使用两个点构造一个矩形 【Construct a rectangle with two points】
   * @param pt1 
   * @param pt2 
   * @returns 
   */
  public static makeBy2Point(rect : Rect, pt1 : Vector2, pt2 : Vector2) : Rect {
    let x1 = 0, x2 = 0, y1 = 0, y2 = 0;
    if(pt1.x <= pt2.x) {
      x1 = pt1.x;
      x2 = pt2.x;
    } else {
      x1 = pt2.x;
      x2 = pt1.x;
    }
    if(pt1.y <= pt2.y) {
      y1 = pt1.y;
      y2 = pt2.y;
    } else {
      y1 = pt2.y;
      y2 = pt1.y;
    }

    rect.set(x1, y1, x2 - x1, y2 - y1);
    return rect;
  }
}

