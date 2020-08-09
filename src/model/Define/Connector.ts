import { BlockPort } from "./Port";

export class Connector {
  public startPort : BlockPort;
  public endPort : BlockPort;

  public constructor(startPort ?: BlockPort, endPort ?: BlockPort) {
    if(typeof startPort != 'undefined')
      this.startPort = startPort;
    if(typeof endPort != 'undefined')
      this.endPort = endPort;
  }
}