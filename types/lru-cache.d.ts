declare module "lru-cache" {
  export default class LRUCache<K, V> {
    constructor(opts: { max: number });
    get(key: K): V | undefined;
    set(key: K, value: V): void;
  }
}
