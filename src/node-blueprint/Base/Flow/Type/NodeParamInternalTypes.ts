import { h } from "vue";
import { NodeParamType, type NodeParamEditorCreateCallback, type NodeParamTypeDefine } from "./NodeParamType";
import type { NodeParamTypeRegistry } from "./NodeParamTypeRegistry";
import BigIntEditor from "../../../Editor/Graph/TypeEditor/BigIntEditor.vue";
import NumberEditor from "../../../Editor/Graph/TypeEditor/NumberEditor.vue";
import BooleanEditor from "../../../Editor/Graph/TypeEditor/BooleanEditor.vue";
import StringEditor from "../../../Editor/Graph/TypeEditor/StringEditor.vue";
import EnumEditor from "../../../Editor/Graph/TypeEditor/EnumEditor.vue";

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
  NodeParamType.Bigint = registry.registerType('bigint', {
    baseType: 'number',
    inheritType: null,
    defaultValue: () => 0,
    typeColor: '#40d444',
    typeDescription: '',
    typeTitle: '大数字',
    typeEditor: (props) => h(BigIntEditor, props),
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
  NodeParamType.Object = registry.registerType('object', {
    baseType: 'object',
    inheritType: null,
    defaultValue: () => false,
    typeColor: '#0660f0',
    typeDescription: '',
    typeTitle: '对象',
  });
  NodeParamType.Array = registry.registerType('array', {
    baseType: 'object',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '#fff',
    typeDescription: '可以将同一类型的多个变量存储在一个数组数据结构中。',
    typeTitle: '数组',
    typeCreate(type) {
      return registry.registerType(type.name + '<any>', {
        ...type.define as NodeParamTypeDefine,
        hiddenInChoosePanel: true,
      });
    },
    typeGenericNameMerger: (genericNames, source) => genericNames[0] + source,
    typeGenericPickerOption() {
      return {
        canBeAny: true,
        canBeExecute: false,
        canBeNoHash: true,
        canBeContainer: true,
      };
    },
    typeColorMerger: (type) => (type.genericTypes.length === 1 ? type.genericTypes[0].define?.typeColor : '') || '#fff',
  });
  NodeParamType.Set = registry.registerType('set', {
    baseType: 'object',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '#fff',
    typeDescription: '集是一种元素不重复的数据结构',
    typeTitle: '集',
    typeCreate(type) {
      return registry.registerType(type.name + '<any>', {
        ...type.define as NodeParamTypeDefine,
        hiddenInChoosePanel: true,
      });
    },
    typeGenericPickerOption() {
      return {
        canBeAny: true,
        canBeExecute: false,
        canBeNoHash: true,
        canBeContainer: true,
      };
    },
    typeGenericNameMerger: (genericNames, source) => genericNames[0] + source,
    typeColorMerger: (type) => (type.genericTypes.length === 1 ? type.genericTypes[0].define?.typeColor : '') || '#fff',
  });
  NodeParamType.Dictionary = registry.registerType('dictionary', {
    baseType: 'object',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '#fff',
    typeDescription: '映射表示键和值的一对一映射集合。',
    typeTitle: '映射',
    typeCreate(type) {
      return registry.registerType(type.name + '<any,any>', {
        ...type.define as NodeParamTypeDefine,
        hiddenInChoosePanel: true,
      });
    },
    typeGenericPickerOption(i) {
      if (i === 0) {
        return {
          canBeAny: true,
          canBeExecute: false,
          canBeNoHash: false,
          canBeContainer: false,
        };
      }
      return {
        canBeAny: true,
        canBeExecute: false,
        canBeNoHash: true,
        canBeContainer: false,
      };
    },
    typeColorMerger: (type) => (type.genericTypes.length === 2 ? type.genericTypes[1].define?.typeColor : '') || '#fff',
    typeGenericNameMerger: (genericNames, source) => {
      if (genericNames.length === 2)
        return genericNames[0] + ' 映射到 ' + genericNames[1];
      return source;
    },
  });
}

/**
 * 创建自动枚举的编辑器
 * @param enumOptions 
 */
export function createEnumInternalEditor(enumOptions: string[]) : NodeParamEditorCreateCallback {
  return (props) => h(EnumEditor, { options: enumOptions, ...props });
}