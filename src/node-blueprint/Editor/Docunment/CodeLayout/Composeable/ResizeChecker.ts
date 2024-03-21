import type { Ref } from "vue";
import { createMiniTimer } from "./MiniTimeout";

const globalResizeCheckerList = [] as (() => void)[];
const globalResizeCheckerTimer = createMiniTimer(100, () => {
  for (const cb of globalResizeCheckerList)
    cb();
});

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
      const index = globalResizeCheckerList.indexOf(checkerCallback);
      if (index >= 0)
        globalResizeCheckerList.splice(index, 1);
      if (globalResizeCheckerList.length === 0)
        globalResizeCheckerTimer.stop();
    },
  }
}