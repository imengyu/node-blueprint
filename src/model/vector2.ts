export class Vector2 {
  public x = 0;
  public y = 0;

  public constructor(x? : number, y? : number) {
    if(typeof x != "undefined") this.x = x;
    if(typeof y != "undefined") this.y = y;
  }
  
  public Set(x : number | Vector2, y? : number) {
    if(typeof x === "number") this.x = x;
    else if(typeof x == "object") {
      this.x = x.x;
      this.y = x.y;
    }
    if(typeof y != "undefined") this.y = y;
  }
  public clone() {
    return new Vector2(this.x, this.y);
  }
  public multiply(v : number) {
    this.x *= v;
    this.y *= v;
    return this;
  }
  public substract(v : number|Vector2) {
    if(typeof v === "number") {
      this.x -= v;
      this.y -= v;
    }
    else if(typeof v == "object") {
      this.x -= v.x;
      this.y -= v.y;
    }
    return this;
  }
  public divide(v : number) {
    this.x /= v;
    this.y /= v;
    return this;
  }
  public equal(another : Vector2) {
    return this.x == another.x && this.y == another.y;
  }
}

export var ZeroVector2 = new Vector2();