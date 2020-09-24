import CommonUtils from "../../utils/CommonUtils";
import { BlockRunContextData } from "../WorkProvider/Runner";
import { BlockPort } from "./Port";

export class Connector {
  public startPort : BlockPort;
  public endPort : BlockPort;

  public uid : string;

  public constructor(startPort ?: BlockPort, endPort ?: BlockPort) {
    this.startPort = startPort;
    this.endPort = endPort;
    this.uid = CommonUtils.genNonDuplicateIDHEX(16);
  }

  public paramChangedContext : BlockRunContextData[] = [];

  public deleteParamChangedChangedContext(index : number) {
    this.paramChangedContext.remove(index);
  }
  public checkParamChangedChangedContext(context : BlockRunContextData) {
    let index = -1;
    do {
      index = this.paramChangedContext.indexOf(context);
      if(index >= 0)
        return index;
      if(context.parentContext != null)
        context = context.parentContext.graph == context.graph ? context.parentContext : null;
      else context = null; 
    } while(context != null);

    return index;
  }
}