import type { Ref } from "vue";


export function useResizeChecker(
  ref: Ref<HTMLElement|undefined>,
  onWidthChange?: (newWidth: number) => void,
  onHeightChange?: (newHeight: number) => void,
  onSizeChange?: (newWidth: number, newHeight: number) => void,
) {

  let sizeChangeTimer = 0;
  let sizeChangeLastWidth = 0;
  let sizeChangeLastHeight = 0;

  return {
    startResizeChecker() {
      if (sizeChangeTimer > 0)
        clearInterval(sizeChangeTimer);
      sizeChangeTimer = setInterval(() => {
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
      }, 200);
    },
    stopResizeChecker() {
      if (sizeChangeTimer > 0) {
        clearInterval(sizeChangeTimer);
        sizeChangeTimer = 0;
      }
    },
  }
}