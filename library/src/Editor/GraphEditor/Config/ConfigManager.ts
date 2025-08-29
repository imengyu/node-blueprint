import { inject } from "vue";

export interface NodeGraphEditorStaticConfig {
  maxHistory: number;
}

const defaultStaticConfig : NodeGraphEditorStaticConfig = {
  maxHistory: 50,
};

export const TOP_CONFIG_KEY = Symbol("TopNodeGraphEditorStaticConfig");

/**
 * Editor static config manager
 * @returns 
 */
export function useNodeGraphEditorStaticConfig() {

  const topConfig = inject(TOP_CONFIG_KEY, defaultStaticConfig);

  /**
   * Get a static config from user def or default
   * @param key key
   * @returns 
   */
  function getStaticConfig<T>(key: string) {
    const dict = (topConfig as any as Record<string, unknown>);
    if (typeof dict === "undefined")
      throw new Error(`[NodeGraphEditorStaticConfig] Try get a undefined static config '${key}'.`);
    return dict[key] as T;
  }

  return {
    getStaticConfig,
  }
}