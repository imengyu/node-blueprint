import { Vector2 } from "./Vector2";

export class Rect {
  public x = 0;
  public y = 0;
  public w = 0;
  public h = 0;

  public constructor(x? : number, y? : number, w? : number, h? : number) {
    this.Set(x,y,w,h);
  }

  public Set(x : number | Rect, y? : number, w? : number, h? : number) {
    if(typeof x === "number") this.x = x;
    else if(typeof x == "object") {
      this.x = x.x;
      this.y = x.y;
      this.w = x.w;
      this.h = x.h;
    }
    if(typeof y != "undefined") this.y = y;
    if(typeof w != "undefined") this.w = w;
    if(typeof h != "undefined") this.h = h;
  }

  public testInRectXY(x : number, y : number) {
    return x >= this.getLeft() && y >= this.getTop() 
      && x <= this.getRight() && y <= this.getBottom();
  }
  public testInRect(point : Vector2) {
    return point.x >= this.getLeft() && point.y >= this.getTop() 
      && point.x <= this.getRight() && point.y <= this.getBottom();
  }
  public testRectCross(rect : Rect) {
    let a_cx,a_cy; /* 第一个中心点*/
    let b_cx,b_cy; /* 第二个中心点*/
    
    a_cx = this.x + (this.w/2);
    a_cy = this.y + (this.h/2);

    b_cx = rect.x + (rect.w/2);
    b_cy = rect.y + (rect.h/2);

    return ((Math.abs(a_cx - b_cx) <= (this.w/2 + rect.w/2))
      && (Math.abs(a_cy - b_cy) <= (this.h/2 + rect.h/2)));
  }

  public setPos(pointOrX : Vector2 | number, y?:number) {
    if(typeof pointOrX == "number"){
      this.x = pointOrX;
      this.y = y;
    }else {
      this.x = pointOrX.x;
      this.y = pointOrX.y;
    }
  }
  public setSize(sizeOrX : Vector2 | number, y?:number) {
    if(typeof sizeOrX == "number"){
      this.w = sizeOrX;
      this.h = y;
    }else {
      this.w = sizeOrX.x;
      this.h = sizeOrX.y;
    }
  }

  public expand(v : number) {
    this.x -= v;
    this.y -= v;
    this.w += v * 2;
    this.h += v * 2;
  }
  public multiply(v : number) {
    this.x *= v;
    this.y *= v;
    this.w *= v;
    this.h *= v;
  }

  public getRight() { return this.w < 0 ? this.x : this.x + this.w; }
  public getBottom() { return this.h < 0 ? this.y : this.y + this.h; }
  public getLeft() { return this.w < 0 ? this.x + this.w : this.x; }
  public getTop() { return this.h < 0 ? this.y + this.h : this.y; }

  private center = new Vector2();

  public calcCenter() {
    this.center.x = this.x + this.w / 2;
    this.center.y = this.y + this.h / 2;
    return this.center;
  }
}

