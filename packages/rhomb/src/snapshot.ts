/**
 * The Snapshot class is used to record property changes.
 * And commit or rollback when necessary.
 */
export class Snapshot<K = PropertyKey, V = any> {
  current: Map<K, V>;
  previous: Map<K, V>;
  changes: Map<K, V> = new Map();

  constructor(initialEntries?: Iterable<readonly [K, V]> | null) {
    this.current = new Map(initialEntries);
    this.previous = new Map(initialEntries);
  }

  get(key: K): V | undefined {
    return this.current.get(key);
  }

  update(key: K, value: V): void {
    this.changes.set(key, value);
    this.current.set(key, value);
  }

  commit(): void {
    this.previous = new Map(this.current);
    this.changes.clear();
  }

  rollback(): void {
    this.current = new Map(this.previous);
    this.changes.clear();
  }
}
