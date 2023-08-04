import { markRaw } from "vue";
import { PropControlItemRegistry } from "../PropControl";
import NodeParamTypePicker from "./NodeParamTypePicker.vue";

export function registerOtherComponents() {
  PropControlItemRegistry.registerPropControlItemControl('param-type-picker', markRaw(NodeParamTypePicker));
}