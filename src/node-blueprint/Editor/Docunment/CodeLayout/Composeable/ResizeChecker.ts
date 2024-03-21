import ArrayUtils from "@/node-blueprint/Base/Utils/ArrayUtils";
import { SimpleTimer } from "@/node-blueprint/Base/Utils/Timer/Timer";
import type { Ref } from "vue";

const globalResizeCheckerList = [] as (() => void)[];
const globalResizeCheckerTimer = new SimpleTimer(globalResizeCheckerList, () => {
  for (const cb of globalResizeCheckerList)
    cb();
}, 100);

export function useResizeChecker(
  ref: Ref<HTMLElement|undefined>,
  onWidthChange?: (newWidth: number) => void,
  onHeightChange?: (newHeight: number) => void,
  onSizeChange?: (newWidth: number, newHeight: number) => void,
) {

  let sizeChangeLastWidth = 0;
  let sizeChangeLastHeight = 0;

  function checkerCallback() {
    if (ref.value) {
      if (onWidthChange && sizeChangeLastWidth !== ref.value.offsetWidth)
        onWidthChange(ref.value.offsetWidth);
      if (onHeightChange && sizeChangeLastHeight !== ref.value.offsetHeight)
        onHeightChange(ref.value.offsetHeight);
      if (onSizeChange && (sizeChangeLastWidth !== ref.value.offsetWidth || sizeChangeLastHeight !== ref.value.offsetHeight))
        onSizeChange(ref.value.offsetWidth, ref.value.offsetHeight);
      sizeChangeLastWidth = ref.value.offsetWidth;
      sizeChangeLastHeight = ref.value.offsetHeight;
    }
  }

  return {
    startResizeChecker() {
      globalResizeCheckerTimer.start();
      globalResizeCheckerList.push(checkerCallback);
    },
    stopResizeChecker() {
      ArrayUtils.remove(globalResizeCheckerList, checkerCallback);
      if (globalResizeCheckerList.length === 0)
        globalResizeCheckerTimer.stop();
    },
  }
}