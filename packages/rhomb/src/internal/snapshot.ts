/**
 * The Snapshot class is used to record property changes.
 * And commit or rollback when necessary.
 */
export class Snapshot<K = PropertyKey, V = any> {
  current: Map<K, V>;
  previous: Map<K, V>;
  changes: Map<K, V> = new Map();
  hasChanged = false;

  constructor(initialEntries?: Iterable<readonly [K, V]>) {
    const initialMap = new Map(initialEntries);
    this.current = initialMap;
    this.previous = initialMap;
  }

  get(key: K): V | undefined {
    return this.current.get(key);
  }

  update(key: K, value: V): void {
    this.changes.set(key, value);

    if (!this.hasChanged) {
      this.current = new Map(this.current);
    }

    this.current.set(key, value);
    this.hasChanged = true;
  }

  commit(): void {
    if (!this.changes.size) {
      return;
    }
    this.hasChanged = false;
    this.previous = this.current;
    this.changes.clear();
  }

  rollback(): void {
    this.hasChanged = false;
    this.current = this.previous;
    this.changes.clear();
  }
}
