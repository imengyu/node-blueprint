import { printError } from "@/Utils/Logger/DevLog";
import ObjectUtils from "@/Utils/ObjectUtils";
import { NodeParamTypeRegistry } from "./NodeParamTypeRegistry";

const TAG = 'NodeParamTypeRegistry';

/**
 * Base types
 */
export type NodeParamBaseTypes = 
  | "execute"
  | 'string'
  | 'boolean'
  | 'number'
  | 'object'
  | 'enum'
  | 'null';

/**
 * Type instance
 */
export class NodeParamType {

  typeName = '';
  genericCount = 0;
  genericTypes: NodeParamType[] = [];
  baseType: NodeParamBaseTypes = 'null';

  define : NodeParamTypeDefine|null = null;

  /**
   * Create Type instance
   * @param typeDefineStringOrInstance Type definition string or another type instance
   */
  constructor(typeDefineStringOrInstance: string|NodeParamType) {
    if (typeof typeDefineStringOrInstance === 'string') {
      const str = typeDefineStringOrInstance.split('@');
      this.baseType = str[0] as NodeParamBaseTypes;
      this.typeName = str[1];
      this.typeName = str[2];
      str[3].split(',').forEach((typeStr) => this.genericTypes.push(new NodeParamType(typeStr)));

      const typeData = NodeParamTypeRegistry.getInstance().getCustomType(this.baseType);
      if (!typeData) {
        printError(TAG, '')
        return;
      }


    } else {
      this.typeName = typeDefineStringOrInstance.typeName;
      this.baseType = typeDefineStringOrInstance.baseType;
      this.genericCount = typeDefineStringOrInstance.genericCount;
      this.define = typeDefineStringOrInstance.define;
      this.genericTypes = ObjectUtils.clone(typeDefineStringOrInstance.genericTypes, true);
    }
  }

  /**
   * 
   * @returns 
   */
  toString() : string {
    return `${this.baseType}@${this.typeName}@${this.genericCount}@${this.genericTypes.join(',')}`;
  }
}

export interface NodeParamTypeDefine {
  genericTypes: NodeParamType[];
  genericCount: number;
  typeDefaultValue: () => unknown;
  typeColor: string;
  typeDescription: string;
  typeTitle: string;
}