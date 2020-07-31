import { BlockPort } from "./port";
import { Rect } from "./rect";
import CanvasUtils from "../utils/CanvasUtils";

export class Connector {
  public startPort : BlockPort;
  public endPort : BlockPort;

  public selected = false;
  public hover = false;

  private rect = new Rect();

  public getRect() {
    let posStart = this.startPort.getPosition();
    let posEnd = this.endPort.getPosition();
    if(posStart.x > posEnd.x && posStart.y > posEnd.y) {
      this.rect.setPos(posEnd);
      this.rect.setSize(posStart.x - posEnd.x, posStart.y - posEnd.y);
    }else {
      this.rect.setPos(posStart);
      this.rect.setSize(posEnd.x - posStart.x, posEnd.y - posStart.y);
    }
    
    return this.rect;
  }

  public draw(ctx : CanvasRenderingContext2D, viewPort: Rect, viewZoom : number) {
    CanvasUtils.drawConnectorBezierCurve(ctx, this.startPort.getPosition(), this.endPort.getPosition(), viewPort, viewZoom);
  }
}