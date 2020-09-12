import { BlockPort } from "./Port";

export class Connector {
  public startPort : BlockPort;
  public endPort : BlockPort;

  public constructor(startPort ?: BlockPort, endPort ?: BlockPort) {
    this.startPort = startPort;
    this.endPort = endPort;
  }
}