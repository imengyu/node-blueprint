import type { Node } from "@/node-blueprint/Base/Flow/Node/Node";
import { ref } from "vue";

export function useEditorGraphController() {

  const foregroundNodes = ref<Node[]>([]);
  const backgroundNodes = ref<Node[]>([]);



  return {
    foregroundNodes,
    backgroundNodes,
  }
}