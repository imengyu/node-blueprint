import type { NodeGraphEditorInternalContext } from "../NodeGraphEditor";

export function useEditorBasicController(context: NodeGraphEditorInternalContext) {

  if (!context.internalManager)
    context.internalManager = {
      holdDataMap: new Map<string, unknown>(),
    } as any;

  context.holdData = <T>(name: string, intitalValue: T) => {
    const map = context.internalManager.holdDataMap;
    if (map.has(name)) 
      return map.get(name) as T;
    map.set(name, intitalValue);
    return intitalValue;
  }
  context.unHoldData = (name) => {
    const map = context.internalManager.holdDataMap;
    map.delete(name);
  };

  return {
  }
}