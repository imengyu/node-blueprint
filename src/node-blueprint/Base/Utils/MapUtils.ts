export default {
  getOrAddNew<K, V>(map: Map<K, V>, key: K, creation: (_key: K) => V) {
    let v = map.get(key);
    if (!v) {
      v = creation(key);
      map.set(key, v);
    }
    return v;
  },
}