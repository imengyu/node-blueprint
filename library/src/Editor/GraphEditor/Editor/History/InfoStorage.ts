import { DevAssert } from "@/node-blueprint/Base/Logger/Assert";
import { CreateObjectFactory } from "@/node-blueprint/Base/Serializable/SerializableFactory";
import { SerializableObject } from "@/node-blueprint/Base/Serializable/SerializableObject";
import type { NodeGraphEditorInternalContext } from "../../NodeGraphEditor";
import type { NodeConnectorEditor } from "../Flow/NodeConnectorEditor";
import type { NodeEditor } from "../Flow/NodeEditor";
import type { NodePortEditor } from "../Flow/NodePortEditor";
import type { NodeGraph } from "@/Core/Graph/NodeGraph";

export type EditorHistoryStoreChangedPropertyFn<T, K> = (oldValue: K, instance: T) => K;
/**
 * 用于管理可撤销操作中的目标对象。
 * 
 * 本类用于暂时保存一些操作对象，例如节点，端口，连接线，
 * 并使用与实例无关的信息例如UID进行保存，以实现在撤销与恢复等步骤中
 * 可以引用到正确的实例。
 */
export class EditorHistoryInfoStorager<T = any> {
  public constructor(context: NodeGraphEditorInternalContext) {
    this.context = context;
  }

  protected readonly context: NodeGraphEditorInternalContext;
  protected storedChangedProperties = new Map<string, {
    value: unknown,
    needSerialize: boolean,
    serializeObjectName: string,
  }>();
  protected requestInstanceInternal : (() => T|null)|undefined;
  private lastInstance : T|undefined;

  /**
   * 尝试获取当前信息所对应的实体。当无法获取实体时，将抛出异常。
   * @returns 
   */
  requestInstance() : T {
    const instance = this.requestInstanceInternal?.();
    DevAssert(instance, `Failed to get node instance`);
    this.lastInstance = instance as T;
    return instance as T;
  }
  /**
   * 存储当前管理目标对象的一个属性修改
   * @param name 属性名称。
   * @param newValue 新值，可以是值或者是回调函数。回调函数允许获取旧值与当前实例。
   * @param valueSerializeScheme 用于对象值序列化时使用的预设。
   */
  storeChangedProperty<K>(
    name: string, 
    newValueOrCallbackFun: EditorHistoryStoreChangedPropertyFn<T, K>|K, 
    valueSerializeScheme?: string
  ) {
    const instance = this.requestInstance() as any;
    const oldValue = instance[name];
    const storeData = {
      value: null,
      needSerialize: false,
      serializeObjectName: '',
    };


    let finalNewValue;
    if (typeof newValueOrCallbackFun === 'function')
      finalNewValue = (newValueOrCallbackFun as EditorHistoryStoreChangedPropertyFn<T, K>)(oldValue as K, instance);
    else
      finalNewValue = newValueOrCallbackFun;

    //对象类型的需要序列化
    if (typeof oldValue === 'object' && oldValue instanceof SerializableObject) {
      storeData.needSerialize = true;
      storeData.value = oldValue.save(valueSerializeScheme);
      storeData.serializeObjectName = oldValue.serializeClassName;
    }

    this.storedChangedProperties.set(name, storeData);
    instance[name] = finalNewValue;
    return this;
  }
  /**
   * 更改后回调
   * @param cb 
   * @returns 
   */
  afterChanged(cb: (instance: T) => void) {
    if (!this.lastInstance)
      throw new Error(`lastInstance missing!`);
    cb(this.lastInstance);
    return this;
  }
  /**
   * 恢复当前管理目标对象的一个属性修改
   * @param name 属性名称
   */
  restoreChangedProperty(name: string) {
    const instance = this.requestInstance() as any;
    DevAssert(this.storedChangedProperties.has(name), `ChangedProperty does not contains ${name}.`)

    const storeData = this.storedChangedProperties.get(name);
    if (!storeData)
      throw new Error();

    //反序列化对象
    if (storeData.needSerialize) {
      storeData.value = CreateObjectFactory.createSerializableObject(
        storeData.serializeObjectName, 
        null, 
        storeData.value
      );
    }

    instance[name] = storeData.value;
    return this;
  }
  /**
   * 恢复当前管理目标对象的全部属性修改
   */
  restoreAllChangedProperty() {
    for (const element of this.storedChangedProperties) 
      this.restoreChangedProperty(element[0]);
  }
}
export class EditorHistoryNodeInfo extends EditorHistoryInfoStorager<NodeEditor> {
  private uid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodeEditor) {
    super(context);
    this.uid = node.uid;
    this.requestInstanceInternal = () => this.context.graphManager.getNodeByUid(this.uid);
  }
}
export class EditorHistoryNodePortInfo extends EditorHistoryInfoStorager<NodePortEditor> {
  private nodeUid: string;
  private portUid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodePortEditor) {
    super(context);
    this.nodeUid = node.parent.uid;
    this.portUid = node.guid;
    this.requestInstanceInternal = () => this.context.graphManager.getNodePortByUid(this.nodeUid, this.portUid);
  }
}
export class EditorHistoryNodeConnectorInfo extends EditorHistoryInfoStorager<NodeConnectorEditor> {
  private uid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodeConnectorEditor) {
    super(context);
    this.uid = node.uid;
    this.requestInstanceInternal = () => this.context.graphManager.getConnectorByUid(this.uid);
  }
}
export class EditorHistoryNodeGraphInfo extends EditorHistoryInfoStorager<NodeGraph> {
  private uid: string;
  constructor(context: NodeGraphEditorInternalContext, node: NodeGraph) {
    super(context);
    this.uid = node.uid;
    this.requestInstanceInternal = () => this.context.graphManager.getDocGraphByUid(this.uid);
  }
}
