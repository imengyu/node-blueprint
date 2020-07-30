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
}

export var ZeroVector2 = new Vector2();