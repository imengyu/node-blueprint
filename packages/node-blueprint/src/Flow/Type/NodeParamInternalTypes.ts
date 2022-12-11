import { NodeParamType } from "./NodeParamType";
import { NodeParamTypeRegistry } from "./NodeParamTypeRegistry";

/**
 * 注册系统的自定义类型
 * @param registry 
 */
export function registerInternalTypes(registry: NodeParamTypeRegistry) {
  NodeParamType.Number = registry.registerType('number', {
    baseType: 'number',
    inheritType: null,
    defaultValue: () => 0,
    typeColor: '',
    typeDescription: '',
    typeTitle: '',
  });
  NodeParamType.Boolean = registry.registerType('boolean', {
    baseType: 'boolean',
    inheritType: null,
    defaultValue: () => false,
    typeColor: '',
    typeDescription: '',
    typeTitle: '',
  });
  NodeParamType.String = registry.registerType('string', {
    baseType: 'string',
    inheritType: null,
    defaultValue: () => '',
    typeColor: '',
    typeDescription: '',
    typeTitle: '',
  });
  NodeParamType.Execute = registry.registerType('execute', {
    baseType: 'execute',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '',
    typeDescription: '',
    typeTitle: '',
  });
  NodeParamType.Any = registry.registerType('any', {
    baseType: 'any',
    inheritType: null,
    defaultValue: () => null,
    typeColor: '',
    typeDescription: '',
    typeTitle: '',
  });
}