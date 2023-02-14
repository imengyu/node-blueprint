import { h } from "vue";
import { NodeParamType } from "./NodeParamType";
import type { NodeParamTypeRegistry } from "./NodeParamTypeRegistry";
import BigIntEditor from "../../../Editor/Graph/TypeEditor/BigIntEditor.vue";
import NumberEditor from "../../../Editor/Graph/TypeEditor/NumberEditor.vue";
import BooleanEditor from "../../../Editor/Graph/TypeEditor/BooleanEditor.vue";
import StringEditor from "../../../Editor/Graph/TypeEditor/StringEditor.vue";

/**
 * 注册系统的自定义类型
 * @param registry 
 */
export function registerInternalTypes(registry: NodeParamTypeRegistry) {
  NodeParamType.Number = registry.registerType('number', {
    baseType: 'number',
    inheritType: null,
    defaultValue: () => 0,
    typeColor: '#9ee444',
    typeDescription: '',
    typeTitle: '数字',
    typeEditor: (props) => h(NumberEditor, props),
  });
  NodeParamType.Boolean = registry.registerType('boolean', {
    baseType: 'boolean',
    inheritType: null,
    defaultValue: () => false,
    typeColor: '#b40000',
    typeDescription: '',
    typeTitle: '布尔值',
    typeEditor: (props) => h(BooleanEditor, props),
  });
  NodeParamType.String = registry.registerType('string', {
    baseType: 'string',
    inheritType: null,
    defaultValue: () => '',
    typeColor: '#ff1493',
    typeDescription: '',
    typeTitle: '字符串',
    typeEditor: (props) => h(StringEditor, props),
  });
  NodeParamType.Execute = registry.registerType('execute', {
    baseType: 'execute',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '#fff',
    typeDescription: '',
    typeTitle: '执行',
  });
  NodeParamType.Any = registry.registerType('any', {
    baseType: 'any',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '#fff',
    typeDescription: '',
    typeTitle: '通配符',
  });
}