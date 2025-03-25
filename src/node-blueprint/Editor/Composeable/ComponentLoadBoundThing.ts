import { onBeforeUnmount, onMounted, watch, type Ref } from "vue";

/**
 * 该函数用于处理组件加载和卸载时的逻辑绑定。
 * 它会监听 `watchSource` 的变化，当 `watchSource` 发生变化时，会先调用 `onUnLoad` 处理旧值，再调用 `onLoad` 处理新值。
 * 在组件挂载时，会调用 `onLoad` 处理当前值；在组件卸载前，会调用 `onUnLoad` 处理当前值。
 *
 * @template T - 监听源的类型。
 * @param watchSource - 要监听的响应式引用。
 * @param onLoad - 当组件加载或监听源变化时调用的回调函数。
 * @param onUnLoad - 当组件卸载或监听源变化时调用的回调函数。
 */
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