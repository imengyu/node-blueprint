import { computed, ref } from "vue";

const MAX_STACK = 50;

export interface GraphOpenStackData {
  graphUid: string,
  nodeUid: string
}

/**
 * 打开图表历史记录
 */
export function useGraphOpenStack(onJump: (data: GraphOpenStackData) => void) {

  const openGraphHistoryStack = ref<GraphOpenStackData[]>([]);
  const openGraphHistoryArrow = ref(0);

  const canGoBack = computed(() => openGraphHistoryStack.value.length > 0 && openGraphHistoryArrow.value > 0);
  const canGoForward = computed(() => openGraphHistoryArrow.value < openGraphHistoryStack.value.length - 1);

  function pushStack(graphUid: string, nodeUid: string) {

    //如果有回退状态，则清除至回退位置
    if (openGraphHistoryArrow.value > 0)
      openGraphHistoryStack.value.splice(openGraphHistoryArrow.value);

    openGraphHistoryStack.value.push({ graphUid, nodeUid });
    openGraphHistoryArrow.value = openGraphHistoryStack.value.length - 1;

    //超出最大容量
    if (openGraphHistoryStack.value.length > MAX_STACK)
      openGraphHistoryStack.value.splice(0, openGraphHistoryStack.value.length - MAX_STACK);
  }
  function backStack() {
    if (openGraphHistoryArrow.value > 0) {
      openGraphHistoryArrow.value--;
      onJump(openGraphHistoryStack.value[openGraphHistoryArrow.value]);
    }
  }
  function forwardStack() {
    if (openGraphHistoryArrow.value < openGraphHistoryStack.value.length - 1) {
      openGraphHistoryArrow.value++;
      onJump(openGraphHistoryStack.value[openGraphHistoryArrow.value]);
    }
  }
  function clearStack() {
    openGraphHistoryStack.value.splice(0);
    openGraphHistoryArrow.value = 0;
  }

  return {
    pushStack,
    backStack,
    forwardStack,
    clearStack,
    openGraphHistoryStack,
    openGraphHistoryArrow,
    canGoBack,
    canGoForward,
  };
}