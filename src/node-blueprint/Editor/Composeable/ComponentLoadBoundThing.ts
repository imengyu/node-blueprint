import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";

export function useComponentLoadBoundThing<T>(
  watchSource: Ref<T>,
  onLoad: (source: T) => void,
  onUnLoad: (source: T) => void,
) {
  watch(watchSource, (newValue, oldValue) => {
    onUnLoad(oldValue);
    onLoad(newValue);
  })
  onMounted(() => {
    onLoad(watchSource.value);
  });
  onBeforeUnmount(() => {
    onUnLoad(watchSource.value);
  })
}